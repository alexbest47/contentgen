import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function completeTask(taskId: string, result: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb.from("task_queue").update({ status: "completed", completed_at: new Date().toISOString(), result }).eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` }, body: JSON.stringify({ trigger: true }) }).catch(() => {});
}

async function failTask(taskId: string, errorMessage: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb.from("task_queue").update({ status: "error", completed_at: new Date().toISOString(), error_message: errorMessage?.substring(0, 2000) || "Unknown error" }).eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` }, body: JSON.stringify({ trigger: true }) }).catch(() => {});
}

function extractJsonFromResponse(content: string): unknown {
  let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error("No JSON object found in response");
  cleaned = cleaned.substring(jsonStart);
  try { return JSON.parse(cleaned); } catch {}
  let fixed = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : "");
  try { return JSON.parse(fixed); } catch {}
  fixed = fixed.replace(/,\s*"[^"]*":\s*"[^"]*$/, "").replace(/,\s*"[^"]*$/, "").replace(/,\s*$/, "");
  let braces = 0, brackets = 0, inString = false, escape = false;
  for (const ch of fixed) { if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; } if (ch === '"') { inString = !inString; continue; } if (inString) continue; if (ch === "{") braces++; if (ch === "}") braces--; if (ch === "[") brackets++; if (ch === "]") brackets--; }
  if (inString) fixed += '"';
  while (brackets > 0) { fixed += "]"; brackets--; }
  while (braces > 0) { fixed += "}"; braces--; }
  try { return JSON.parse(fixed); } catch {}
  throw new Error("Could not extract valid JSON from response");
}

async function checkCancelled(supabase: any, diagnosticId: string): Promise<boolean> {
  const { data } = await supabase.from("diagnostics").select("status").eq("id", diagnosticId).single();
  return data?.status === "error";
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, model: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: model || "claude-sonnet-4-20250514", max_tokens: 64000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  if (!response.ok) { const errText = await response.text(); console.error("Claude API error:", response.status, errText); throw new Error(`Claude API error: ${response.status}`); }
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

function buildUserPrompt(template: string, vars: Record<string, string>, outputHint?: string): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) { result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value); }
  if (outputHint) result += "\n\n" + outputHint;
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    const { diagnostic_id, program_id, name, description, audience_tags } = body;

    let diagnosticDocDescription = "";
    const { data: diagData } = await supabase.from("diagnostics").select("doc_url").eq("id", diagnostic_id).single();
    if (diagData?.doc_url) {
      try { const docMatch = diagData.doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/); if (docMatch) { const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`; const docResponse = await fetch(exportUrl); if (docResponse.ok) diagnosticDocDescription = await docResponse.text(); } } catch (e) { console.error("Error fetching diagnostic doc:", e); }
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const { data: prompts, error: promptsErr } = await supabase.from("prompts").select("*").eq("category", "test_generation").eq("is_active", true).order("step_order");
    if (promptsErr || !prompts || prompts.length === 0) throw new Error("No active test_generation prompts found");

    const prompt1 = prompts.find((p: any) => p.name.includes("теста")) || prompts[0];
    const prompt2 = prompts.find((p: any) => p.name.includes("карт")) || (prompts.length > 1 ? prompts[1] : null);

    const { data: program } = await supabase.from("paid_programs").select("title, description, audience_description, program_doc_url").eq("id", program_id).single();

    let programDocDescription = "";
    if (program?.program_doc_url) {
      try { const docMatch = program.program_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/); if (docMatch) { const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`; const docResponse = await fetch(exportUrl); if (docResponse.ok) programDocDescription = await docResponse.text(); } } catch (e) { console.error("Error fetching program doc:", e); }
    }

    const templateVars: Record<string, string> = {
      program_title: program?.title || "", program_description: program?.description || "", audience_description: program?.audience_description || "",
      offer_title: name || "", offer_value: description || "", offer_description: diagnosticDocDescription, offer_image: "", program_doc_description: programDocDescription, test_description: diagnosticDocDescription,
    };

    console.log(`[pipeline] Step 1: Calling Claude for quiz (diagnostic ${diagnostic_id})`);
    const userPrompt1 = buildUserPrompt(prompt1.user_prompt_template, templateVars, prompt1.output_format_hint);
    if (!userPrompt1.trim()) throw new Error("Шаблон пользовательского промпта (шаг 1) пуст.");

    const rawContent1 = await callClaude(ANTHROPIC_API_KEY, prompt1.system_prompt, userPrompt1, prompt1.model);

    let fullResponse: any;
    try { fullResponse = extractJsonFromResponse(rawContent1); } catch (parseErr) {
      await supabase.from("diagnostics").update({ status: "error", generation_progress: { error: "Invalid JSON from Claude (step 1)" } }).eq("id", diagnostic_id);
      throw new Error("Claude returned invalid JSON (step 1)");
    }

    const quizPart = fullResponse.quiz || fullResponse;
    const quizString = JSON.stringify(quizPart);
    const placeholderRegex = /\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(quizString)) !== null) placeholders.push(match[1]);

    await supabase.from("diagnostics").update({ quiz_json: quizPart, status: "quiz_generated", generation_progress: { total_images: placeholders.length, completed_images: 0 } }).eq("id", diagnostic_id);

    if (await checkCancelled(supabase, diagnostic_id)) {
      if (taskId) await completeTask(taskId, { success: false, cancelled: true });
      return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (prompt2) {
      fetch(`${SUPABASE_URL}/functions/v1/generate-card-prompt`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify({ diagnostic_id, program_id, name, description, audience_tags }) }).catch((e) => console.error("[pipeline] Failed to trigger card prompt:", e));
    }

    if (placeholders.length === 0) {
      if (!prompt2) await supabase.from("diagnostics").update({ status: "ready", generation_progress: { total_images: 0, completed_images: 0 } }).eq("id", diagnostic_id);
      const responseData = { success: true };
      if (taskId) await completeTask(taskId, responseData);
      return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      await supabase.from("diagnostics").update({ status: "ready", generation_progress: { total_images: placeholders.length, completed_images: 0, error: "OPENROUTER_API_KEY not configured" } }).eq("id", diagnostic_id);
      const responseData = { success: true, warning: "No OPENROUTER_API_KEY" };
      if (taskId) await completeTask(taskId, responseData);
      return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("diagnostics").update({ status: "generating_images", generation_progress: { total_images: placeholders.length, completed_images: 0 } }).eq("id", diagnostic_id);

    fetch(`${SUPABASE_URL}/functions/v1/process-diagnostic-image`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify({ diagnostic_id, image_index: 0, placeholders }) }).catch((e) => console.error("[pipeline] Failed to trigger image chain:", e));

    const responseData = { success: true };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("run-diagnostic-pipeline error:", error);
    try { const { diagnostic_id } = await req.clone().json().catch(() => ({})); if (diagnostic_id) await supabase.from("diagnostics").update({ status: "error", generation_progress: { error: error.message } }).eq("id", diagnostic_id); } catch {}
    if (taskId) await failTask(taskId, error.message).catch(() => {});
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

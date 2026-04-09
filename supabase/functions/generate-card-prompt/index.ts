import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchDocContent(url: string): Promise<string> {
  try {
    if (!url) return "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/fetch-google-doc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ url }),
    });
    if (!resp.ok) {
      console.error(`fetch-google-doc error: ${resp.status} for ${url}`);
      return "";
    }
    const data = await resp.json();
    return data.text || "";
  } catch (e) {
    console.error("Error fetching doc content:", url, e);
  }
  return "";
}

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
  if (jsonStart === -1) return cleaned;
  cleaned = cleaned.substring(jsonStart);
  try { return JSON.parse(cleaned); } catch {}
  return cleaned;
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
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let taskId: string | null = null;

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const body = await req.json();
    taskId = body._task_id || null;
    const { diagnostic_id, program_id, name, description, audience_tags } = body;
    console.log(`[card-prompt] Starting for diagnostic ${diagnostic_id}`);

    const { data: diag } = await supabase.from("diagnostics").select("status").eq("id", diagnostic_id).single();
    if (diag?.status === "error") {
      if (taskId) await completeTask(taskId, { success: false, cancelled: true });
      return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: prompts, error: promptsErr } = await supabase.from("prompts").select("*").eq("category", "test_generation").eq("is_active", true).order("step_order");
    if (promptsErr || !prompts || prompts.length === 0) throw new Error("No active test_generation prompts found");

    const prompt2 = prompts.find((p: any) => p.name.includes("карт"));
    if (!prompt2) {
      if (taskId) await completeTask(taskId, { success: true, skipped: true });
      return new Response(JSON.stringify({ success: true, skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: program } = await supabase.from("paid_programs").select("title, description, audience_description, audience_doc_url, program_doc_url").eq("id", program_id).single();

    // Always fetch fresh audience description from URL, fallback to cached
    let audienceDescription = "";
    if (program?.audience_doc_url) {
      try {
        audienceDescription = await fetchDocContent(program.audience_doc_url);
        if (audienceDescription) {
          await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
        }
      } catch (e) { console.error("[card-prompt] Error fetching audience doc:", e); }
    }
    if (!audienceDescription) audienceDescription = program?.audience_description || "";

    let programDocDescription = "";
    if (program?.program_doc_url) {
      try { programDocDescription = await fetchDocContent(program.program_doc_url); } catch (e) { console.error("[card-prompt] Error fetching program doc:", e); }
    }

    let diagnosticDocDescription = "";
    const { data: diagDoc } = await supabase.from("diagnostics").select("doc_url").eq("id", diagnostic_id).single();
    if (diagDoc?.doc_url) {
      try { diagnosticDocDescription = await fetchDocContent(diagDoc.doc_url); } catch (e) { console.error("[card-prompt] Error fetching diagnostic doc:", e); }
    }

    const templateVars: Record<string, string> = {
      program_title: program?.title || "", program_description: program?.description || "", audience_description: audienceDescription,
      offer_title: name || "", offer_value: description || "", offer_description: diagnosticDocDescription, program_doc_description: programDocDescription,
    };

    const userPrompt = buildUserPrompt(prompt2.user_prompt_template, templateVars, prompt2.output_format_hint);
    if (!userPrompt.trim()) throw new Error("Card prompt user template is empty");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: prompt2.model || "claude-sonnet-4-20250514", max_tokens: 64000, system: prompt2.system_prompt, messages: [{ role: "user", content: userPrompt }] }),
    });

    if (!response.ok) { const errText = await response.text(); throw new Error(`Claude API error: ${response.status}`); }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || "";

    let cardPromptValue: string;
    try { const parsed = extractJsonFromResponse(rawContent); cardPromptValue = typeof parsed === "string" ? parsed : JSON.stringify(parsed); } catch { cardPromptValue = rawContent.replace(/```[a-z]*\s*/gi, "").replace(/```\s*/g, "").trim(); }

    const { data: currentDiag } = await supabase.from("diagnostics").select("status, generation_progress").eq("id", diagnostic_id).single();
    if (currentDiag?.status === "error") {
      if (taskId) await completeTask(taskId, { success: false, cancelled: true });
      return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const allImagesDone = currentDiag?.status === "images_done" || currentDiag?.status === "ready";
    await supabase.from("diagnostics").update({ card_prompt: cardPromptValue, ...(allImagesDone ? { status: "ready" } : {}) }).eq("id", diagnostic_id);

    const responseData = { success: true };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[card-prompt] Error:", error);
    if (taskId) await failTask(taskId, error.message).catch(() => {});
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

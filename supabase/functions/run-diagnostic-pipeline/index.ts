import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function extractJsonFromResponse(content: string): unknown {
  let cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try { return JSON.parse(cleaned); } catch {}

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error("No JSON object found in response");

  cleaned = cleaned.substring(jsonStart);
  try { return JSON.parse(cleaned); } catch {}

  let fixed = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : "");
  try { return JSON.parse(fixed); } catch {}

  fixed = fixed.replace(/,\s*"[^"]*":\s*"[^"]*$/, "");
  fixed = fixed.replace(/,\s*"[^"]*$/, "");
  fixed = fixed.replace(/,\s*$/, "");

  let braces = 0, brackets = 0, inString = false, escape = false;
  for (const ch of fixed) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }
  if (inString) fixed += '"';
  while (brackets > 0) { fixed += "]"; brackets--; }
  while (braces > 0) { fixed += "}"; braces--; }
  try { return JSON.parse(fixed); } catch {}

  throw new Error("Could not extract valid JSON from response");
}

async function checkCancelled(supabase: any, diagnosticId: string): Promise<boolean> {
  const { data } = await supabase
    .from("diagnostics")
    .select("status")
    .eq("id", diagnosticId)
    .single();
  return data?.status === "error";
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, model: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Claude API error:", response.status, errText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

function buildUserPrompt(template: string, vars: Record<string, string>, outputHint?: string): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  if (outputHint) {
    result += "\n\n" + outputHint;
  }
  return result;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { diagnostic_id, program_id, name, description, audience_tags } =
      await req.json();

    // Load diagnostic doc_url for Google Doc content
    let diagnosticDocDescription = "";
    const { data: diagData } = await supabase
      .from("diagnostics")
      .select("doc_url")
      .eq("id", diagnostic_id)
      .single();
    if (diagData?.doc_url) {
      try {
        const docMatch = diagData.doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            diagnosticDocDescription = await docResponse.text();
          }
        }
      } catch (e) { console.error("Error fetching diagnostic doc:", e); }
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    // Load all active test_generation prompts ordered by step
    const { data: prompts, error: promptsErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", "test_generation")
      .eq("is_active", true)
      .order("step_order");

    if (promptsErr || !prompts || prompts.length === 0) {
      throw new Error("No active test_generation prompts found");
    }

    const prompt1 = prompts.find((p: any) => p.name.includes("теста")) || prompts[0];
    const prompt2 = prompts.find((p: any) => p.name.includes("карт")) || (prompts.length > 1 ? prompts[1] : null);

    // Load program data
    const { data: program } = await supabase
      .from("paid_programs")
      .select("title, description, audience_description, program_doc_url")
      .eq("id", program_id)
      .single();

    // Fetch program doc
    let programDocDescription = "";
    if (program?.program_doc_url) {
      try {
        const docMatch = program.program_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            programDocDescription = await docResponse.text();
          }
        }
      } catch (e) { console.error("Error fetching program doc:", e); }
    }

    const templateVars: Record<string, string> = {
      program_title: program?.title || "",
      program_description: program?.description || "",
      audience_description: program?.audience_description || "",
      offer_title: name || "",
      offer_description: description || "",
      program_doc_description: programDocDescription,
      test_description: diagnosticDocDescription,
    };

    // ---- Step 1: Generate quiz ----
    console.log(`[pipeline] Step 1: Calling Claude for quiz (diagnostic ${diagnostic_id})`);

    const userPrompt1 = buildUserPrompt(prompt1.user_prompt_template, templateVars, prompt1.output_format_hint);
    if (!userPrompt1.trim()) {
      throw new Error("Шаблон пользовательского промпта (шаг 1) пуст.");
    }

    const rawContent1 = await callClaude(ANTHROPIC_API_KEY, prompt1.system_prompt, userPrompt1, prompt1.model);
    console.log("[pipeline] Step 1 response length:", rawContent1.length);

    let fullResponse: any;
    try {
      fullResponse = extractJsonFromResponse(rawContent1);
    } catch (parseErr) {
      console.error("[pipeline] Step 1 JSON extraction failed. First 500 chars:", rawContent1.substring(0, 500));
      await supabase
        .from("diagnostics")
        .update({ status: "error", generation_progress: { error: "Invalid JSON from Claude (step 1)", raw_preview: rawContent1.substring(0, 300) } })
        .eq("id", diagnostic_id);
      throw new Error("Claude returned invalid JSON (step 1)");
    }

    const quizPart = fullResponse.quiz || fullResponse;

    // Extract image placeholders from quiz
    const quizString = JSON.stringify(quizPart);
    const placeholderRegex = /\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(quizString)) !== null) {
      placeholders.push(match[1]);
    }

    // Save quiz results
    await supabase
      .from("diagnostics")
      .update({
        quiz_json: quizPart,
        status: "quiz_generated",
        generation_progress: { total_images: placeholders.length, completed_images: 0 },
      })
      .eq("id", diagnostic_id);

    console.log(`[pipeline] Step 1 done. ${placeholders.length} image placeholders found.`);

    if (await checkCancelled(supabase, diagnostic_id)) {
      console.log("[pipeline] Cancelled after step 1.");
      return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Steps 2a & 2b: Card prompt + Images — both fire-and-forget ----

    // 2a: Fire-and-forget card prompt generation (separate edge function)
    if (prompt2) {
      console.log(`[pipeline] Step 2a: Triggering generate-card-prompt (fire-and-forget)`);
      fetch(`${SUPABASE_URL}/functions/v1/generate-card-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ diagnostic_id, program_id, name, description, audience_tags }),
      }).catch((e) => console.error("[pipeline] Failed to trigger card prompt:", e));
    }

    // 2b: Image generation chain
    if (placeholders.length === 0) {
      // No images — card prompt function will set status to ready when done
      if (!prompt2) {
        await supabase
          .from("diagnostics")
          .update({ status: "ready", generation_progress: { total_images: 0, completed_images: 0 } })
          .eq("id", diagnostic_id);
        console.log("[pipeline] No images and no card prompt. Status set to ready.");
      } else {
        console.log("[pipeline] No images. Card prompt running independently.");
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      console.error("[pipeline] OPENROUTER_API_KEY not configured, skipping images.");
      await supabase
        .from("diagnostics")
        .update({ status: "ready", generation_progress: { total_images: placeholders.length, completed_images: 0, failed_images: placeholders.length, error: "OPENROUTER_API_KEY not configured" } })
        .eq("id", diagnostic_id);
      return new Response(JSON.stringify({ success: true, warning: "No OPENROUTER_API_KEY" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Set status to generating_images
    await supabase
      .from("diagnostics")
      .update({ status: "generating_images", generation_progress: { total_images: placeholders.length, completed_images: 0 } })
      .eq("id", diagnostic_id);

    // Fire-and-forget: trigger process-diagnostic-image for the first placeholder
    fetch(`${SUPABASE_URL}/functions/v1/process-diagnostic-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        diagnostic_id,
        image_index: 0,
        placeholders,
      }),
    }).catch((e) => console.error("[pipeline] Failed to trigger image chain:", e));

    console.log(`[pipeline] Steps 2a+2b triggered (fire-and-forget). ${placeholders.length} images.`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("run-diagnostic-pipeline error:", error);

    try {
      const { diagnostic_id } = await req.clone().json().catch(() => ({}));
      if (diagnostic_id) {
        await supabase
          .from("diagnostics")
          .update({ status: "error", generation_progress: { error: error.message } })
          .eq("id", diagnostic_id);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

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
  if (jsonStart === -1) return cleaned;

  cleaned = cleaned.substring(jsonStart);
  try { return JSON.parse(cleaned); } catch {}

  return cleaned;
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
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const { diagnostic_id, program_id, name, description, audience_tags } = await req.json();
    console.log(`[card-prompt] Starting for diagnostic ${diagnostic_id}`);

    // Check if cancelled
    const { data: diag } = await supabase
      .from("diagnostics")
      .select("status")
      .eq("id", diagnostic_id)
      .single();

    if (diag?.status === "error") {
      console.log("[card-prompt] Diagnostic cancelled, skipping.");
      return new Response(JSON.stringify({ success: false, cancelled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load card prompt template (prompt with "карт" in name)
    const { data: prompts, error: promptsErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", "test_generation")
      .eq("is_active", true)
      .order("step_order");

    if (promptsErr || !prompts || prompts.length === 0) {
      throw new Error("No active test_generation prompts found");
    }

    const prompt2 = prompts.find((p: any) => p.name.includes("карт"));
    if (!prompt2) {
      console.log("[card-prompt] No card prompt template found, skipping.");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      } catch (e) { console.error("[card-prompt] Error fetching program doc:", e); }
    }

    const templateVars: Record<string, string> = {
      program_title: program?.title || "",
      program_description: program?.description || "",
      audience_description: program?.audience_description || "",
      test_name: name || "",
      test_description: description || "",
      audience_tags: (audience_tags || []).join(", "),
      program_doc_description: programDocDescription,
    };

    const userPrompt = buildUserPrompt(prompt2.user_prompt_template, templateVars, prompt2.output_format_hint);
    if (!userPrompt.trim()) {
      throw new Error("Card prompt user template is empty");
    }

    console.log(`[card-prompt] Calling Claude (model: ${prompt2.model}, prompt length: ${userPrompt.length})`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt2.model || "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: prompt2.system_prompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[card-prompt] Claude API error:", response.status, errText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || "";
    console.log(`[card-prompt] Claude response length: ${rawContent.length}`);

    let cardPromptValue: string;
    try {
      const parsed = extractJsonFromResponse(rawContent);
      cardPromptValue = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch {
      cardPromptValue = rawContent
        .replace(/```[a-z]*\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
    }

    // Save card_prompt and check if images are already done
    const { data: currentDiag } = await supabase
      .from("diagnostics")
      .select("status, generation_progress")
      .eq("id", diagnostic_id)
      .single();

    // If cancelled while we were generating, don't overwrite
    if (currentDiag?.status === "error") {
      console.log("[card-prompt] Diagnostic was cancelled during generation, not saving.");
      return new Response(JSON.stringify({ success: false, cancelled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const progress = currentDiag?.generation_progress as any;
    const imagesTotal = progress?.total_images || 0;
    const imagesDone = (progress?.completed_images || 0) + (progress?.failed_images || 0);
    const allImagesDone = imagesTotal === 0 || imagesDone >= imagesTotal;

    // If all images are done too, set status to ready; otherwise just save card_prompt
    const newStatus = allImagesDone ? "ready" : currentDiag?.status;

    await supabase
      .from("diagnostics")
      .update({ card_prompt: cardPromptValue, ...(allImagesDone ? { status: "ready" } : {}) })
      .eq("id", diagnostic_id);

    console.log(`[card-prompt] Card prompt saved. Images done: ${allImagesDone}. Status: ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[card-prompt] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

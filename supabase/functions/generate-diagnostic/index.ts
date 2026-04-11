import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function fetchDocContent(docUrl: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${supabaseUrl}/functions/v1/fetch-google-doc`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify({ url: docUrl }),
  });
  if (!res.ok) { console.error("fetch-google-doc error:", res.status, await res.text()); return ""; }
  const data = await res.json();
  return data.text || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnostic_id, program_id, name, description, audience_tags, prompt_id } =
      await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Load diagnostic doc_url content (supports Google Docs and Talentsy KB)
    let diagnosticDocDescription = "";
    const { data: diagData } = await supabase
      .from("diagnostics")
      .select("doc_url")
      .eq("id", diagnostic_id)
      .single();
    if (diagData?.doc_url) {
      try { diagnosticDocDescription = await fetchDocContent(diagData.doc_url); } catch (e) { console.error("Error fetching diagnostic doc:", e); }
    }

    // Load prompt
    const { data: prompt, error: promptErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", prompt_id)
      .single();

    if (promptErr || !prompt) {
      throw new Error("Prompt not found: " + (promptErr?.message || "missing"));
    }

    // Load program title
    const { data: program } = await supabase
      .from("paid_programs")
      .select("title, description, audience_description, audience_doc_url, program_doc_url")
      .eq("id", program_id)
      .single();

    const programTitle = program?.title || "";

    // Always fetch fresh audience description from URL, fallback to cached
    let audienceDescription = "";
    if (program?.audience_doc_url) {
      try {
        audienceDescription = await fetchDocContent(program.audience_doc_url);
        if (audienceDescription) {
          await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
        }
      } catch (e) { console.error("Error fetching audience doc:", e); }
    }
    if (!audienceDescription) audienceDescription = program?.audience_description || "";

    // Fetch program description (supports Google Docs and Talentsy KB)
    let programDocDescription = "";
    if (program?.program_doc_url) {
      try { programDocDescription = await fetchDocContent(program.program_doc_url); } catch (e) { console.error("Error fetching program doc:", e); }
    }

    // Build user prompt with variable substitution
    let userPrompt = (prompt.user_prompt_template || "")
      .replace(/\{\{program_title\}\}/g, programTitle)
      .replace(/\{\{program_description\}\}/g, program?.description || "")
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{test_name\}\}/g, name || "")
      .replace(/\{\{test_description\}\}/g, diagnosticDocDescription || description || "")
      .replace(/\{\{audience_tags\}\}/g, (audience_tags || []).join(", "))
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription);

    if (prompt.output_format_hint) {
      userPrompt += "\n\n" + prompt.output_format_hint;
    }

    if (!userPrompt.trim()) {
      throw new Error("Шаблон пользовательского промпта пуст. Заполните поле в карточке промпта.");
    }

    console.log("Calling Claude with model:", prompt.model);
    console.log("User prompt length:", userPrompt.length);

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: prompt.system_prompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawContent = claudeData.content?.[0]?.text || "";

    // Extract JSON from response (may be wrapped in ```json ... ```)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let quizJson: any;
    try {
      quizJson = JSON.parse(jsonStr);
    } catch {
      // Update diagnostic with error
      await supabase
        .from("diagnostics")
        .update({ status: "error" })
        .eq("id", diagnostic_id);
      throw new Error("Claude returned invalid JSON");
    }

    // Find all image placeholders with new format {{IMAGE:PROMPT=...}}
    const quizJsonString = JSON.stringify(quizJson);
    const placeholderRegex = /\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(quizJsonString)) !== null) {
      placeholders.push(match[1]);
    }

    // Save quiz JSON with placeholders and update status
    await supabase
      .from("diagnostics")
      .update({
        quiz_json: quizJson,
        status: placeholders.length > 0 ? "quiz_generated" : "ready",
      })
      .eq("id", diagnostic_id);

    return new Response(
      JSON.stringify({
        success: true,
        quiz_json: quizJson,
        image_placeholders: placeholders,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-diagnostic error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

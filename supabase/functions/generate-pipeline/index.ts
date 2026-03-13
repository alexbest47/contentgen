import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, content_type } = await req.json();
    if (!project_id || !content_type) throw new Error("project_id and content_type are required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project with offer, program, and lead magnets
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, offers(*, paid_programs(*)), lead_magnets!lead_magnets_project_id_fkey(*)")
      .eq("id", project_id)
      .single();
    if (projErr) throw projErr;

    const offer = project.offers;
    if (!offer) throw new Error("Project has no associated offer");
    const program = offer.paid_programs;
    const selectedLead = project.lead_magnets?.find((lm: any) => lm.is_selected);
    if (!selectedLead) throw new Error("Не выбран лид-магнит");

    // Get audience description
    let audienceDescription = program.audience_description || "";
    if (program.audience_doc_url && !audienceDescription) {
      try {
        const docMatch = program.audience_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            audienceDescription = await docResponse.text();
            await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
          }
        }
      } catch (e) { console.error("Error fetching audience doc:", e); }
    }

    // Fetch program description from Google Doc if available
    let programDocDescription = "";
    if (program.program_doc_url) {
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

    // Get offer description
    let offerDescription = offer.description || "";
    if (offer.doc_url && !offerDescription) {
      try {
        const docMatch = offer.doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            offerDescription = await docResponse.text();
          }
        }
      } catch (e) { console.error("Error fetching offer doc:", e); }
    }

    // Get active prompt for this pipeline
    const { data: pipelineSteps, error: stepsErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("content_type", content_type)
      .eq("offer_type", offer.offer_type)
      .eq("is_active", true)
      .order("step_order", { ascending: true })
      .limit(1);
    if (stepsErr) throw stepsErr;
    if (!pipelineSteps || pipelineSteps.length === 0) {
      throw new Error(`Нет активных промптов для "${content_type}". Создайте их в разделе «Управление промптами».`);
    }

    const prompt = pipelineSteps[0];

    const leadMagnetContext = `Выбранный лид-магнит:
- Название: ${selectedLead.title}
- Визуальный формат: ${selectedLead.visual_format || ""}
- Визуальный контент: ${selectedLead.visual_content || ""}
- Мгновенная ценность: ${selectedLead.instant_value || ""}
- Переход к курсу: ${selectedLead.transition_to_course || ""}`;

    let userPrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title)
      .replace(/\{\{offer_type\}\}/g, offer.offer_type)
      .replace(/\{\{offer_title\}\}/g, offer.title)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_description\}\}/g, offerDescription)
      .replace(/\{\{lead_magnet\}\}/g, leadMagnetContext)
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription);

    // Call Claude
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 8192,
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

    // Extract JSON from response
    let jsonContent = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    // Validate JSON
    try {
      JSON.parse(jsonContent);
    } catch {
      console.error("Claude returned invalid JSON:", rawContent);
      throw new Error("Claude вернул невалидный JSON. Попробуйте ещё раз.");
    }

    // Save as pipeline_json_{content_type}
    const categoryKey = `pipeline_json_${content_type}`;

    await supabase.from("content_pieces").delete()
      .eq("project_id", project_id)
      .eq("category", categoryKey);
    await supabase.from("content_pieces").insert({
      project_id,
      category: categoryKey,
      content: jsonContent,
    });

    // Record generation run
    await supabase.from("generation_runs").insert({
      project_id,
      prompt_id: prompt.id,
      type: prompt.category,
      status: "completed",
      input_data: {
        content_type,
        program_title: program.title,
        offer_title: offer.title,
        lead_magnet_title: selectedLead.title,
      },
      output_data: { content: jsonContent },
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, content: jsonContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pipeline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

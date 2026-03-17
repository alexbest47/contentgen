import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  mini_course: "Мини-курс", diagnostic: "Диагностика", webinar: "Вебинар",
  pre_list: "Предсписок", new_stream: "Старт нового потока", spot_available: "Освободилось место",
  sale: "Распродажа", discount: "Скидка", download_pdf: "Скачай PDF",
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

    // Get brand_style from selected color scheme
    let brandStyle = "";
    if (project.selected_color_scheme_id) {
      const { data: scheme } = await supabase.from("color_schemes").select("description").eq("id", project.selected_color_scheme_id).single();
      if (scheme) brandStyle = scheme.description || "";
    }

    // Get global variables (offer_rules, antiAI_rules, brand_voice)
    const { data: globalVars } = await supabase.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    (globalVars || []).forEach((v: any) => { gv[v.key] = v.value || ""; });

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

    // Get active prompt for this pipeline, filtered by project's content_type
    const projectContentType = project.content_type || "lead_magnet";
    const { data: pipelineSteps, error: stepsErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("channel", content_type)
      .eq("content_type", projectContentType)
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

    const expertContext = `Выбранная тема экспертного поста:
- Название: ${selectedLead.title}
- Категория: ${selectedLead.visual_format || ""}
- Угол подачи: ${selectedLead.visual_content || ""}
- Крючок: ${selectedLead.instant_value || ""}
- Переход к офферу: ${selectedLead.transition_to_course || ""}`;

    const provocativeContext = `Выбранная тема провокационного поста:
- Название: ${selectedLead.title}
- Категория: ${selectedLead.visual_format || ""}
- Угол подачи: ${selectedLead.visual_content || ""}
- Крючок: ${selectedLead.instant_value || ""}
- Переход к офферу: ${selectedLead.transition_to_course || ""}`;

    const listContext = JSON.stringify({
      id: selectedLead.id,
      subtype: selectedLead.visual_format || "",
      list_title: selectedLead.title,
      hook: selectedLead.instant_value || "",
      items: (() => { try { return JSON.parse(selectedLead.visual_content || "[]"); } catch { return []; } })(),
      transition_to_offer: selectedLead.transition_to_course || "",
    });

    let userPrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title)
      .replace(/\{\{offer_type\}\}/g, OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type)
      .replace(/\{\{offer_title\}\}/g, offer.title)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_description\}\}/g, offerDescription)
      .replace(/\{\{lead_magnet\}\}/g, leadMagnetContext)
      .replace(/\{\{reference_material\}\}/g, leadMagnetContext)
      .replace(/\{\{expert_post_topic\}\}/g, expertContext)
      .replace(/\{\{provocation_topic\}\}/g, provocativeContext)
      .replace(/\{\{list_topic\}\}/g, listContext)
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription)
      .replace(/\{\{brand_style\}\}/g, brandStyle)
      .replace(/\{\{offer_rules\}\}/g, gv["offer_rules"] || "")
      .replace(/\{\{antiAI_rules\}\}/g, gv["antiAI_rules"] || "")
      .replace(/\{\{brand_voice\}\}/g, gv["brand_voice"] || "");

    // Inject case_data for testimonial_content projects
    if (project.selected_case_id) {
      const { data: caseData } = await supabase
        .from("case_classifications")
        .select("classification_json")
        .eq("id", project.selected_case_id)
        .single();
      if (caseData) {
        userPrompt = userPrompt.replace(/\{\{case_data\}\}/g, JSON.stringify(caseData.classification_json, null, 2));
      }
    }

    // Inject case_angle for testimonial_content channel prompts
    if (selectedLead && projectContentType === "testimonial_content") {
      let storyArc = null;
      try { storyArc = JSON.parse(selectedLead.save_reason || "null"); } catch {}
      const caseAngleContext = JSON.stringify({
        angle_type: selectedLead.visual_format || "",
        angle_title: selectedLead.title || "",
        hook: selectedLead.instant_value || "",
        key_quote: selectedLead.visual_content || null,
        story_arc: storyArc,
        what_reader_feels: selectedLead.cta_text || "",
        transition_to_offer: selectedLead.transition_to_course || "",
      }, null, 2);
      userPrompt = userPrompt.replace(/\{\{case_angle\}\}/g, caseAngleContext);
    }

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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

const OFFER_TYPE_LABELS: Record<string, string> = {
  mini_course: "Мини-курс", diagnostic: "Диагностика", webinar: "Вебинар",
  pre_list: "Предсписок", new_stream: "Старт нового потока", spot_available: "Освободилось место",
  discount: "Промокод", download_pdf: "Скачай PDF",
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    const { project_id, content_type, content_format: bodyFormat } = body;
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
    let program = offer.paid_programs;
    if (project.program_id) {
      const { data: projProgram } = await supabase.from("paid_programs").select("*").eq("id", project.program_id).single();
      if (projProgram) program = projProgram;
    }
    if (!program) throw new Error("Project has no associated paid program");
    const selectedLead = project.lead_magnets?.find((lm: any) => lm.is_selected);
    // Objection-handling carousel skips the angles step and has no lead_magnet
    const projectContentType = project.content_type || "lead_magnet";
    const isFromScratch = projectContentType === "from_scratch";
    const isTrustAi = projectContentType === "trust_ai";
    const isWebinarInvite = projectContentType === "webinar_invite" || projectContentType === "webinar_invite_2";
    const isDirectOffer = projectContentType === "direct_offer";
    const isMultiOffer = projectContentType === "multi_offer";
    const isTransformationStory = projectContentType === "transformation_story";
    const skipLeadRequirement = (projectContentType === "objection_handling" && project.content_format === "carousel") || isFromScratch || isTrustAi || isWebinarInvite || isDirectOffer || isMultiOffer || isTransformationStory;
    if (!selectedLead && !skipLeadRequirement) throw new Error("Не выбран лид-магнит");

    // Get audience description — always fetch fresh from URL, fallback to cached, or use segment override
    let audienceDescription = "";
    const audienceSegment = project?.audience_segment || "";
    if (audienceSegment && gv[audienceSegment]) {
      audienceDescription = gv[audienceSegment];
    } else {
      if (program.audience_doc_url) {
        try {
          audienceDescription = await fetchDocContent(program.audience_doc_url);
          if (audienceDescription) {
            await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
          }
        } catch (docErr) { console.error("Error fetching audience doc:", docErr); }
      }
      if (!audienceDescription) audienceDescription = program.audience_description || "";
    }

    // Fetch program description from Google Doc if available
    let programDocDescription = "";
    if (program.program_doc_url) {
      programDocDescription = await fetchDocContent(program.program_doc_url);
    }

    // Get offer full description from Google Doc
    let offerDescription = "";
    if (offer.doc_url) {
      offerDescription = await fetchDocContent(offer.doc_url);
    }

    // Get active prompt for this pipeline, filtered by project's content_type
    const contentFormat: string | null = bodyFormat || project.content_format || null;
    let stepsQuery = supabase
      .from("prompts")
      .select("*")
      .eq("channel", content_type)
      .eq("content_type", projectContentType)
      .eq("is_active", true);
    if (contentFormat) stepsQuery = stepsQuery.eq("sub_type", contentFormat);
    const { data: pipelineSteps, error: stepsErr } = await stepsQuery
      .order("step_order", { ascending: true })
      .limit(1);
    if (stepsErr) throw stepsErr;
    if (!pipelineSteps || pipelineSteps.length === 0) {
      throw new Error(`Нет активных промптов для "${content_type}"${contentFormat ? ` (${contentFormat})` : ""}. Создайте их в разделе «Управление промптами».`);
    }

    const prompt = pipelineSteps[0];

    const _sl: any = selectedLead || {};
    const leadMagnetContext = `Выбранный лид-магнит:\n- Название: ${_sl.title || ""}\n- Визуальный формат: ${_sl.visual_format || ""}\n- Визуальный контент: ${_sl.visual_content || ""}\n- Мгновенная ценность: ${_sl.instant_value || ""}\n- Переход к курсу: ${_sl.transition_to_course || ""}`;
    const expertContext = `Выбранная тема экспертного поста:\n- Название: ${_sl.title || ""}\n- Категория: ${_sl.visual_format || ""}\n- Угол подачи: ${_sl.visual_content || ""}\n- Крючок: ${_sl.instant_value || ""}\n- Переход к офферу: ${_sl.transition_to_course || ""}`;

    let mythHarm = "", mythTruth = "";
    try { const parsed = JSON.parse(_sl.save_reason || "{}"); mythHarm = parsed.harm || ""; mythTruth = parsed.truth || ""; } catch {}
    const mythContext = `Выбранная тема разбора мифа:\n- Формулировка мифа: ${_sl.title || ""}\n- Категория: ${_sl.visual_format || ""}\n- Почему миф вреден: ${_sl.visual_content || ""}\n- Крючок: ${_sl.instant_value || ""}\n- Вред мифа: ${mythHarm}\n- Правда: ${mythTruth}\n- Переход к офферу: ${_sl.transition_to_course || ""}`;
    const provocativeContext = `Выбранная тема провокационного поста:\n- Название: ${_sl.title || ""}\n- Категория: ${_sl.visual_format || ""}\n- Угол подачи: ${_sl.visual_content || ""}\n- Крючок: ${_sl.instant_value || ""}\n- Переход к офферу: ${_sl.transition_to_course || ""}`;
    const listContext = JSON.stringify({ id: _sl.id || "", subtype: _sl.visual_format || "", list_title: _sl.title || "", hook: _sl.instant_value || "", items: (() => { try { return JSON.parse(_sl.visual_content || "[]"); } catch { return []; } })(), transition_to_offer: _sl.transition_to_course || "" });

    let userPrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title)
      .replace(/\{\{offer_type\}\}/g, OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type)
      .replace(/\{\{offer_title\}\}/g, offer.title)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{audience_segment\}\}/g, audienceSegment || "")
      .replace(/\{\{offer_value\}\}/g, offer.description || "")
      .replace(/\{\{offer_description\}\}/g, offerDescription)
      .replace(/\{\{lead_magnet\}\}/g, leadMagnetContext)
      .replace(/\{\{reference_material\}\}/g, leadMagnetContext)
      .replace(/\{\{expert_post_topic\}\}/g, expertContext)
      .replace(/\{\{myth_topic\}\}/g, mythContext)
      .replace(/\{\{provocation_topic\}\}/g, provocativeContext)
      .replace(/\{\{list_topic\}\}/g, listContext)
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription)
      .replace(/\{\{brand_style\}\}/g, brandStyle)
      .replace(/\{\{offer_rules\}\}/g, gv["offer_rules"] || "")
      .replace(/\{\{antiAI_rules\}\}/g, gv["antiAI_rules"] || "")
      .replace(/\{\{brand_voice\}\}/g, gv["brand_voice"] || "")
      .replace(/\{\{talentsy\}\}/g, gv["talentsy"] || "")
      .replace(/\{\{topic_description\}\}/g, (project as any).topic_description || "")
      .replace(/\{\{slide_count\}\}/g, (project as any).slide_count != null ? String((project as any).slide_count) : "")
      .replace(/\{\{letter_theme_title\}\}/g, (project as any).topic_description || "")
      .replace(/\{\{webinar_data\}\}/g, JSON.stringify({
        date: offer.webinar_date || null,
        time: null,
        is_auto: !!offer.is_autowebinar,
        landing_url: offer.landing_url || "",
      }))
      .replace(/\{\{objection_data\}\}/g, "")
      .replace(/\{\{objection_angle\}\}/g, "");

    // Inject offers_data for multi_offer projects
    if (isMultiOffer) {
      const extraIds: string[] = Array.isArray((project as any).extra_offer_ids) ? (project as any).extra_offer_ids : [];
      const allOfferIds = [offer.id, ...extraIds].filter(Boolean);
      const { data: multiOffers } = await supabase
        .from("offers")
        .select("id, title, offer_type, description, landing_url, doc_url")
        .in("id", allOfferIds);
      const ordered = allOfferIds.map((id) => (multiOffers || []).find((o: any) => o.id === id)).filter(Boolean);
      const parts = await Promise.all(ordered.map(async (o: any, i: number) => {
        let desc = o.description || "";
        if (o.doc_url) {
          try { const docText = await fetchDocContent(o.doc_url); if (docText) desc = docText; } catch {}
        }
        const typeLabel = OFFER_TYPE_LABELS[o.offer_type] || o.offer_type;
        return `ОФФЕР ${i + 1}:\nТип: ${typeLabel}\nНазвание: ${o.title}\nОписание: ${desc || "—"}\nСсылка: ${o.landing_url || ""}`;
      }));
      userPrompt = userPrompt.replace(/\{\{offers_data\}\}/g, parts.join("\n\n"));
    }

    // Inject case_data for testimonial_content projects
    if (project.selected_case_id) {
      const { data: caseData } = await supabase.from("case_classifications").select("classification_json").eq("id", project.selected_case_id).single();
      if (caseData) userPrompt = userPrompt.replace(/\{\{case_data\}\}/g, JSON.stringify(caseData.classification_json, null, 2));
    }

    // Inject case_angle for testimonial_content channel prompts
    if (selectedLead && projectContentType === "testimonial_content") {
      let storyArc = null;
      try { storyArc = JSON.parse(selectedLead.save_reason || "null"); } catch {}
      const caseAngleContext = JSON.stringify({ angle_type: selectedLead.visual_format || "", angle_title: selectedLead.title || "", hook: selectedLead.instant_value || "", key_quote: selectedLead.visual_content || null, story_arc: storyArc, what_reader_feels: selectedLead.cta_text || "", transition_to_offer: selectedLead.transition_to_course || "" }, null, 2);
      userPrompt = userPrompt.replace(/\{\{case_angle\}\}/g, caseAngleContext);
    }

    // Inject objection_data and objection_angle for objection_handling
    if (projectContentType === "objection_handling") {
      const ids: string[] = Array.isArray((project as any).selected_objection_ids) && (project as any).selected_objection_ids.length > 0
        ? (project as any).selected_objection_ids
        : (project.selected_objection_id ? [project.selected_objection_id] : []);
      if (ids.length > 0) {
        const { data: objList } = await supabase.from("objections").select("id, objection_text, tags").in("id", ids);
        // Preserve order from ids[]
        const ordered = ids.map((id) => (objList || []).find((o: any) => o.id === id)).filter(Boolean);
        const formatted = ordered.map((o: any, i: number) => `${i + 1}. ${o.objection_text}${o.tags && o.tags.length ? ` [теги: ${o.tags.join(", ")}]` : ""}`).join("\n");
        userPrompt = userPrompt.replace(/\{\{objection_data\}\}/g, formatted);
      }
      if (selectedLead) {
        const objAngleContext = JSON.stringify({ angle_type: selectedLead.visual_format || "", angle_title: selectedLead.title || "", description: selectedLead.visual_content || "", hook: selectedLead.instant_value || "", transition_to_offer: selectedLead.transition_to_course || "" }, null, 2);
        userPrompt = userPrompt.replace(/\{\{objection_angle\}\}/g, objAngleContext);
      }
    }

    // Call Claude
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: prompt.model || "claude-sonnet-4-20250514", max_tokens: 64000, system: prompt.system_prompt, messages: [{ role: "user", content: userPrompt }] }),
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
    if (jsonMatch) jsonContent = jsonMatch[1].trim();

    // Validate JSON
    try { JSON.parse(jsonContent); } catch {
      console.error("Claude returned invalid JSON:", rawContent);
      throw new Error("Claude вернул невалидный JSON. Попробуйте ещё раз.");
    }

    // Use fresh client to survive HTTP connection timeout
    const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const categoryKey = `pipeline_json_${content_type}`;
    await freshSb.from("content_pieces").delete().eq("project_id", project_id).eq("category", categoryKey);
    await freshSb.from("content_pieces").insert({ project_id, category: categoryKey, content: jsonContent });

    await freshSb.from("generation_runs").insert({
      project_id, prompt_id: prompt.id, type: prompt.category, status: "completed",
      input_data: { content_type, program_title: program.title, offer_title: offer.title, lead_magnet_title: _sl.title || null },
      output_data: { content: jsonContent }, completed_at: new Date().toISOString(),
    });

    const responseData = { success: true, content: jsonContent };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pipeline error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

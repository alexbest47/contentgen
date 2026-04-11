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
    const { project_id, letter_id, content_type: bodyContentType, case_classification_id, selected_objection_id, selected_objection_ids, user_topic: bodyUserTopic } = body;
    let content_type = bodyContentType || "lead_magnet";
    let user_topic = bodyUserTopic || "";

    // letter_id mode: load all generation context from email_letters instead of project
    let letterMode = false;
    let letterRow: any = null;
    let letterProgram: any = null;
    let letterOffer: any = null;
    if (letter_id && !project_id) {
      letterMode = true;
      const supabaseUrlTmp = Deno.env.get("SUPABASE_URL")!;
      const serviceKeyTmp = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const tmpSb = createClient(supabaseUrlTmp, serviceKeyTmp);
      const { data: lr, error: lErr } = await tmpSb.from("email_letters").select("*").eq("id", letter_id).single();
      if (lErr || !lr) throw new Error("Letter not found");
      letterRow = lr;
      content_type = lr.content_type || content_type;
      user_topic = lr.user_topic || user_topic;
      if (lr.program_id) {
        const { data: p } = await tmpSb.from("paid_programs").select("*").eq("id", lr.program_id).single();
        letterProgram = p;
      }
      if (lr.offer_id) {
        const { data: o } = await tmpSb.from("offers").select("*").eq("id", lr.offer_id).single();
        letterOffer = o;
      }
    }
    if (!project_id && !letterMode) throw new Error("project_id or letter_id is required");
    const promptCategory = content_type === "reference_material" ? "reference_materials" : content_type === "expert_content" ? "expert_content" : content_type === "provocative_content" ? "provocative_content" : content_type === "list_content" ? "list_content" : content_type === "testimonial_content" ? "testimonial_content" : content_type === "myth_busting" ? "myth_busting" : content_type === "objection_handling" ? "objection_handling" : "lead_magnets";

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let project: any = null;
    if (!letterMode) {
      const { data: pr, error: projErr } = await supabase.from("projects").select("*, offers(*, paid_programs(*))").eq("id", project_id).single();
      if (projErr) throw projErr;
      project = pr;
    } else {
      // Synthesize project-shaped data from letter
      project = {
        id: null,
        selected_color_scheme_id: letterRow.selected_color_scheme_id,
        offers: { ...(letterOffer || {}), paid_programs: letterProgram || {} },
      };
    }

    let brandStyle = "";
    if (project.selected_color_scheme_id) {
      const { data: scheme } = await supabase.from("color_schemes").select("description").eq("id", project.selected_color_scheme_id).single();
      if (scheme) brandStyle = scheme.description || "";
    }

    const { data: globalVars } = await supabase.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    (globalVars || []).forEach((v: any) => { gv[v.key] = v.value || ""; });

    const offer = project.offers;
    if (!offer) throw new Error("Project has no associated offer");
    let program = offer.paid_programs;
    // Prefer the program explicitly chosen on the project (e.g. for offers like
    // "spot_available" that aren't tied to a specific paid program)
    if (project.program_id) {
      const { data: projProgram } = await supabase.from("paid_programs").select("*").eq("id", project.program_id).single();
      if (projProgram) program = projProgram;
    }
    if (!program) throw new Error("Project has no associated paid program");

    let audienceDescription = "";

    let audienceSegment = letterMode ? (letterRow?.audience_segment || "") : (project?.audience_segment || "");
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

    let programDocDescription = "";
    if (program.program_doc_url) {
      programDocDescription = await fetchDocContent(program.program_doc_url);
    }

    let offerDescription = "";
    if (offer.doc_url) {
      offerDescription = await fetchDocContent(offer.doc_url);
    }

    if (!letterMode) {
      await supabase.from("projects").update({ status: "generating_leads" }).eq("id", project_id);
    } else {
      await supabase.from("email_letters").update({ content_options_status: "generating" } as any).eq("id", letter_id);
    }

    const { data: prompt, error: promptErr } = await supabase
      .from("prompts").select("*")
      .eq("category", promptCategory).eq("is_active", true).is("channel", null)
      .limit(1).maybeSingle();
    if (promptErr || !prompt) {
      if (!letterMode) await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      else await supabase.from("email_letters").update({ content_options_status: "error" } as any).eq("id", letter_id);
      throw new Error(`No active prompt found for category '${promptCategory}' (letterMode=${letterMode}).`);
    }

    const systemPrompt = prompt.system_prompt;
    let userPrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title).replace(/\{\{offer_type\}\}/g, OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type).replace(/\{\{offer_title\}\}/g, offer.title).replace(/\{\{audience_description\}\}/g, audienceDescription).replace(/\{\{audience_segment\}\}/g, audienceSegment || "").replace(/\{\{offer_value\}\}/g, offer.description || "").replace(/\{\{offer_description\}\}/g, offerDescription).replace(/\{\{offer_image\}\}/g, offer.image_url || "").replace(/\{\{program_doc_description\}\}/g, programDocDescription).replace(/\{\{brand_style\}\}/g, brandStyle).replace(/\{\{offer_rules\}\}/g, gv["offer_rules"] || "").replace(/\{\{antiAI_rules\}\}/g, gv["antiAI_rules"] || "").replace(/\{\{brand_voice\}\}/g, gv["brand_voice"] || "").replace(/\{\{content_theme\}\}/g, user_topic || "");

    if (user_topic && !prompt.user_prompt_template.includes("{{content_theme}}")) {
      userPrompt += `\n\nВАЖНО: Пользователь задал конкретную тему/направление: "${user_topic}". Все сгенерированные варианты должны быть связаны с этой темой.`;
    }

    if (content_type === "testimonial_content" && case_classification_id) {
      const { data: caseData, error: caseErr } = await supabase.from("case_classifications").select("classification_json").eq("id", case_classification_id).single();
      if (caseErr) throw caseErr;
      userPrompt = userPrompt.replace(/\{\{case_data\}\}/g, JSON.stringify(caseData.classification_json, null, 2));
    }

    if (content_type === "objection_handling") {
      const ids: string[] = Array.isArray(selected_objection_ids) && selected_objection_ids.length > 0
        ? selected_objection_ids
        : (selected_objection_id ? [selected_objection_id] : []);
      if (ids.length > 0) {
        const { data: objList, error: objErr } = await supabase.from("objections").select("id, objection_text, tags").in("id", ids);
        if (objErr) throw objErr;
        const formatted = (objList || []).map((o: any, i: number) => `${i + 1}. ${o.objection_text}${o.tags && o.tags.length ? ` [теги: ${o.tags.join(", ")}]` : ""}`).join("\n");
        userPrompt = userPrompt.replace(/\{\{objection_data\}\}/g, formatted);
        userPrompt = userPrompt.replace(/\{\{objections_data\}\}/g, formatted);
        userPrompt = userPrompt.replace(/\{\{objections_list\}\}/g, formatted);
        // Append for prompts that don't have placeholder (e.g., email)
        if (!prompt.user_prompt_template.includes("{{objection_data}}") && !prompt.user_prompt_template.includes("{{objections")) {
          userPrompt += `\n\nВЫБРАННЫЕ ВОЗРАЖЕНИЯ:\n${formatted}`;
        }
      }
    }

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: prompt.model || "claude-sonnet-4-6", max_tokens: 64000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Claude API error:", aiResponse.status, errText);
      if (!letterMode) await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      else await supabase.from("email_letters").update({ content_options_status: "error" } as any).eq("id", letter_id);
      throw new Error(`Claude API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.content?.[0]?.text || "";

    let leadMagnets;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) leadMagnets = JSON.parse(jsonMatch[0]);
      else throw new Error("No JSON array found");
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content);
      if (!letterMode) await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      else await supabase.from("email_letters").update({ content_options_status: "error" } as any).eq("id", letter_id);
      throw new Error("Failed to parse AI response");
    }

    if (!letterMode) {
      await supabase.from("lead_magnets").delete().eq("project_id", project_id);
    } else {
      await supabase.from("email_letter_lead_magnets").delete().eq("letter_id", letter_id);
    }

    const items = (content_type === "lead_magnet") ? leadMagnets.slice(0, 5) : leadMagnets;
    const inserts = items.map((lm: any) => {
      if (content_type === "testimonial_content") return { project_id, title: lm.angle_title || lm.title || "Без названия", visual_format: lm.angle_type || "", visual_content: lm.key_quote || "", instant_value: lm.hook || "", save_reason: JSON.stringify(lm.story_arc || null), transition_to_course: lm.transition_to_offer || "", cta_text: lm.what_reader_feels || "" };
      if (content_type === "list_content") return { project_id, title: lm.list_title || lm.title || "Без названия", visual_format: lm.subtype || "", visual_content: JSON.stringify(lm.items || []), instant_value: lm.hook || "", save_reason: "", transition_to_course: lm.transition_to_offer || "", cta_text: "" };
      if (content_type === "myth_busting") return { project_id, title: lm.myth_statement || lm.title || "Без названия", visual_format: lm.category || "", visual_content: lm.myth_angle || "", instant_value: lm.hook || "", save_reason: JSON.stringify({ harm: lm.harm || "", truth: lm.truth || "" }), transition_to_course: lm.transition_to_offer || "", cta_text: "", target_segment: lm.target_segment || "" };
      if (content_type === "objection_handling") return { project_id, title: lm.angle_title || lm.title || "Без названия", visual_format: lm.angle_type || "", visual_content: lm.description || "", instant_value: lm.hook || "", transition_to_course: lm.transition_to_offer || "", cta_text: "", save_reason: "" };
      if (content_type === "expert_content") return { project_id, title: lm.topic_title || lm.title || "Без названия", visual_format: lm.category || "", visual_content: lm.topic_angle || "", instant_value: lm.hook || "", save_reason: "", transition_to_course: lm.transition_to_offer || "", cta_text: "" };
      if (content_type === "provocative_content") return { project_id, title: lm.topic_title || lm.title || "Без названия", visual_format: lm.format || "", visual_content: lm.topic_angle || "", instant_value: lm.hook || "", save_reason: lm.discussion_trigger || "", transition_to_course: lm.transition_to_offer || "", cta_text: "" };
      return { project_id, title: lm.title || "Без названия", visual_format: lm.visual_format || "", visual_content: lm.visual_content || "", instant_value: lm.instant_value || "", save_reason: lm.save_reason || "", transition_to_course: lm.transition_to_test || lm.transition_to_course || "", cta_text: lm.cta_text || "", target_segment: lm.target_segment || "" };
    });

    // Use fresh client to survive HTTP connection timeout
    const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!letterMode) {
      const { error: insertErr } = await freshSb.from("lead_magnets").insert(inserts);
      if (insertErr) throw insertErr;
      await freshSb.from("generation_runs").insert({ project_id, prompt_id: prompt.id, type: promptCategory, status: "completed", input_data: { program_title: program.title, offer_title: offer.title, content_type }, output_data: leadMagnets, completed_at: new Date().toISOString() });
      await freshSb.from("projects").update({ status: "leads_ready" }).eq("id", project_id);
    } else {
      // Insert into email_letter_lead_magnets — payload = full original item, title = best-effort
      const letterInserts = items.map((lm: any, i: number) => ({
        letter_id,
        content_type,
        title: lm.title || lm.angle_title || lm.topic_title || lm.list_title || lm.myth_statement || "Без названия",
        payload: lm,
        sort_order: i,
      }));
      const { error: insertErr } = await freshSb.from("email_letter_lead_magnets").insert(letterInserts);
      if (insertErr) throw insertErr;
      await freshSb.from("email_letters").update({ content_options_status: "ready" } as any).eq("id", letter_id);
    }

    const responseData = { success: true };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lead-magnets error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

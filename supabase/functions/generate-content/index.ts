import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { project_id, category } = body;
    if (!project_id || !category) throw new Error("project_id and category are required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project, error: projErr } = await supabase.from("projects").select("*, offers(*, paid_programs(*)), lead_magnets!lead_magnets_project_id_fkey(*)").eq("id", project_id).single();
    if (projErr) throw projErr;

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
    const program = offer.paid_programs;
    const selectedLead = project.lead_magnets?.find((lm: any) => lm.is_selected);
    if (!selectedLead) throw new Error("Не выбран лид-магнит");

    let audienceDescription = program.audience_description || "";
    if (program.audience_doc_url && !audienceDescription) {
      try {
        const docMatch = program.audience_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) { const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`; const docResponse = await fetch(exportUrl); if (docResponse.ok) { audienceDescription = await docResponse.text(); await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id); } else { await docResponse.text(); } }
      } catch (docErr) { console.error("Error fetching Google Doc:", docErr); }
    }

    let programDocDescription = "";
    if (program.program_doc_url) {
      try { const docMatch = program.program_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/); if (docMatch) { const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`; const docResponse = await fetch(exportUrl); if (docResponse.ok) programDocDescription = await docResponse.text(); } } catch (e) { console.error("Error fetching program doc:", e); }
    }

    let offerDescription = "";
    if (offer.doc_url) {
      try { const docMatch = offer.doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/); if (docMatch) { const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`; const docResponse = await fetch(exportUrl); if (docResponse.ok) offerDescription = await docResponse.text(); else await docResponse.text(); } } catch (docErr) { console.error("Error fetching offer Google Doc:", docErr); }
    }

    const { data: prompt } = await supabase.from("prompts").select("*").eq("category", category).eq("is_active", true).limit(1).single();
    if (!prompt) throw new Error(`Нет активного промпта для категории "${category}".`);

    const leadMagnetContext = `Выбранный лид-магнит:\n- Название: ${selectedLead.title}\n- Визуальный формат: ${selectedLead.visual_format || ""}\n- Визуальный контент: ${selectedLead.visual_content || ""}\n- Мгновенная ценность: ${selectedLead.instant_value || ""}\n- Переход к курсу: ${selectedLead.transition_to_course || ""}`;
    const mythContext = `Выбранная тема разбора мифа:\n- Название: ${selectedLead.title}\n- Категория: ${selectedLead.visual_format || ""}\n- Угол подачи: ${selectedLead.visual_content || ""}\n- Крючок: ${selectedLead.instant_value || ""}\n- Переход к офферу: ${selectedLead.transition_to_course || ""}`;

    const userPrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title).replace(/\{\{offer_type\}\}/g, OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type).replace(/\{\{offer_title\}\}/g, offer.title).replace(/\{\{audience_description\}\}/g, audienceDescription).replace(/\{\{offer_value\}\}/g, offer.description || "").replace(/\{\{offer_description\}\}/g, offerDescription).replace(/\{\{offer_image\}\}/g, offer.image_url || "").replace(/\{\{lead_magnet\}\}/g, leadMagnetContext).replace(/\{\{reference_material\}\}/g, leadMagnetContext).replace(/\{\{myth_topic\}\}/g, mythContext).replace(/\{\{program_doc_description\}\}/g, programDocDescription).replace(/\{\{brand_style\}\}/g, brandStyle).replace(/\{\{offer_rules\}\}/g, gv["offer_rules"] || "").replace(/\{\{antiAI_rules\}\}/g, gv["antiAI_rules"] || "").replace(/\{\{brand_voice\}\}/g, gv["brand_voice"] || "").replace(/\{\{objection_data\}\}/g, "").replace(/\{\{objection_angle\}\}/g, "");

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
    const content = claudeData.content?.[0]?.text || "";

    const { data: run } = await supabase.from("generation_runs").insert({ project_id, prompt_id: prompt.id, type: category, status: "completed", input_data: { program_title: program.title, offer_title: offer.title, lead_magnet_title: selectedLead.title }, output_data: { content }, completed_at: new Date().toISOString() }).select("id").single();
    await supabase.from("content_pieces").delete().eq("project_id", project_id).eq("category", category);
    await supabase.from("content_pieces").insert({ project_id, category, content, generation_run_id: run?.id || null });

    const responseData = { success: true, content };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

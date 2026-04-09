import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

const IMAGE_CATEGORIES = ["image_carousel", "image_post", "image_email"];

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
    if (!IMAGE_CATEGORIES.includes(category)) throw new Error(`Invalid image category: ${category}`);

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
    let program = offer.paid_programs;
    if (project.program_id) {
      const { data: projProgram } = await supabase.from("paid_programs").select("*").eq("id", project.program_id).single();
      if (projProgram) program = projProgram;
    }
    if (!program) throw new Error("Project has no associated paid program");
    const selectedLead = project.lead_magnets?.find((lm: any) => lm.is_selected);
    if (!selectedLead) throw new Error("Не выбран лид-магнит");

    let audienceDescription = "";
    if (program.audience_doc_url) {
      try {
        audienceDescription = await fetchDocContent(program.audience_doc_url);
        if (audienceDescription) {
          await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
        }
      } catch (docErr) { console.error("Error fetching audience doc:", docErr); }
    }
    if (!audienceDescription) audienceDescription = program.audience_description || "";

    let offerDescription = "";
    if (offer.doc_url) {
      try {
        offerDescription = await fetchDocContent(offer.doc_url);
      } catch (docErr) { console.error("Error fetching offer Google Doc:", docErr); }
    }

    const projectContentType = project.content_type || "lead_magnet";
    const { data: prompt } = await supabase.from("prompts").select("*").eq("category", category).eq("content_type", projectContentType).eq("is_active", true).limit(1).single();
    if (!prompt) throw new Error(`Нет активного промпта для категории "${category}".`);

    const leadMagnetContext = `Выбранный лид-магнит:\n- Название: ${selectedLead.title}\n- Визуальный формат: ${selectedLead.visual_format || ""}\n- Визуальный контент: ${selectedLead.visual_content || ""}\n- Мгновенная ценность: ${selectedLead.instant_value || ""}\n- Переход к курсу: ${selectedLead.transition_to_course || ""}`;

    const imagePrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title).replace(/\{\{offer_type\}\}/g, OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type).replace(/\{\{offer_title\}\}/g, offer.title).replace(/\{\{audience_description\}\}/g, audienceDescription).replace(/\{\{offer_value\}\}/g, offer.description || "").replace(/\{\{offer_description\}\}/g, offerDescription).replace(/\{\{lead_magnet\}\}/g, leadMagnetContext).replace(/\{\{brand_style\}\}/g, brandStyle).replace(/\{\{offer_rules\}\}/g, gv["offer_rules"] || "").replace(/\{\{antiAI_rules\}\}/g, gv["antiAI_rules"] || "").replace(/\{\{brand_voice\}\}/g, gv["brand_voice"] || "");

    console.log("Generating image with prompt:", imagePrompt.substring(0, 200));

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const imageResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "google/gemini-3-pro-image-preview", messages: [{ role: "user", content: imagePrompt }], modalities: ["image", "text"] }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error("Image generation API error:", imageResponse.status, errText);
      throw new Error(`Image generation API error: ${imageResponse.status} - ${errText}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image in OpenRouter response: " + JSON.stringify(imageData).substring(0, 500));

    const b64Image = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const timestamp = Date.now();
    const filePath = `${project_id}/${category}/${timestamp}.png`;
    const imageBytes = decode(b64Image);

    const { error: uploadError } = await supabase.storage.from("generated-images").upload(filePath, imageBytes, { contentType: "image/png", upsert: false });
    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const { data: run } = await supabase.from("generation_runs").insert({ project_id, prompt_id: prompt.id, type: category, status: "completed", input_data: { program_title: program.title, offer_title: offer.title, lead_magnet_title: selectedLead.title, image_prompt: imagePrompt }, output_data: { image_url: publicUrl }, completed_at: new Date().toISOString() }).select("id").single();
    await supabase.from("content_pieces").delete().eq("project_id", project_id).eq("category", category);
    await supabase.from("content_pieces").insert({ project_id, category, content: publicUrl, generation_run_id: run?.id || null });

    const responseData = { success: true, image_url: publicUrl };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

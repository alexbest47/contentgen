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

async function fetchGoogleDoc(url: string): Promise<string> {
  try {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return "";
    const exportUrl = `https://docs.google.com/document/d/${match[1]}/export?format=txt`;
    const resp = await fetch(exportUrl);
    if (resp.ok) return await resp.text();
  } catch (e) { console.error("Error fetching Google Doc:", e); }
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Image generation mode
    if (body.generate_image && body.banner_image_prompt) {
      const blockId = body.block_id;
      const imageResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: body.banner_image_prompt }],
          modalities: ["image", "text"],
        }),
      });
      const imageData = await imageResp.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("Не удалось сгенерировать изображение");

      const base64 = imageUrl.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fileName = `email-block-${blockId}-${Date.now()}.png`;

      await sb.storage.from("generated-images").upload(fileName, bytes, { contentType: "image/png", upsert: true });
      const { data: pub } = sb.storage.from("generated-images").getPublicUrl(fileName);

      const responseData = { banner_image_url: pub.publicUrl };
      if (taskId) await completeTask(taskId, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block generation mode
    const { block_type, config, color_scheme_id, mode, letter_id } = body;
    if (!block_type || !config?.program_id) throw new Error("Missing block_type or program_id");

    // Load letter theme and image_style_id
    let letterTheme = "";
    let imageStyleId: string | null = null;
    if (letter_id) {
      const { data: letterData } = await sb.from("email_letters").select("letter_theme_title, letter_theme_description, image_style_id").eq("id", letter_id).single();
      if (letterData) {
        if (letterData.letter_theme_title) {
          letterTheme = `${letterData.letter_theme_title}\n${letterData.letter_theme_description || ""}`;
        }
        imageStyleId = (letterData as any).image_style_id || null;
      }
    }

    // Load prompt
    const { data: prompt } = await sb.from("prompts")
      .select("*")
      .eq("content_type", "email_builder")
      .eq("slug", `email-builder-${block_type}`)
      .eq("is_active", true)
      .single();
    if (!prompt) throw new Error(`Промпт email-builder-${block_type} не найден`);

    // Load program
    const { data: program } = await sb.from("paid_programs").select("*").eq("id", config.program_id).single();

    // Load offer
    let offerTitle = "", offerDesc = "", offerType = "", offerValue = "", offerImageUrl = "";
    if (config.offer_id) {
      const { data: offer } = await sb.from("offers").select("*").eq("id", config.offer_id).single();
      if (offer) {
        offerTitle = offer.title;
        offerValue = offer.description || "";
        offerImageUrl = offer.image_url || "";
        offerDesc = offer.doc_url ? await fetchGoogleDoc(offer.doc_url) : "";
        offerType = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
      }
    }

    // Load selected variant from lead_magnets
    let selectedVariant: any = null;
    if (config.selected_variant_id) {
      const { data: variant } = await sb.from("lead_magnets").select("*").eq("id", config.selected_variant_id).single();
      if (variant) selectedVariant = variant;
    }

    // Load global variables
    const { data: gvRows } = await sb.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    gvRows?.forEach((r: any) => { gv[r.key] = r.value; });

    // Load color scheme
    let brandStyle = "";
    if (color_scheme_id) {
      const { data: cs } = await sb.from("color_schemes").select("description").eq("id", color_scheme_id).single();
      if (cs) brandStyle = cs.description;
    }

    // Fetch audience description
    let audienceDescription = program?.audience_description || "";
    if (program?.audience_doc_url && !audienceDescription) {
      audienceDescription = await fetchGoogleDoc(program.audience_doc_url);
      if (audienceDescription) {
        await sb.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
      }
    }

    // Fetch program doc description
    let programDocDescription = "";
    if (program?.program_doc_url) {
      programDocDescription = await fetchGoogleDoc(program.program_doc_url);
    }

    // Build variant context strings
    let leadMagnetContext = "";
    let expertContext = "";
    let mythContext = "";
    let provocativeContext = "";
    let listContext = "";
    let caseAngleContext = "";
    let objectionAngleContext = "";
    let referenceContext = "";

    if (selectedVariant) {
      leadMagnetContext = `Выбранный лид-магнит:\n- Название: ${selectedVariant.title}\n- Визуальный формат: ${selectedVariant.visual_format || ""}\n- Визуальный контент: ${selectedVariant.visual_content || ""}\n- Мгновенная ценность: ${selectedVariant.instant_value || ""}\n- Переход к курсу: ${selectedVariant.transition_to_course || ""}`;
      referenceContext = leadMagnetContext;
      expertContext = `Выбранная тема экспертного поста:\n- Название: ${selectedVariant.title}\n- Категория: ${selectedVariant.visual_format || ""}\n- Угол подачи: ${selectedVariant.visual_content || ""}\n- Крючок: ${selectedVariant.instant_value || ""}\n- Переход к офферу: ${selectedVariant.transition_to_course || ""}`;

      let mythHarm = "", mythTruth = "";
      try { const parsed = JSON.parse(selectedVariant.save_reason || "{}"); mythHarm = parsed.harm || ""; mythTruth = parsed.truth || ""; } catch {}
      mythContext = `Выбранная тема разбора мифа:\n- Формулировка мифа: ${selectedVariant.title}\n- Категория: ${selectedVariant.visual_format || ""}\n- Почему миф вреден: ${selectedVariant.visual_content || ""}\n- Крючок: ${selectedVariant.instant_value || ""}\n- Вред мифа: ${mythHarm}\n- Правда: ${mythTruth}\n- Переход к офферу: ${selectedVariant.transition_to_course || ""}`;
      provocativeContext = `Выбранная тема провокационного поста:\n- Название: ${selectedVariant.title}\n- Категория: ${selectedVariant.visual_format || ""}\n- Угол подачи: ${selectedVariant.visual_content || ""}\n- Крючок: ${selectedVariant.instant_value || ""}\n- Переход к офферу: ${selectedVariant.transition_to_course || ""}`;

      listContext = JSON.stringify({ subtype: selectedVariant.visual_format || "", list_title: selectedVariant.title, hook: selectedVariant.instant_value || "", items: (() => { try { return JSON.parse(selectedVariant.visual_content || "[]"); } catch { return []; } })(), transition_to_offer: selectedVariant.transition_to_course || "" });

      let storyArc = null;
      try { storyArc = JSON.parse(selectedVariant.save_reason || "null"); } catch {}
      caseAngleContext = JSON.stringify({ angle_type: selectedVariant.visual_format || "", angle_title: selectedVariant.title || "", hook: selectedVariant.instant_value || "", key_quote: selectedVariant.visual_content || null, story_arc: storyArc, what_reader_feels: selectedVariant.cta_text || "", transition_to_offer: selectedVariant.transition_to_course || "" }, null, 2);
      objectionAngleContext = JSON.stringify({ angle_type: selectedVariant.visual_format || "", angle_title: selectedVariant.title || "", description: selectedVariant.visual_content || "", hook: selectedVariant.instant_value || "", transition_to_offer: selectedVariant.transition_to_course || "" }, null, 2);
    }

    // Build user prompt with all substitutions
    let userPrompt = prompt.user_prompt_template || "";
    userPrompt = userPrompt
      .replace(/\{\{program_title\}\}/g, program?.title || "")
      .replace(/\{\{program_description\}\}/g, program?.description || "")
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_title\}\}/g, offerTitle)
      .replace(/\{\{offer_value\}\}/g, offerValue)
      .replace(/\{\{offer_description\}\}/g, offerDesc)
      .replace(/\{\{offer_image\}\}/g, offerImageUrl)
      .replace(/\{\{offer_type\}\}/g, offerType)
      .replace(/\{\{brand_style\}\}/g, brandStyle)
      .replace(/\{\{lead_magnet\}\}/g, leadMagnetContext)
      .replace(/\{\{reference_material\}\}/g, referenceContext)
      .replace(/\{\{expert_post_topic\}\}/g, expertContext)
      .replace(/\{\{myth_topic\}\}/g, mythContext)
      .replace(/\{\{provocation_topic\}\}/g, provocativeContext)
      .replace(/\{\{list_topic\}\}/g, listContext)
      .replace(/\{\{case_angle\}\}/g, caseAngleContext)
      .replace(/\{\{objection_angle\}\}/g, objectionAngleContext)
      .replace(/\{\{offer_rules\}\}/g, gv.offer_rules || "")
      .replace(/\{\{antiAI_rules\}\}/g, gv.antiAI_rules || "")
      .replace(/\{\{brand_voice\}\}/g, gv.brand_voice || "")
      .replace(/\{\{mode\}\}/g, mode || "text_only")
      .replace(/\{\{block_mode\}\}/g, mode || "text_only")
      .replace(/\{\{letter_theme\}\}/g, letterTheme)
      .replace(/\{\{block_type\}\}/g, block_type);

    // Build unified template vars with image_style priority
    let imageStyleText = gv.image_style || "";
    if (imageStyleId) {
      const { data: styleRow } = await sb.from("image_styles").select("description").eq("id", imageStyleId).single();
      if (styleRow?.description) imageStyleText = styleRow.description;
    }

    const templateVars: Record<string, string> = { ...gv, image_style: imageStyleText };

    function applyVars(text: string, vars: Record<string, string>): string {
      let result = text;
      for (const [k, v] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
      }
      return result;
    }

    userPrompt = applyVars(userPrompt, templateVars);
    const resolvedSystemPrompt = applyVars(
      prompt.system_prompt || "Ты генератор email-блоков. Возвращай JSON с полями block_html и banner_image_prompt.",
      templateVars
    );

    // Call Anthropic
    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: resolvedSystemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || "";

    let block_html = "", banner_image_prompt = "";
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonStr);
      block_html = parsed.block_html || parsed.html || text;
      banner_image_prompt = parsed.banner_image_prompt || "";
    } catch {
      block_html = text;
    }

    block_html = block_html.replace(/<img[^>]*\/?>/gi, "");
    block_html = block_html.replace(/<(div|p|figure|span)[^>]*>\s*<\/(div|p|figure|span)>/gi, "");

    if (body.block_id) {
      const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await freshSb.from("email_letter_blocks").update({ generated_html: block_html, banner_image_prompt }).eq("id", body.block_id);
    }

    const responseData = { block_html, banner_image_prompt };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-email-block error:", e);
    if (taskId) await failTask(taskId, e.message).catch(() => {});
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

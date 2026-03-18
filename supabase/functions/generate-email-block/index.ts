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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
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

      return new Response(JSON.stringify({ banner_image_url: pub.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block generation mode
    const { block_type, config, color_scheme_id, mode, letter_id } = body;
    if (!block_type || !config?.program_id) throw new Error("Missing block_type or program_id");

    // Load letter theme
    let letterTheme = "";
    if (letter_id) {
      const { data: letterData } = await sb.from("email_letters").select("letter_theme_title, letter_theme_description").eq("id", letter_id).single();
      if (letterData && letterData.letter_theme_title) {
        letterTheme = `${letterData.letter_theme_title}\n${letterData.letter_theme_description || ""}`;
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
    let offerTitle = "", offerDesc = "", offerType = "";
    if (config.offer_id) {
      const { data: offer } = await sb.from("offers").select("*").eq("id", config.offer_id).single();
      if (offer) {
        offerTitle = offer.title;
        offerDesc = offer.description || "";
        offerType = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
        // Fetch offer description from Google Doc if needed
        if (offer.doc_url && !offerDesc) {
          offerDesc = await fetchGoogleDoc(offer.doc_url);
        }
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

    // Build variant context strings (matching generate-pipeline logic)
    let leadMagnetContext = "";
    let expertContext = "";
    let mythContext = "";
    let provocativeContext = "";
    let listContext = "";
    let caseAngleContext = "";
    let objectionAngleContext = "";
    let referenceContext = "";

    if (selectedVariant) {
      leadMagnetContext = `Выбранный лид-магнит:
- Название: ${selectedVariant.title}
- Визуальный формат: ${selectedVariant.visual_format || ""}
- Визуальный контент: ${selectedVariant.visual_content || ""}
- Мгновенная ценность: ${selectedVariant.instant_value || ""}
- Переход к курсу: ${selectedVariant.transition_to_course || ""}`;

      referenceContext = leadMagnetContext;

      expertContext = `Выбранная тема экспертного поста:
- Название: ${selectedVariant.title}
- Категория: ${selectedVariant.visual_format || ""}
- Угол подачи: ${selectedVariant.visual_content || ""}
- Крючок: ${selectedVariant.instant_value || ""}
- Переход к офферу: ${selectedVariant.transition_to_course || ""}`;

      let mythHarm = "", mythTruth = "";
      try {
        const parsed = JSON.parse(selectedVariant.save_reason || "{}");
        mythHarm = parsed.harm || "";
        mythTruth = parsed.truth || "";
      } catch {}
      mythContext = `Выбранная тема разбора мифа:
- Формулировка мифа: ${selectedVariant.title}
- Категория: ${selectedVariant.visual_format || ""}
- Почему миф вреден: ${selectedVariant.visual_content || ""}
- Крючок: ${selectedVariant.instant_value || ""}
- Вред мифа: ${mythHarm}
- Правда: ${mythTruth}
- Переход к офферу: ${selectedVariant.transition_to_course || ""}`;

      provocativeContext = `Выбранная тема провокационного поста:
- Название: ${selectedVariant.title}
- Категория: ${selectedVariant.visual_format || ""}
- Угол подачи: ${selectedVariant.visual_content || ""}
- Крючок: ${selectedVariant.instant_value || ""}
- Переход к офферу: ${selectedVariant.transition_to_course || ""}`;

      listContext = JSON.stringify({
        subtype: selectedVariant.visual_format || "",
        list_title: selectedVariant.title,
        hook: selectedVariant.instant_value || "",
        items: (() => { try { return JSON.parse(selectedVariant.visual_content || "[]"); } catch { return []; } })(),
        transition_to_offer: selectedVariant.transition_to_course || "",
      });

      // Case angle (testimonial_content)
      let storyArc = null;
      try { storyArc = JSON.parse(selectedVariant.save_reason || "null"); } catch {}
      caseAngleContext = JSON.stringify({
        angle_type: selectedVariant.visual_format || "",
        angle_title: selectedVariant.title || "",
        hook: selectedVariant.instant_value || "",
        key_quote: selectedVariant.visual_content || null,
        story_arc: storyArc,
        what_reader_feels: selectedVariant.cta_text || "",
        transition_to_offer: selectedVariant.transition_to_course || "",
      }, null, 2);

      // Objection angle
      objectionAngleContext = JSON.stringify({
        angle_type: selectedVariant.visual_format || "",
        angle_title: selectedVariant.title || "",
        description: selectedVariant.visual_content || "",
        hook: selectedVariant.instant_value || "",
        transition_to_offer: selectedVariant.transition_to_course || "",
      }, null, 2);
    }

    // Build user prompt with all substitutions
    let userPrompt = prompt.user_prompt_template || "";
    userPrompt = userPrompt
      .replace(/\{\{program_title\}\}/g, program?.title || "")
      .replace(/\{\{program_description\}\}/g, program?.description || "")
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_title\}\}/g, offerTitle)
      .replace(/\{\{offer_description\}\}/g, offerDesc)
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
      .replace(/\{\{block_type\}\}/g, block_type);

    // Replace any remaining global variables
    for (const [k, v] of Object.entries(gv)) {
      userPrompt = userPrompt.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
    }

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
        system: prompt.system_prompt || "Ты генератор email-блоков. Возвращай JSON с полями block_html и banner_image_prompt.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || "";

    // Parse JSON from response
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

    // Always remove <img> tags — banners are managed separately via banner_image_url
    block_html = block_html.replace(/<img[^>]*\/?>/gi, "");
    // Remove empty wrappers left after img removal
    block_html = block_html.replace(/<(div|p|figure|span)[^>]*>\s*<\/(div|p|figure|span)>/gi, "");

    // Update block in DB
    if (body.block_id) {
      await sb.from("email_letter_blocks").update({
        generated_html: block_html,
        banner_image_prompt,
      }).eq("id", body.block_id);
    }

    return new Response(JSON.stringify({ block_html, banner_image_prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-email-block error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

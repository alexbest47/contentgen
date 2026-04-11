import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { optimizeImage } from "../_shared/optimizeImage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  mini_course: "Мини-курс", diagnostic: "Диагностика", webinar: "Вебинар",
  pre_list: "Предсписок", new_stream: "Старт нового потока", spot_available: "Освободилось место",
  discount: "Промокод", download_pdf: "Скачай PDF",
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

/** Normalize AI response images array to internal format */
function normalizeImagePlaceholders(images: any[]): any[] {
  return images.map((img: any) => ({
    id: img.placeholder_id || img.id,
    type: img.type || "",
    size: img.size || "",
    prompt: img.imagen_prompt || img.prompt || "",
    image_url: img.image_url || "",
  }));
}

async function completeTask(taskId: string, result: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb.from("task_queue").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    result,
  }).eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
}

async function failTask(taskId: string, errorMessage: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb.from("task_queue").update({
    status: "error",
    completed_at: new Date().toISOString(),
    error_message: errorMessage?.substring(0, 2000) || "Unknown error",
  }).eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
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

    // ── Image generation mode ──
    if (body.generate_image && body.prompt) {
      const placeholderId = body.placeholder_id;
      const imgApiKey = openrouterKey;
      const imgApiUrl = "https://openrouter.ai/api/v1/chat/completions";

      const tryGenerate = async (prompt: string): Promise<string> => {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 120000);
        let imageResp: Response;
        try {
          imageResp = await fetch(imgApiUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${imgApiKey}`, "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });
        } catch (err) {
          clearTimeout(fetchTimeout);
          if (err.name === "AbortError") throw new Error("Таймаут генерации изображения (120с)");
          throw err;
        }
        clearTimeout(fetchTimeout);

        if (!imageResp.ok) {
          const errText = await imageResp.text();
          console.error("Image API error:", imageResp.status, errText);
          if (imageResp.status === 429) throw new Error("Превышен лимит запросов, попробуйте позже");
          if (imageResp.status === 402) throw new Error("Недостаточно средств для генерации изображения");
          throw new Error(`API_ERROR_${imageResp.status}:${errText.substring(0, 200)}`);
        }

        const imageData = await imageResp.json();
        const message = imageData.choices?.[0]?.message;
        let imageUrl = message?.images?.[0]?.image_url?.url || "";

        if (!imageUrl && Array.isArray(message?.content)) {
          for (const part of message.content) {
            if (part.type === "image_url" && part.image_url?.url) {
              imageUrl = part.image_url.url;
              break;
            }
          }
        }

        if (!imageUrl) {
          console.error("No image in response:", JSON.stringify(imageData).substring(0, 500));
          throw new Error("NO_IMAGE_IN_RESPONSE");
        }

        return imageUrl;
      };

      let imageUrl = "";
      try {
        imageUrl = await tryGenerate(body.prompt);
      } catch (firstErr: any) {
        console.error("First attempt failed:", firstErr.message);
        if (firstErr.message?.startsWith("API_ERROR_4") || firstErr.message === "NO_IMAGE_IN_RESPONSE") {
          console.log("Retrying with simplified prompt...");
          const simplifiedPrompt = `Create a professional, abstract decorative banner image. Use soft gradients and geometric shapes. Size: 600x300 pixels. Modern, clean design.`;
          try {
            imageUrl = await tryGenerate(simplifiedPrompt);
          } catch (retryErr: any) {
            console.error("Retry also failed:", retryErr.message);
            throw new Error("Не удалось сгенерировать изображение после повторной попытки");
          }
        } else {
          throw firstErr;
        }
      }

      const base64 = imageUrl.split(",")[1];
      const rawBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const optimized = await optimizeImage(rawBytes);
      const bytes = optimized.bytes;
      const fileName = `email-letter-${placeholderId}-${Date.now()}.${optimized.ext}`;

      await sb.storage.from("generated-images").upload(fileName, bytes, { contentType: optimized.contentType, upsert: true });
      const { data: pub } = sb.storage.from("generated-images").getPublicUrl(fileName);
      const publicUrl = pub.publicUrl;

      // Update image_placeholders in email_letters so frontend sees the URL on next load
      const letterId = body.letter_id;
      if (letterId) {
        const { data: letterRow } = await sb.from("email_letters").select("image_placeholders").eq("id", letterId).single();
        if (letterRow) {
          const placeholders = Array.isArray(letterRow.image_placeholders) ? letterRow.image_placeholders : [];
          const updated = placeholders.map((p: any) =>
            (p.id === placeholderId) ? { ...p, image_url: publicUrl } : p
          );
          await sb.from("email_letters").update({ image_placeholders: updated }).eq("id", letterId);
        }
      }

      const responseData = { image_url: publicUrl };
      if (taskId) await completeTask(taskId, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Full letter generation mode ──
    const { letter_id } = body;
    if (!letter_id) throw new Error("Missing letter_id");

    const { data: letter, error: letterErr } = await sb.from("email_letters").select("*").eq("id", letter_id).single();
    if (letterErr || !letter) throw new Error("Письмо не найдено");

    const programId = letter.program_id;
    const offerId = letter.offer_id;
    const caseId = letter.case_id;
    const extraOfferIds: string[] = letter.extra_offer_ids || [];
    const colorSchemeId = letter.selected_color_scheme_id;
    const templateId = letter.template_id;
    const selectedObjectionIds: string[] = (letter as any).selected_objection_ids || [];
    const imageStyleId = (letter as any).image_style_id;
    const pdfMaterialId = (letter as any).pdf_material_id;
    const miniCourseOfferId = (letter as any).mini_course_offer_id;
    const preListOfferId = (letter as any).pre_list_offer_id;

    let program: any = null;
    if (programId) {
      const { data } = await sb.from("paid_programs").select("*").eq("id", programId).single();
      program = data;
    }

    let offerTitle = "", offerDesc = "", offerTypeLabel = "", offerValue = "", offerImageUrl = "";
    if (offerId) {
      const { data: offer } = await sb.from("offers").select("*").eq("id", offerId).single();
      if (offer) {
        offerTitle = offer.title;
        offerValue = offer.description || "";
        offerImageUrl = offer.image_url || "";
        offerDesc = offer.doc_url ? await fetchDocContent(offer.doc_url) : "";
        offerTypeLabel = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
      }
    }

    let caseContext = "";
    if (caseId) {
      const { data: caseData } = await sb.from("case_classifications").select("classification_json, file_name").eq("id", caseId).single();
      if (caseData) {
        caseContext = JSON.stringify(caseData.classification_json, null, 2);
      }
    }

    // Load PDF material data
    let pdfRegTitle = "", pdfRegUrl = "";
    if (pdfMaterialId) {
      const { data: pdfMat } = await sb.from("pdf_materials").select("title, landing_slug, landing_headline").eq("id", pdfMaterialId).single();
      if (pdfMat) {
        pdfRegTitle = pdfMat.title || "";
        pdfRegUrl = pdfMat.landing_slug ? `https://talentsy.ru/pdf/${pdfMat.landing_slug}` : "";
      }
    }

    // Load mini-course offer data
    let miniCourseTitle = "", miniCourseDescription = "", miniCourseUrl = "";
    if (miniCourseOfferId) {
      const { data: mcOffer } = await sb.from("offers").select("title, description, landing_url, doc_url").eq("id", miniCourseOfferId).single();
      if (mcOffer) {
        miniCourseTitle = mcOffer.title || "";
        miniCourseDescription = mcOffer.description || "";
        miniCourseUrl = mcOffer.landing_url || "";
        if (mcOffer.doc_url && !miniCourseDescription) {
          miniCourseDescription = await fetchDocContent(mcOffer.doc_url);
        }
      }
    }

    // Load pre_list offer data
    let preListTitle = "", preListDescription = "", preListUrl = "";
    if (preListOfferId) {
      const { data: plOffer } = await sb.from("offers").select("title, description, landing_url, doc_url").eq("id", preListOfferId).single();
      if (plOffer) {
        preListTitle = plOffer.title || "";
        preListDescription = plOffer.description || "";
        preListUrl = plOffer.landing_url || "";
        if (plOffer.doc_url && !preListDescription) {
          preListDescription = await fetchDocContent(plOffer.doc_url);
        }
      }
    }

    let offersSelectionContext = "";
    if (extraOfferIds.length > 0) {
      const { data: extras } = await sb.from("offers").select("title, description, offer_type, doc_url").in("id", extraOfferIds);
      if (extras && extras.length > 0) {
        const items = [];
        for (const ex of extras) {
          let desc = ex.description || "";
          if (ex.doc_url && !desc) desc = await fetchDocContent(ex.doc_url);
          items.push(`- ${ex.title} (${OFFER_TYPE_LABELS[ex.offer_type] || ex.offer_type}): ${desc}`);
        }
        offersSelectionContext = items.join("\n");
      }
    }

    // Fetch template name + category — needed for multi-offer check, prompt map, and content_email branch
    let templateName = "";
    let templateCategory = "";
    let templateContentType = "";
    if (templateId) {
      const { data: tpl } = await sb.from("email_templates").select("name, category, content_type").eq("id", templateId).single();
      if (tpl) {
        templateName = tpl.name;
        templateCategory = (tpl as any).category || "";
        templateContentType = (tpl as any).content_type || "";
      }
    }

    // Content-email branch: load selected content option (lead magnet / reference / etc)
    const isContentEmail = templateCategory === "content_email";
    let contentSourceTitle = "";
    let contentSourceData = "";
    if (isContentEmail) {
      const contentSourceId = (letter as any).content_source_id;
      // Objection-handling letter: load selected objections directly as source data
      if (templateContentType === "objection_handling" && selectedObjectionIds.length > 0) {
        const { data: objList } = await sb
          .from("objections")
          .select("id, objection_text, tags")
          .in("id", selectedObjectionIds);
        const ordered = selectedObjectionIds
          .map((id) => (objList || []).find((o: any) => o.id === id))
          .filter(Boolean);
        contentSourceTitle = "Отработка выбранных возражений";
        contentSourceData = ordered
          .map((o: any, i: number) => `${i + 1}. ${o.objection_text}${o.tags && o.tags.length ? ` [теги: ${o.tags.join(", ")}]` : ""}`)
          .join("\n");
      } else if (contentSourceId && contentSourceId !== "objection_direct") {
        const { data: src } = await sb
          .from("email_letter_lead_magnets")
          .select("title, payload, content_type")
          .eq("id", contentSourceId)
          .single();
        if (src) {
          contentSourceTitle = src.title || "";
          contentSourceData = JSON.stringify(src.payload || {}, null, 2);
        }
      }
    }

    // Multi-offer: build offers_data from offer_id + extra_offer_ids
    let offersData = "";
    const isMultiOffer = templateName === "Мультиоффер";
    if (isMultiOffer) {
      const allOfferIds: string[] = [];
      if (offerId) allOfferIds.push(offerId);
      if (letter.extra_offer_ids && Array.isArray(letter.extra_offer_ids)) {
        allOfferIds.push(...letter.extra_offer_ids.filter((id: string) => id && !allOfferIds.includes(id)));
      }

      if (allOfferIds.length > 0) {
        const { data: allOffers } = await sb
          .from("offers")
          .select("id, title, offer_type, description, landing_url, image_url")
          .in("id", allOfferIds);

        if (allOffers && allOffers.length > 0) {
          // Preserve order: main offer first, then extras
          const ordered = allOfferIds
            .map(id => allOffers.find(o => o.id === id))
            .filter(Boolean);

          offersData = ordered.map((offer: any, idx: number) => {
            const typeLabel = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
            return `ОФФЕР ${idx + 1}:\nТип: ${typeLabel}\nНазвание: ${offer.title}\nОписание: ${offer.description || "—"}\nСсылка: ${offer.landing_url || "{{OFFER_LINK}}"}`;
          }).join("\n\n");
        }
      }
    }

    let objectionDataMassive = "[]";
    if (selectedObjectionIds.length > 0) {
      const { data: objRows } = await sb.from("objections").select("id, objection_text").in("id", selectedObjectionIds);
      if (objRows && objRows.length > 0) {
        const ordered = selectedObjectionIds
          .map((id) => objRows.find((r: any) => r.id === id))
          .filter(Boolean)
          .map((r: any) => ({ id: r.id, objection: r.objection_text }));
        objectionDataMassive = JSON.stringify(ordered, null, 2);
      }
    }

    // Support chain_letter_slug from chain wizard or look up from DB
    let chainLetterSlug = body.chain_letter_slug || null;
    if (!chainLetterSlug && letter_id) {
      const { data: chainLink } = await sb
        .from("email_chain_letters")
        .select("slug")
        .eq("letter_id", letter_id)
        .maybeSingle();
      if (chainLink?.slug) chainLetterSlug = chainLink.slug;
    }

    // Auto-load objections by program_id for warming/closed chain letters when no explicit objections selected
    if (objectionDataMassive === "[]" && programId && chainLetterSlug) {
      const isChainSlugWithObjections = chainLetterSlug.startsWith("email-warming-letter-") || chainLetterSlug.startsWith("email-closed-letter-");
      if (isChainSlugWithObjections) {
        const { data: progObjRows } = await sb
          .from("objections")
          .select("id, objection_text")
          .eq("program_id", programId)
          .limit(7);
        if (progObjRows && progObjRows.length > 0) {
          objectionDataMassive = JSON.stringify(
            progObjRows.map((r: any) => ({ id: r.id, objection: r.objection_text })),
            null, 2
          );
          console.log(`Auto-loaded ${progObjRows.length} objections for program ${programId}`);
        }
      }
    }

    const TEMPLATE_PROMPT_MAP: Record<string, string> = {
      "Прямой оффер": "email-builder-direct-offer",
      "Приглашение на вебинар: письмо 1": "email-builder-webinar-letter-1",
      "Приглашение на вебинар: письмо 2": "email-builder-webinar-letter-2",
      "С нуля": "email-builder-free-form",
      "Доверимся ИИ": "email-builder-ai-driven",
      "Мультиоффер": "email-builder-multi-offer",
    };
    // For content_email templates, use the duplicated email-channel prompt by category
    const CONTENT_TYPE_TO_CATEGORY: Record<string, string> = {
      lead_magnet: "lead_magnets",
      reference_material: "reference_materials",
      expert_content: "expert_content",
      provocative_content: "provocative_content",
      testimonial_content: "testimonial_content",
      myth_busting: "myth_busting",
      objection_handling: "objection_handling",
    };
    const contentEmailSlug = isContentEmail && templateContentType
      ? `${CONTENT_TYPE_TO_CATEGORY[templateContentType] || templateContentType}-email`
      : null;
    const promptSlug = contentEmailSlug || chainLetterSlug || TEMPLATE_PROMPT_MAP[templateName] || "email-builder-full-letter";

    const { data: prompt } = await sb.from("prompts")
      .select("*")
      .eq("slug", promptSlug)
      .eq("is_active", true)
      .single();
    if (!prompt) throw new Error(`Промпт ${promptSlug} не найден. Создайте его в разделе «Управление промптами».`);

    const { data: gvRows } = await sb.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    gvRows?.forEach((r: any) => { gv[r.key] = r.value; });

    // Load image style from image_styles table, fallback to global variable
    let imageStyleText = gv.image_style || "";
    if (imageStyleId) {
      const { data: styleRow } = await sb.from("image_styles").select("description").eq("id", imageStyleId).single();
      if (styleRow?.description) imageStyleText = styleRow.description;
    }

    let brandStyle = "";
    if (colorSchemeId) {
      const { data: cs } = await sb.from("color_schemes").select("description").eq("id", colorSchemeId).single();
      if (cs) brandStyle = cs.description;
    }

    let audienceDescription = "";
    const audienceSegment = (letter as any).audience_segment || "";
    if (audienceSegment && gv[audienceSegment]) {
      audienceDescription = gv[audienceSegment];
    } else {
      if (program?.audience_doc_url) {
        try {
          const fresh = await fetchDocContent(program.audience_doc_url);
          if (fresh) {
            audienceDescription = fresh;
            await sb.from("paid_programs").update({ audience_description: fresh }).eq("id", program.id);
          }
        } catch (docErr) { console.error("Error fetching audience doc:", docErr); }
      }
      if (!audienceDescription) audienceDescription = program?.audience_description || "";
    }
    let programDocDescription = "";
    if (program?.program_doc_url) {
      programDocDescription = await fetchDocContent(program.program_doc_url);
    }

    const letterTheme = `${letter.letter_theme_title}\n${letter.letter_theme_description || ""}`;

    // Truncate large text inputs to prevent context overflow
    const MAX_FIELD_CHARS = 30000;
    function truncate(text: string, max = MAX_FIELD_CHARS): string {
      if (text.length <= max) return text;
      console.warn(`Truncating field from ${text.length} to ${max} chars`);
      return text.substring(0, max) + "\n...[обрезано]";
    }
    programDocDescription = truncate(programDocDescription);
    audienceDescription = truncate(audienceDescription);
    offerDesc = truncate(offerDesc);
    caseContext = truncate(caseContext);

    let userPrompt = prompt.user_prompt_template || "";

    // Heavy variables — only substitute into user_prompt, NOT into system_prompt
    // to avoid doubling token usage (system_prompt references them instructionally)
    const HEAVY_VARS = new Set([
      "audience_description", "program_doc_description", "case_data",
      "objection_data_massive", "offer_rules", "offer_description",
      "brand_style", "brand_voice", "antiAI_rules", "content_theme",
      "talentsy",
    ]);

    // Build a unified template vars map with image_style taking priority over global
    const templateVars: Record<string, string> = {
      ...gv,
      program_title: program?.title || "",
      program_description: program?.description || "",
      program_doc_description: programDocDescription,
      audience_description: audienceDescription,
      audience_segment: audienceSegment || "",
      offer_title: offerTitle,
      offer_value: offerValue,
      offer_description: offerDesc,
      offer_image: offerImageUrl,
      offer_type: offerTypeLabel,
      brand_style: brandStyle,
      letter_theme: letterTheme,
      content_theme: letterTheme,
      template_name: templateName,
      template_structure: templateName,
      case_data: caseContext,
      offers_selection: offersSelectionContext,
      extra_offers: offersSelectionContext,
      offers_data: offersData,
      pdf_reg_title: pdfRegTitle,
      pdf_reg_url: pdfRegUrl,
      mini_course_title: miniCourseTitle,
      mini_course_description: miniCourseDescription,
      mini_course_url: miniCourseUrl,
      pre_list_title: preListTitle,
      pre_list_description: preListDescription,
      pre_list_url: preListUrl,
      offer_rules: gv.offer_rules || "",
      antiAI_rules: gv.antiAI_rules || "",
      brand_voice: gv.brand_voice || "",
      objection_data_massive: objectionDataMassive,
      image_style: imageStyleText, // override global with selected style
      content_source_title: contentSourceTitle,
      content_source_data: contentSourceData,
      user_topic: (letter as any).user_topic || "",
    };

    function applyVars(text: string, vars: Record<string, string>): string {
      let result = text;
      for (const [k, v] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
      }
      return result;
    }

    // For system_prompt: replace heavy vars with "[см. данные в сообщении]"
    const lightSystemVars: Record<string, string> = {};
    for (const [k, v] of Object.entries(templateVars)) {
      if (HEAVY_VARS.has(k)) {
        lightSystemVars[k] = `[данные ${k} — см. сообщение пользователя]`;
      } else {
        lightSystemVars[k] = v;
      }
    }

    userPrompt = applyVars(userPrompt, templateVars);
    const resolvedSystemPrompt = applyVars(
      prompt.system_prompt || "Ты генератор email-писем. Возвращай JSON с полями letter_html и images.",
      lightSystemVars
    );

    // Dynamic max_tokens to stay within context limit
    const estimatedInputTokens = Math.ceil((resolvedSystemPrompt.length + userPrompt.length) / 4);
    const contextLimit = 200000;
    const maxTokens = Math.min(64000, Math.max(8000, contextLimit - estimatedInputTokens - 2000));
    console.log(`Input ~${estimatedInputTokens} tokens, max_tokens=${maxTokens}`);

    const anthropicBody = JSON.stringify({
      model: prompt.model || "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: resolvedSystemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const anthropicHeaders = {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };

    let aiResp: Response | null = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: anthropicHeaders,
        body: anthropicBody,
      });

      if (aiResp.ok) break;

      // Retry on overloaded (529) or server errors (5xx)
      if ((aiResp.status === 529 || aiResp.status >= 500) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        console.warn(`Anthropic API returned ${aiResp.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await aiResp.text(); // consume body
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const errBody = await aiResp.text();
      throw new Error(`Anthropic API error (${aiResp.status}): ${errBody.substring(0, 500)}`);
    }

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || "";

    let html = "", imagePlaceholders: any[] = [];
    let emailSubject = "", emailPreheader = "";
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Fallback: Claude sometimes returns JSON with literal newlines inside string values.
        // Replace actual newlines with spaces (safe for HTML email context).
        const fixedStr = jsonStr.replace(/\r?\n/g, " ");
        parsed = JSON.parse(fixedStr);
        console.warn("JSON parsed after newline fix");
      }

      html = parsed.letter_html || parsed.html || parsed.block_html || text;
      const rawImages = parsed.images || parsed.image_placeholders || [];
      imagePlaceholders = normalizeImagePlaceholders(rawImages);
      emailSubject = parsed.email_subject || "";
      emailPreheader = parsed.email_preheader || "";
    } catch (e) {
      console.error("JSON parse failed:", (e as Error).message, "text start:", text.substring(0, 200));
      html = text;
    }

    if (!html) {
      throw new Error("ИИ вернул пустой ответ. Попробуйте сгенерировать письмо ещё раз.");
    }

    const updatePayload: Record<string, any> = {
      generated_html: html,
      image_placeholders: imagePlaceholders,
      status: "ready",
    };
    if (emailSubject) updatePayload.subject = emailSubject;
    if (emailPreheader) updatePayload.preheader = emailPreheader;

    // Use fresh client to survive HTTP connection timeout
    const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    console.log("Updating email_letters", letter_id, "html length:", html.length, "status:", updatePayload.status);
    const { error: updateErr } = await freshSb.from("email_letters").update(updatePayload).eq("id", letter_id);
    if (updateErr) {
      console.error("Failed to update email_letters:", JSON.stringify(updateErr));
    } else {
      console.log("Successfully updated email_letters", letter_id);
    }

    const responseData = { html, image_placeholders: imagePlaceholders, email_subject: emailSubject, email_preheader: emailPreheader };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-email-letter error:", e);
    if (taskId) await failTask(taskId, e.message).catch(() => {});
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

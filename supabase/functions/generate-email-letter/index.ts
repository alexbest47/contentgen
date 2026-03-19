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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
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
        const imageResp = await fetch(imgApiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${imgApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

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
        // Retry with simplified prompt on 400/safety errors
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
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fileName = `email-letter-${placeholderId}-${Date.now()}.png`;

      await sb.storage.from("generated-images").upload(fileName, bytes, { contentType: "image/png", upsert: true });
      const { data: pub } = sb.storage.from("generated-images").getPublicUrl(fileName);

      return new Response(JSON.stringify({ image_url: pub.publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Full letter generation mode ──
    const { letter_id } = body;
    if (!letter_id) throw new Error("Missing letter_id");

    // 1. Load letter
    const { data: letter, error: letterErr } = await sb.from("email_letters").select("*").eq("id", letter_id).single();
    if (letterErr || !letter) throw new Error("Письмо не найдено");

    const programId = letter.program_id;
    const offerId = letter.offer_id;
    const caseId = letter.case_id;
    const extraOfferIds: string[] = letter.extra_offer_ids || [];
    const colorSchemeId = letter.selected_color_scheme_id;
    const templateId = letter.template_id;
    const selectedObjectionIds: string[] = (letter as any).selected_objection_ids || [];

    // 2. Load program
    let program: any = null;
    if (programId) {
      const { data } = await sb.from("paid_programs").select("*").eq("id", programId).single();
      program = data;
    }

    // 3. Load offer
    let offerTitle = "", offerDesc = "", offerTypeLabel = "", offerValue = "", offerImageUrl = "";
    if (offerId) {
      const { data: offer } = await sb.from("offers").select("*").eq("id", offerId).single();
      if (offer) {
        offerTitle = offer.title;
        offerValue = offer.description || "";
        offerImageUrl = offer.image_url || "";
        offerDesc = offer.doc_url ? await fetchGoogleDoc(offer.doc_url) : "";
        offerTypeLabel = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
      }
    }

    // 4. Load case
    let caseContext = "";
    if (caseId) {
      const { data: caseData } = await sb.from("case_classifications").select("classification_json, file_name").eq("id", caseId).single();
      if (caseData) {
        caseContext = JSON.stringify(caseData.classification_json, null, 2);
      }
    }

    // 5. Load extra offers (for {{offers_selection}})
    let offersSelectionContext = "";
    if (extraOfferIds.length > 0) {
      const { data: extras } = await sb.from("offers").select("title, description, offer_type, doc_url").in("id", extraOfferIds);
      if (extras && extras.length > 0) {
        const items = [];
        for (const ex of extras) {
          let desc = ex.description || "";
          if (ex.doc_url && !desc) desc = await fetchGoogleDoc(ex.doc_url);
          items.push(`- ${ex.title} (${OFFER_TYPE_LABELS[ex.offer_type] || ex.offer_type}): ${desc}`);
        }
        offersSelectionContext = items.join("\n");
      }
    }

    // 6. Load template name
    let templateName = "";
    if (templateId) {
      const { data: tpl } = await sb.from("email_templates").select("name").eq("id", templateId).single();
      if (tpl) {
        templateName = tpl.name;
      }
    }

    // 7. Load objections for direct offer
    let objectionDataMassive = "[]";
    if (selectedObjectionIds.length > 0) {
      const { data: objRows } = await sb.from("objections").select("id, objection_text").in("id", selectedObjectionIds);
      if (objRows && objRows.length > 0) {
        // Preserve user-specified order
        const ordered = selectedObjectionIds
          .map((id) => objRows.find((r: any) => r.id === id))
          .filter(Boolean)
          .map((r: any) => ({ id: r.id, objection: r.objection_text }));
        objectionDataMassive = JSON.stringify(ordered, null, 2);
      }
    }

    // 8. Determine prompt slug based on template
    const promptSlug = templateName === "Прямой оффер" ? "email-builder-direct-offer" : "email-builder-full-letter";

    // 9. Load prompt
    const { data: prompt } = await sb.from("prompts")
      .select("*")
      .eq("slug", promptSlug)
      .eq("is_active", true)
      .single();
    if (!prompt) throw new Error(`Промпт ${promptSlug} не найден. Создайте его в разделе «Управление промптами».`);

    // 10. Load global variables
    const { data: gvRows } = await sb.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    gvRows?.forEach((r: any) => { gv[r.key] = r.value; });

    // 11. Load color scheme
    let brandStyle = "";
    if (colorSchemeId) {
      const { data: cs } = await sb.from("color_schemes").select("description").eq("id", colorSchemeId).single();
      if (cs) brandStyle = cs.description;
    }

    // 12. Fetch audience description from audience_segment global variable
    let audienceDescription = "";
    const audienceSegment = (letter as any).audience_segment || "";
    if (audienceSegment && gv[audienceSegment]) {
      audienceDescription = gv[audienceSegment];
    } else {
      // Fallback to program audience
      audienceDescription = program?.audience_description || "";
      if (program?.audience_doc_url && !audienceDescription) {
        audienceDescription = await fetchGoogleDoc(program.audience_doc_url);
        if (audienceDescription) {
          await sb.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
        }
      }
    }
    let programDocDescription = "";
    if (program?.program_doc_url) {
      programDocDescription = await fetchGoogleDoc(program.program_doc_url);
    }

    // 13. Build letter theme
    const letterTheme = `${letter.letter_theme_title}\n${letter.letter_theme_description || ""}`;

    // 14. Build user prompt with variable substitution
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
      .replace(/\{\{offer_type\}\}/g, offerTypeLabel)
      .replace(/\{\{brand_style\}\}/g, brandStyle)
      .replace(/\{\{letter_theme\}\}/g, letterTheme)
      .replace(/\{\{template_name\}\}/g, templateName)
      .replace(/\{\{template_structure\}\}/g, templateName) // backward compat
      .replace(/\{\{case_data\}\}/g, caseContext)
      .replace(/\{\{offers_selection\}\}/g, offersSelectionContext)
      .replace(/\{\{extra_offers\}\}/g, offersSelectionContext) // backward compat
      .replace(/\{\{offer_rules\}\}/g, gv.offer_rules || "")
      .replace(/\{\{antiAI_rules\}\}/g, gv.antiAI_rules || "")
      .replace(/\{\{brand_voice\}\}/g, gv.brand_voice || "")
      .replace(/\{\{objection_data_massive\}\}/g, objectionDataMassive);

    // Replace remaining global variables
    for (const [k, v] of Object.entries(gv)) {
      userPrompt = userPrompt.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
    }

    // 13. Call Anthropic
    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: prompt.system_prompt || "Ты генератор email-писем. Возвращай JSON с полями letter_html и images.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || "";

    // 14. Parse JSON — support both new (letter_html/images) and old (html/image_placeholders) formats
    let html = "", imagePlaceholders: any[] = [];
    let emailSubject = "", emailPreheader = "";
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonStr);

      // New format: letter_html; fallback: html / block_html
      html = parsed.letter_html || parsed.html || parsed.block_html || text;

      // New format: images; fallback: image_placeholders
      const rawImages = parsed.images || parsed.image_placeholders || [];
      imagePlaceholders = normalizeImagePlaceholders(rawImages);

      // Extract subject/preheader if provided
      emailSubject = parsed.email_subject || "";
      emailPreheader = parsed.email_preheader || "";
    } catch {
      html = text;
    }

    // 15. Save to DB
    const updatePayload: Record<string, any> = {
      generated_html: html,
      image_placeholders: imagePlaceholders,
      status: "ready",
    };
    if (emailSubject) updatePayload.subject = emailSubject;
    if (emailPreheader) updatePayload.preheader = emailPreheader;

    await sb.from("email_letters").update(updatePayload).eq("id", letter_id);

    return new Response(JSON.stringify({ html, image_placeholders: imagePlaceholders, email_subject: emailSubject, email_preheader: emailPreheader }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-email-letter error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

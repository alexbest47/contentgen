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

    // ── Image generation mode ──
    if (body.generate_image && body.prompt) {
      const placeholderId = body.placeholder_id;
      const imageResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: body.prompt }],
          modalities: ["image", "text"],
        }),
      });
      const imageData = await imageResp.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("Не удалось сгенерировать изображение");

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

    // 2. Load program
    let program: any = null;
    if (programId) {
      const { data } = await sb.from("paid_programs").select("*").eq("id", programId).single();
      program = data;
    }

    // 3. Load offer
    let offerTitle = "", offerDesc = "", offerTypeLabel = "";
    if (offerId) {
      const { data: offer } = await sb.from("offers").select("*").eq("id", offerId).single();
      if (offer) {
        offerTitle = offer.title;
        offerDesc = offer.description || "";
        offerTypeLabel = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
        if (offer.doc_url && !offerDesc) {
          offerDesc = await fetchGoogleDoc(offer.doc_url);
        }
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

    // 5. Load extra offers
    let extraOffersContext = "";
    if (extraOfferIds.length > 0) {
      const { data: extras } = await sb.from("offers").select("title, description, offer_type, doc_url").in("id", extraOfferIds);
      if (extras && extras.length > 0) {
        const items = [];
        for (const ex of extras) {
          let desc = ex.description || "";
          if (ex.doc_url && !desc) desc = await fetchGoogleDoc(ex.doc_url);
          items.push(`- ${ex.title} (${OFFER_TYPE_LABELS[ex.offer_type] || ex.offer_type}): ${desc}`);
        }
        extraOffersContext = items.join("\n");
      }
    }

    // 6. Load template
    let templateStructure = "";
    if (templateId) {
      const { data: tpl } = await sb.from("email_templates").select("name, blocks").eq("id", templateId).single();
      if (tpl) {
        templateStructure = JSON.stringify(tpl.blocks, null, 2);
      }
    }

    // 7. Load prompt
    const { data: prompt } = await sb.from("prompts")
      .select("*")
      .eq("slug", "email-builder-full-letter")
      .eq("is_active", true)
      .single();
    if (!prompt) throw new Error("Промпт email-builder-full-letter не найден. Создайте его в разделе «Управление промптами».");

    // 8. Load global variables
    const { data: gvRows } = await sb.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    gvRows?.forEach((r: any) => { gv[r.key] = r.value; });

    // 9. Load color scheme
    let brandStyle = "";
    if (colorSchemeId) {
      const { data: cs } = await sb.from("color_schemes").select("description").eq("id", colorSchemeId).single();
      if (cs) brandStyle = cs.description;
    }

    // 10. Fetch audience/program docs
    let audienceDescription = program?.audience_description || "";
    if (program?.audience_doc_url && !audienceDescription) {
      audienceDescription = await fetchGoogleDoc(program.audience_doc_url);
      if (audienceDescription) {
        await sb.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
      }
    }
    let programDocDescription = "";
    if (program?.program_doc_url) {
      programDocDescription = await fetchGoogleDoc(program.program_doc_url);
    }

    // 11. Build letter theme
    const letterTheme = `${letter.letter_theme_title}\n${letter.letter_theme_description || ""}`;

    // 12. Build user prompt
    let userPrompt = prompt.user_prompt_template || "";
    userPrompt = userPrompt
      .replace(/\{\{program_title\}\}/g, program?.title || "")
      .replace(/\{\{program_description\}\}/g, program?.description || "")
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_title\}\}/g, offerTitle)
      .replace(/\{\{offer_description\}\}/g, offerDesc)
      .replace(/\{\{offer_type\}\}/g, offerTypeLabel)
      .replace(/\{\{brand_style\}\}/g, brandStyle)
      .replace(/\{\{letter_theme\}\}/g, letterTheme)
      .replace(/\{\{template_structure\}\}/g, templateStructure)
      .replace(/\{\{case_data\}\}/g, caseContext)
      .replace(/\{\{extra_offers\}\}/g, extraOffersContext)
      .replace(/\{\{offer_rules\}\}/g, gv.offer_rules || "")
      .replace(/\{\{antiAI_rules\}\}/g, gv.antiAI_rules || "")
      .replace(/\{\{brand_voice\}\}/g, gv.brand_voice || "");

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
        system: prompt.system_prompt || "Ты генератор email-писем. Возвращай JSON с полями html и image_placeholders.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || "";

    // 14. Parse JSON
    let html = "", image_placeholders: any[] = [];
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonStr);
      html = parsed.html || parsed.block_html || text;
      image_placeholders = parsed.image_placeholders || [];
    } catch {
      html = text;
    }

    // 15. Save to DB
    await sb.from("email_letters").update({
      generated_html: html,
      image_placeholders: image_placeholders,
      status: "ready",
    }).eq("id", letter_id);

    return new Response(JSON.stringify({ html, image_placeholders }), {
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

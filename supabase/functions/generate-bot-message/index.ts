import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchDocContent(url: string): Promise<string> {
  try {
    if (!url) return "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    const resp = await fetch(`${supabaseUrl}/functions/v1/fetch-google-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ url }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!resp.ok) return "";
    const data = await resp.json();
    return data.text || "";
  } catch (_) {
    return "";
  }
}

async function completeTask(taskId: string, result: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb
    .from("task_queue")
    .update({ status: "completed", completed_at: new Date().toISOString(), result })
    .eq("id", taskId);
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
  await sb
    .from("task_queue")
    .update({
      status: "error",
      completed_at: new Date().toISOString(),
      error_message: errorMessage?.substring(0, 2000) || "Unknown error",
    })
    .eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
}

function applyVars(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v ?? "");
  }
  return result;
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
    if (body.generate_image) {
      const messageId = body.message_id;
      if (!messageId) throw new Error("Missing message_id");

      const { data: msg, error: msgErr } = await sb
        .from("bot_chain_messages")
        .select("*")
        .eq("id", messageId)
        .single();
      if (msgErr || !msg) throw new Error("Сообщение не найдено");
      if (!msg.imagen_prompt) throw new Error("У сообщения нет imagen_prompt");

      // Resolve image_style into prompt
      let imageStyleText = "";
      const { data: chain } = await sb
        .from("bot_chains")
        .select("image_style_id")
        .eq("id", msg.chain_id)
        .single();
      if (chain?.image_style_id) {
        const { data: styleRow } = await sb
          .from("image_styles")
          .select("description")
          .eq("id", chain.image_style_id)
          .single();
        if (styleRow?.description) imageStyleText = styleRow.description;
      }
      if (!imageStyleText) {
        const { data: gv } = await sb
          .from("prompt_global_variables")
          .select("value")
          .eq("key", "image_style")
          .maybeSingle();
        imageStyleText = gv?.value || "";
      }

      const finalPrompt = applyVars(msg.imagen_prompt, { image_style: imageStyleText });

      const imgApiUrl = "https://openrouter.ai/api/v1/chat/completions";
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 120000);
      let imageResp: Response;
      try {
        imageResp = await fetch(imgApiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: finalPrompt }],
            modalities: ["image", "text"],
          }),
        });
      } catch (err: any) {
        clearTimeout(fetchTimeout);
        if (err.name === "AbortError") throw new Error("Таймаут генерации изображения (120с)");
        throw err;
      }
      clearTimeout(fetchTimeout);

      if (!imageResp.ok) {
        const errText = await imageResp.text();
        throw new Error(`Image API error ${imageResp.status}: ${errText.substring(0, 200)}`);
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
      if (!imageUrl) throw new Error("NO_IMAGE_IN_RESPONSE");

      const base64 = imageUrl.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fileName = `bot-message-${messageId}-${Date.now()}.png`;

      await sb.storage
        .from("generated-images")
        .upload(fileName, bytes, { contentType: "image/png", upsert: true });
      const { data: pub } = sb.storage.from("generated-images").getPublicUrl(fileName);
      const publicUrl = pub.publicUrl;

      await sb
        .from("bot_chain_messages")
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", messageId);

      const responseData = { image_url: publicUrl };
      if (taskId) await completeTask(taskId, responseData);
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Full text generation mode ──
    const { message_id } = body;
    if (!message_id) throw new Error("Missing message_id");

    const { data: msg, error: msgErr } = await sb
      .from("bot_chain_messages")
      .select("*")
      .eq("id", message_id)
      .single();
    if (msgErr || !msg) throw new Error("Сообщение не найдено");

    // Mark processing ASAP so UI reflects progress
    await sb
      .from("bot_chain_messages")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", message_id);

    const { data: chain, error: chainErr } = await sb
      .from("bot_chains")
      .select("*")
      .eq("id", msg.chain_id)
      .single();
    if (chainErr || !chain) throw new Error("Цепочка не найдена");

    // Load prompt by slug
    const { data: prompt, error: pErr } = await sb
      .from("prompts")
      .select("*")
      .eq("slug", msg.prompt_slug)
      .eq("is_active", true)
      .single();
    if (pErr || !prompt) {
      throw new Error(`Промпт ${msg.prompt_slug} не найден`);
    }

    // Load context data
    let program: any = null;
    if (chain.program_id) {
      const { data } = await sb.from("paid_programs").select("*").eq("id", chain.program_id).single();
      program = data;
    }

    let offer: any = null;
    let offerTitle = "";
    let offerDesc = "";
    let webinarData = "";
    if (chain.webinar_offer_id) {
      const { data } = await sb.from("offers").select("*").eq("id", chain.webinar_offer_id).single();
      offer = data;
      if (offer) {
        offerTitle = offer.title || "";
        offerDesc = offer.description || "";
        if (offer.doc_url && !offerDesc) offerDesc = await fetchDocContent(offer.doc_url);

        // webinar_data: title + date + landing_url + program
        const parts: string[] = [];
        if (offer.title) parts.push(`Название: ${offer.title}`);
        if (offer.webinar_date) parts.push(`Дата: ${offer.webinar_date}`);
        if (offer.landing_url) parts.push(`URL лендинга: ${offer.landing_url}`);
        if (program?.title) parts.push(`Программа: ${program.title}`);
        if (offer.is_autowebinar) parts.push(`Автовебинар: да`);
        webinarData = parts.join("\n");
      }
    }

    // Brand style from color scheme
    let brandStyle = "";
    if (chain.selected_color_scheme_id) {
      const { data: cs } = await sb
        .from("color_schemes")
        .select("description")
        .eq("id", chain.selected_color_scheme_id)
        .single();
      if (cs) brandStyle = cs.description || "";
    }

    // Image style text
    let imageStyleText = "";
    if (chain.image_style_id) {
      const { data: styleRow } = await sb
        .from("image_styles")
        .select("description")
        .eq("id", chain.image_style_id)
        .single();
      if (styleRow?.description) imageStyleText = styleRow.description;
    }

    // Audience description
    const audienceSegment = chain.audience_segment || "";
    let audienceDescription = "";
    const { data: gvRows } = await sb.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    gvRows?.forEach((r: any) => {
      gv[r.key] = r.value;
    });
    if (!imageStyleText) imageStyleText = gv.image_style || "";
    if (audienceSegment && gv[audienceSegment]) {
      audienceDescription = gv[audienceSegment];
    } else if (program?.audience_description) {
      audienceDescription = program.audience_description;
    } else if (program?.audience_doc_url) {
      audienceDescription = await fetchDocContent(program.audience_doc_url);
    }

    // Enrich offer description with program doc if empty
    let programDescription = "";
    if (program?.program_doc_url) {
      programDescription = await fetchDocContent(program.program_doc_url);
    }
    if (!offerDesc && programDescription) {
      offerDesc = programDescription;
    }

    // Truncate heavy vars
    const MAX = 30000;
    const trunc = (t: string) => (t.length > MAX ? t.substring(0, MAX) + "\n...[обрезано]" : t);

    const templateVars: Record<string, string> = {
      ...gv,
      webinar_data: trunc(webinarData),
      offer_title: offerTitle,
      offer_description: trunc(offerDesc),
      program_title: program?.title || "",
      program_description: trunc(programDescription),
      program_doc_description: trunc(programDescription),
      audience_segment: trunc(audienceDescription || audienceSegment || ""),
      brand_style: trunc(brandStyle),
      brand_voice: gv.brand_voice || "",
      antiAI_rules: gv.antiAI_rules || "",
      talentsy: gv.talentsy || "",
      image_style: imageStyleText,
    };

    const userPrompt = applyVars(prompt.user_prompt_template || "", templateVars);
    const systemPrompt = applyVars(
      prompt.system_prompt || "Ты генератор сообщений для Telegram/Max-бота. Возвращай строго JSON.",
      templateVars,
    );

    const estimatedInputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const maxTokens = Math.min(16000, Math.max(4000, 200000 - estimatedInputTokens - 2000));

    const anthropicBody = JSON.stringify({
      model: prompt.model || "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    let aiResp: Response | null = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 110000);
      try {
        aiResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: anthropicBody,
          signal: ctrl.signal,
        });
      } catch (err: any) {
        clearTimeout(to);
        if (err.name === "AbortError" && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        throw new Error(`Anthropic fetch failed: ${err.message}`);
      }
      clearTimeout(to);
      if (aiResp.ok) break;
      if ((aiResp.status === 529 || aiResp.status >= 500) && attempt < 2) {
        await aiResp.text();
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1500));
        continue;
      }
      const errBody = await aiResp.text();
      throw new Error(`Anthropic API error (${aiResp.status}): ${errBody.substring(0, 500)}`);
    }

    const aiData = await aiResp!.json();
    const text = aiData.content?.[0]?.text || "";

    // Parse JSON out of response
    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        const fixed = jsonStr.replace(/\r?\n/g, " ");
        parsed = JSON.parse(fixed);
      }
    } catch (e) {
      console.error("JSON parse failed:", (e as Error).message, "text:", text.substring(0, 300));
      throw new Error("Не удалось распарсить JSON-ответ от модели");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Модель вернула пустой или некорректный JSON");
    }

    const messageText: string = parsed.message_text || "";
    const imagenPrompt: string = parsed.image?.imagen_prompt || "";
    const imageSize: string = parsed.image?.size || "";

    const updatePayload: Record<string, any> = {
      status: "ready",
      generated_json: parsed,
      message_text: messageText,
      imagen_prompt: imagenPrompt,
      image_size: imageSize,
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    const freshSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: updateErr } = await freshSb
      .from("bot_chain_messages")
      .update(updatePayload)
      .eq("id", message_id);
    if (updateErr) {
      console.error("Failed to update bot_chain_messages:", JSON.stringify(updateErr));
    }

    const responseData = { parsed, message_text: messageText, imagen_prompt: imagenPrompt };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-bot-message error:", e);
    // Also mark message as errored if we can
    try {
      const bodyClone = await (async () => null)();
    } catch {}
    if (taskId) await failTask(taskId, e.message).catch(() => {});
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

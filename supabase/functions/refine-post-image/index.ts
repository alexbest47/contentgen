// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { optimizeImage } from "../_shared/optimizeImage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

const DEFAULT_SYSTEM_PROMPT = `You are editing an existing brand image. Preserve the overall composition, style, palette, typography and brand language of the provided image. Only apply the specific edits the user requests. Do not redesign the image. Keep the same aspect ratio and visual identity.`;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function completeTask(taskId: string | undefined, result: any) {
  if (!taskId) return;
  await sb.from("task_queue").update({ status: "completed", result, completed_at: new Date().toISOString() }).eq("id", taskId);
}
async function failTask(taskId: string | undefined, errorMessage: string) {
  if (!taskId) return;
  await sb.from("task_queue").update({ status: "failed", error_message: errorMessage, completed_at: new Date().toISOString() }).eq("id", taskId);
}

async function urlToDataUrl(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch image: ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const b64 = btoa(bin);
  const ct = r.headers.get("content-type") || "image/png";
  return `data:${ct};base64,${b64}`;
}

function extractImageFromOpenRouter(data: any): string | null {
  const msg = data?.choices?.[0]?.message;
  if (!msg) return null;
  if (Array.isArray(msg.images) && msg.images.length > 0) {
    const im = msg.images[0];
    if (typeof im === "string") return im;
    if (im?.image_url?.url) return im.image_url.url;
    if (im?.url) return im.url;
  }
  if (Array.isArray(msg.content)) {
    for (const c of msg.content) {
      if (c?.type === "image_url" && c?.image_url?.url) return c.image_url.url;
      if (c?.type === "output_image" && c?.image_url) return c.image_url;
    }
  }
  return null;
}

async function uploadDataUrl(dataUrl: string, path: string, optimize: boolean): Promise<string> {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URL from model");
  let contentType = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  let bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let finalPath = path;
  if (optimize) {
    const opt = await optimizeImage(bytes);
    bytes = opt.bytes;
    contentType = opt.contentType;
    finalPath = path.replace(/\.[a-zA-Z0-9]+$/, "") + "." + opt.ext;
  }
  const { error } = await sb.storage.from("generated-images").upload(finalPath, bytes, { contentType, upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from("generated-images").getPublicUrl(finalPath);
  return data.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | undefined;
  try {
    const body = await req.json();
    taskId = body._task_id;
    const {
      mode,
      project_id,
      content_type,
      slide_number,
      bot_message_id,
      letter_id,
      placeholder_id,
      user_instructions,
      system_prompt,
    } = body;

    if (!user_instructions) throw new Error("user_instructions required");
    if (!mode) throw new Error("mode required");

    // 1) Load current image URL + target row
    let currentUrl: string | null = null;
    let targetCategory: string | null = null;

    let letterPlaceholders: any[] | null = null;
    if (mode === "bot_message") {
      if (!bot_message_id) throw new Error("bot_message_id required");
      const { data, error } = await sb.from("bot_chain_messages").select("image_url").eq("id", bot_message_id).single();
      if (error) throw error;
      currentUrl = data?.image_url;
    } else if (mode === "email_placeholder") {
      if (!letter_id || !placeholder_id) throw new Error("letter_id and placeholder_id required");
      const { data, error } = await sb.from("email_letters").select("image_placeholders").eq("id", letter_id).single();
      if (error) throw error;
      letterPlaceholders = (data?.image_placeholders as any[]) || [];
      const ph = letterPlaceholders.find((p) => p.id === placeholder_id);
      currentUrl = ph?.image_url || null;
    } else {
      if (!project_id || !content_type) throw new Error("project_id and content_type required");
      if (mode === "static") targetCategory = `static_image_${content_type}`;
      else if (mode === "banner") targetCategory = `banner_${content_type}`;
      else if (mode === "carousel") {
        if (!slide_number) throw new Error("slide_number required for carousel");
        targetCategory = `carousel_${content_type}_${slide_number}`;
      } else throw new Error(`Unknown mode: ${mode}`);

      const { data, error } = await sb
        .from("content_pieces")
        .select("id, content")
        .eq("project_id", project_id)
        .eq("category", targetCategory)
        .maybeSingle();
      if (error) throw error;
      currentUrl = data?.content;
    }

    if (!currentUrl) throw new Error("Current image not found");

    // 2) Fetch image as data URL
    const imageDataUrl = await urlToDataUrl(currentUrl);

    // 3) Call OpenRouter Gemini multimodal
    const sys = (system_prompt && String(system_prompt).trim()) || DEFAULT_SYSTEM_PROMPT;
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${sys}\n\nUser edits:\n${user_instructions}` },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!orRes.ok) {
      const t = await orRes.text();
      throw new Error(`OpenRouter error ${orRes.status}: ${t}`);
    }
    const orData = await orRes.json();
    const newImage = extractImageFromOpenRouter(orData);
    if (!newImage) {
      const snippet = JSON.stringify(orData).slice(0, 800);
      throw new Error(`No image returned by model. Response: ${snippet}`);
    }

    // 4) Upload
    const keyBase = mode === "bot_message"
      ? `bot_messages/${bot_message_id}_refine_${Date.now()}.png`
      : mode === "email_placeholder"
        ? `email-letter-${placeholder_id}-refine-${Date.now()}.png`
        : `${project_id}/${targetCategory}_refine_${Date.now()}.png`;
    // Only optimize for email letters (emails need to be lightweight).
    // Posts / carousels / banners / bot messages keep original quality.
    const shouldOptimize = mode === "email_placeholder";
    const publicUrl = newImage.startsWith("data:")
      ? await uploadDataUrl(newImage, keyBase, shouldOptimize)
      : newImage;

    // 5) Update DB
    if (mode === "bot_message") {
      await sb.from("bot_chain_messages").update({ image_url: publicUrl }).eq("id", bot_message_id);
    } else if (mode === "email_placeholder") {
      const updated = (letterPlaceholders || []).map((p: any) =>
        p.id === placeholder_id ? { ...p, image_url: publicUrl } : p
      );
      await sb.from("email_letters").update({ image_placeholders: updated }).eq("id", letter_id);
    } else {
      const { data: existing } = await sb
        .from("content_pieces")
        .select("id")
        .eq("project_id", project_id)
        .eq("category", targetCategory!)
        .maybeSingle();
      if (existing?.id) {
        await sb.from("content_pieces").update({ content: publicUrl, updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await sb.from("content_pieces").insert({ project_id, category: targetCategory!, content: publicUrl });
      }
    }

    await completeTask(taskId, { image_url: publicUrl });
    return new Response(JSON.stringify({ success: true, image_url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await failTask(taskId, msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

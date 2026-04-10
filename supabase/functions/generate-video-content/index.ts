import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Safe base64 encoding for large ArrayBuffers (no spread operator limit)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;
  let stageId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    stageId = body.stage_id || null;

    const stage_id = stageId;
    if (!stage_id) throw new Error("stage_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Load stage
    const { data: stage, error: stageErr } = await supabase
      .from("video_stages")
      .select("*")
      .eq("id", stage_id)
      .single();
    if (stageErr || !stage) throw new Error(`Stage not found: ${stageErr?.message || stage_id}`);

    // Mark stage as generating
    await supabase
      .from("video_stages")
      .update({ status: "generating", task_id: taskId, error_message: null, updated_at: new Date().toISOString() })
      .eq("id", stage_id);

    // Update project status to in_progress
    await supabase
      .from("video_projects")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", stage.video_project_id);

    const model = stage.model || "google/gemini-3.1-flash-image-preview";
    const prompt = stage.prompt || "";
    const config = stage.config || {};
    const stageType = stage.stage_type; // "image" or "video"

    // Extract image from various OpenRouter response formats
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

    let resultUrl: string;
    let resultMetadata: Record<string, any> = {};

    if (stageType === "image") {
      // ─── Image generation via OpenRouter ───
      const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
      if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

      const messages: any[] = [];

      if (stage.reference_image_url) {
        messages.push({
          role: "user",
          content: [
            { type: "image_url", image_url: { url: stage.reference_image_url } },
            { type: "text", text: prompt },
          ],
        });
      } else {
        messages.push({ role: "user", content: prompt });
      }

      console.log(`Generating image with model ${model}, prompt: ${prompt.substring(0, 200)}`);

      const imageResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          modalities: ["image", "text"],
        }),
      });

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        throw new Error(`Image API error ${imageResponse.status}: ${errText}`);
      }

      const imageData = await imageResponse.json();

      // Check for content filter / moderation block
      const finishReason = imageData?.choices?.[0]?.finish_reason;
      if (finishReason === "content_filter") {
        throw new Error("Запрос заблокирован контент-фильтром модели. Попробуйте изменить промпт — возможно, он содержит защищённые авторские персонажи или запрещённый контент.");
      }

      const imageB64Url = extractImageFromOpenRouter(imageData);
      if (!imageB64Url) {
        throw new Error("Модель не вернула изображение. finish_reason: " + (finishReason || "unknown") + ". Попробуйте другой промпт или модель.");
      }

      // Upload to Supabase storage
      // Upload image to storage (handle both data URL and direct URL)
      if (imageB64Url.startsWith("data:")) {
        const match = imageB64Url.match(/^data:(.+?);base64,(.*)$/);
        if (!match) throw new Error("Invalid data URL from model");
        const contentType = match[1];
        const b64 = match[2];
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const filePath = `video-content/${stage.video_project_id}/${stage_id}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("generated-images")
          .upload(filePath, bytes, { contentType, upsert: true });
        if (uploadErr) throw new Error(`Upload error: ${uploadErr.message}`);

        const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(filePath);
        resultUrl = urlData.publicUrl;
      } else {
        // Direct URL from API
        resultUrl = imageB64Url;
      }
      // Calculate actual resolution from aspect_ratio + quality
      const qualityBase: Record<string, number> = { "1K": 1024, "2K": 2048, "4K": 4096 };
      const base = qualityBase[config.quality] || 1024;
      const [aw, ah] = (config.aspect_ratio || "9:16").split(":").map(Number);
      let resW = base, resH = base;
      if (aw && ah) {
        if (aw >= ah) { resW = Math.round((base * aw) / ah); resH = base; }
        else { resW = base; resH = Math.round((base * ah) / aw); }
      }

      resultMetadata = {
        model,
        aspect_ratio: config.aspect_ratio,
        quality: config.quality,
        resolution: `${resW}x${resH}`,
        generated_at: new Date().toISOString(),
      };

    } else if (stageType === "video") {
      // ─── Video generation via Google Gemini API (Veo 3.1) ───
      const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
      if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

      const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
      const videoModel = model || "veo-3.1-fast-generate-preview";

      // Build request body for Gemini predictLongRunning
      const instance: Record<string, any> = { prompt };

      // Download image and convert to base64 for Veo image-to-video
      const imageUrlToUpload = stage.start_frame_url || stage.reference_image_url;
      if (imageUrlToUpload) {
        try {
          console.log(`Downloading image for start frame: ${imageUrlToUpload.substring(0, 100)}`);
          const imgResp = await fetch(imageUrlToUpload);
          if (!imgResp.ok) {
            console.warn(`Image fetch failed: ${imgResp.status}`);
          } else {
            const imgBuffer = await imgResp.arrayBuffer();
            const mimeType = imgResp.headers.get("content-type") || "image/png";
            const b64 = arrayBufferToBase64(imgBuffer);
            console.log(`Image downloaded: ${imgBuffer.byteLength} bytes, mime: ${mimeType}, base64 length: ${b64.length}`);
            // Use bytesBase64Encoded format (Vertex AI style, required by predictLongRunning)
            instance.image = { bytesBase64Encoded: b64, mimeType };
            console.log(`Image attached via bytesBase64Encoded, mime: ${mimeType}`);
          }
        } catch (e) {
          console.error("Failed to download/encode image:", e);
        }
      }

      console.log(`Instance has image: ${!!instance.image}`);

      const parameters: Record<string, any> = {
        aspectRatio: config.aspect_ratio || "9:16",
        durationSeconds: config.duration || 4,
        resolution: config.resolution || "720p",
      };
      // Audio is generated by default in Veo 3.1; if disabled, add parameter
      if (config.generate_audio === false) {
        parameters.includeAudio = false;
      }

      console.log(`Generating video with model ${videoModel}, prompt: ${prompt.substring(0, 200)}, params:`, JSON.stringify(parameters));

      // Step 1: Submit long-running operation
      const submitResp = await fetch(`${BASE_URL}/models/${videoModel}:predictLongRunning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GOOGLE_AI_API_KEY,
        },
        body: JSON.stringify({
          instances: [instance],
          parameters,
        }),
      });

      if (!submitResp.ok) {
        const errText = await submitResp.text();
        throw new Error(`Gemini Video API error ${submitResp.status}: ${errText}`);
      }

      const submitData = await submitResp.json();
      const operationName = submitData.name;
      if (!operationName) {
        throw new Error("No operation name returned: " + JSON.stringify(submitData).substring(0, 500));
      }

      console.log(`Video operation started: ${operationName}`);

      // Step 2: Poll for completion (max 5 minutes)
      const POLL_INTERVAL = 10_000; // 10 seconds
      const MAX_POLL_TIME = 5 * 60_000; // 5 minutes
      const startTime = Date.now();
      let operationResult: any = null;

      while (Date.now() - startTime < MAX_POLL_TIME) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));

        const pollResp = await fetch(`${BASE_URL}/${operationName}`, {
          headers: { "x-goog-api-key": GOOGLE_AI_API_KEY },
        });

        if (!pollResp.ok) {
          const errText = await pollResp.text();
          console.warn(`Poll error ${pollResp.status}: ${errText}`);
          continue;
        }

        const pollData = await pollResp.json();
        console.log(`Poll status: done=${pollData.done}`);

        if (pollData.done) {
          if (pollData.error) {
            throw new Error(`Video generation failed: ${pollData.error.message || JSON.stringify(pollData.error)}`);
          }
          operationResult = pollData;
          break;
        }
      }

      if (!operationResult) {
        throw new Error("Генерация видео превысила таймаут (5 минут). Попробуйте ещё раз.");
      }

      // Step 3: Extract video from result
      const samples = operationResult.response?.generateVideoResponse?.generatedSamples;
      const videoUri = samples?.[0]?.video?.uri;

      if (!videoUri) {
        throw new Error("No video URI in response: " + JSON.stringify(operationResult).substring(0, 500));
      }

      // Step 4: Download the video and upload to Supabase Storage
      const videoDownloadResp = await fetch(videoUri, {
        headers: { "x-goog-api-key": GOOGLE_AI_API_KEY },
        redirect: "follow",
      });

      if (!videoDownloadResp.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResp.status}`);
      }

      const videoBytes = new Uint8Array(await videoDownloadResp.arrayBuffer());
      const filePath = `video-content/${stage.video_project_id}/${stage_id}/${Date.now()}.mp4`;

      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(filePath, videoBytes, { contentType: "video/mp4", upsert: true });
      if (uploadErr) throw new Error(`Upload error: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(filePath);
      resultUrl = urlData.publicUrl;

      resultMetadata = {
        model: videoModel,
        operation_name: operationName,
        aspect_ratio: config.aspect_ratio,
        duration: config.duration,
        resolution: config.resolution,
        generate_audio: config.generate_audio,
        generated_at: new Date().toISOString(),
      };

    } else {
      throw new Error(`Unsupported stage_type: ${stageType}`);
    }

    // Update stage with result
    await supabase
      .from("video_stages")
      .update({
        status: "completed",
        result_url: resultUrl!,
        result_metadata: resultMetadata,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stage_id);

    const responseData = { success: true, result_url: resultUrl!, stage_id };
    if (taskId) await completeTask(taskId, responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-video-content error:", e);

    // Try to mark stage as error
    if (stageId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, serviceKey);
        await sb
          .from("video_stages")
          .update({
            status: "error",
            error_message: e instanceof Error ? e.message : "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", stageId);
      } catch (_) { /* best effort */ }
    }

    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as decodeBase64, encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import UPNG from "https://esm.sh/upng-js@2.1.0";
import jpegJs from "https://esm.sh/jpeg-js@0.4.4";
import { optimizeImage } from "../_shared/optimizeImage.ts";

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

/**
 * Decode image bytes to RGBA pixel data.
 * Supports PNG (via UPNG) and JPEG (via jpeg-js).
 * Returns { rgba: Uint8Array, width: number, height: number }
 */
function decodeImageToRGBA(imageBytes: Uint8Array, format: string): { rgba: Uint8Array; width: number; height: number } {
  if (format === "png") {
    const cleanBuf = new ArrayBuffer(imageBytes.length);
    new Uint8Array(cleanBuf).set(imageBytes);
    const decoded = UPNG.decode(cleanBuf);
    const rgbaFrames = UPNG.toRGBA8(decoded);
    return {
      rgba: new Uint8Array(rgbaFrames[0]),
      width: decoded.width,
      height: decoded.height,
    };
  } else {
    // JPEG
    const cleanBuf = new ArrayBuffer(imageBytes.length);
    new Uint8Array(cleanBuf).set(imageBytes);
    const decoded = jpegJs.decode(new Uint8Array(cleanBuf), { useTArray: true, formatAsRGBA: true });
    return {
      rgba: decoded.data,
      width: decoded.width,
      height: decoded.height,
    };
  }
}

/**
 * Remove green chromakey background from RGBA pixel data.
 * Uses HSV-based detection with aggressive settings and smooth edge blending.
 */
function removeGreenScreen(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(rgba.length);
  out.set(rgba);

  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    const r = rgba[off];
    const g = rgba[off + 1];
    const b = rgba[off + 2];

    // Convert RGB to HSV
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    if (delta > 0) {
      if (max === gn) h = 60 * (((bn - rn) / delta) + 2);
      else if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
      else h = 60 * (((rn - gn) / delta) + 4);
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : delta / max;
    const v = max;

    // --- Method 1: HSV green detection (wider range) ---
    const isGreenHue = h >= 60 && h <= 180;
    const hasSaturation = s > 0.15;
    const hasBrightness = v > 0.10;

    // --- Method 2: Simple RGB green dominance ---
    const greenDominance = g - Math.max(r, b);
    const isRGBGreen = greenDominance > 30 && g > 80;

    if ((isGreenHue && hasSaturation && hasBrightness) || isRGBGreen) {
      // Calculate how "green" this pixel is (0=not green, 1=pure green)
      let greenness: number;

      if (isRGBGreen) {
        // RGB-based greenness: how much green dominates
        greenness = Math.min(1, greenDominance / 120) * Math.min(1, g / 200);
      } else {
        // HSV-based greenness
        const hueDist = Math.abs(h - 120) / 60; // 0 at h=120, 1 at h=60 or h=180
        greenness = Math.max(0, 1 - hueDist) * Math.min(1, s / 0.3);
      }

      // Take the max of both methods
      if (isRGBGreen && isGreenHue && hasSaturation) {
        const hsvGreenness = Math.max(0, 1 - Math.abs(h - 120) / 60) * Math.min(1, s / 0.3);
        const rgbGreenness = Math.min(1, greenDominance / 120) * Math.min(1, g / 200);
        greenness = Math.max(hsvGreenness, rgbGreenness);
      }

      // Aggressive alpha: more green = more transparent
      // Use pow to make the transition sharper
      const aggressiveGreenness = Math.min(1, greenness * 1.5);
      const alpha = Math.round((1 - aggressiveGreenness) * 255);
      out[off + 3] = Math.min(out[off + 3], alpha);

      // For edge pixels, neutralize the green color spill
      if (alpha > 0 && alpha < 240) {
        const avg = (r + b) / 2;
        const spillFactor = Math.min(1, aggressiveGreenness * 0.85);
        out[off + 1] = Math.round(g * (1 - spillFactor) + avg * spillFactor);
      }
    }
  }

  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;

    const {
      landing_id,
      block_id,
      image_path,
      prompt,
      source_image_url,
      width,
      height,
      remove_bg,
    } = body;

    if (!landing_id || !block_id || !image_path || !prompt) {
      throw new Error("landing_id, block_id, image_path, and prompt are required");
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Build prompt with dimensions hint
    const sizeHint = width && height ? `\nImage dimensions: ${width}x${height} pixels. Generate the image at exactly these dimensions.` : "";
    const finalPrompt = `${prompt}${sizeHint}`;

    let messages: any[];

    if (source_image_url) {
      console.log(`[generate-landing-image] Edit mode: ${image_path}, remove_bg: ${!!remove_bg}`);
      messages = [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: source_image_url } },
            { type: "text", text: finalPrompt },
          ],
        },
      ];
    } else {
      console.log(`[generate-landing-image] Generate mode: ${image_path}, remove_bg: ${!!remove_bg}`);
      messages = [
        { role: "user", content: finalPrompt },
      ];
    }

    console.log(`[generate-landing-image] Prompt (first 200 chars): ${prompt.substring(0, 200)}`);

    // Call OpenRouter
    const imageResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error("OpenRouter API error:", imageResponse.status, errText);
      throw new Error(`OpenRouter API error: ${imageResponse.status} - ${errText.substring(0, 300)}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      const textContent = imageData.choices?.[0]?.message?.content || "";
      console.error("No image in response:", JSON.stringify(imageData).substring(0, 500));
      throw new Error("AI \u043d\u0435 \u0432\u0435\u0440\u043d\u0443\u043b \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u0440\u043e\u043c\u043f\u0442. " + (textContent ? `\u041e\u0442\u0432\u0435\u0442: ${textContent.substring(0, 200)}` : ""));
    }

    // Detect image format from data URL
    let imageFormat = "png";
    const formatMatch = imageUrl.match(/^data:image\/(\w+);base64,/);
    if (formatMatch) {
      const fmt = formatMatch[1].toLowerCase();
      if (fmt === "jpeg" || fmt === "jpg") imageFormat = "jpeg";
      else if (fmt === "png") imageFormat = "png";
      else if (fmt === "webp") imageFormat = "webp";
    }
    console.log(`[generate-landing-image] Image format detected: ${imageFormat}`);

    // Decode base64 image
    const b64Image = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    let imageBytes = decodeBase64(b64Image);
    console.log(`[generate-landing-image] Decoded image bytes: ${imageBytes.length}`);

    // If remove_bg is enabled, perform chromakey green screen removal
    if (remove_bg) {
      console.log(`[generate-landing-image] Starting chromakey removal...`);

      if (imageFormat === "webp") {
        console.log(`[generate-landing-image] WebP format not supported for chromakey, skipping`);
      } else {
        try {
          // Decode image to RGBA pixels
          console.log(`[generate-landing-image] Decoding ${imageFormat} to RGBA...`);
          const { rgba, width: imgW, height: imgH } = decodeImageToRGBA(imageBytes, imageFormat);
          console.log(`[generate-landing-image] Decoded: ${imgW}x${imgH}, RGBA bytes: ${rgba.length}`);

          // Analyze green content before removal
          let greenPixelsBefore = 0;
          for (let i = 0; i < imgW * imgH; i++) {
            const off = i * 4;
            const r = rgba[off], g = rgba[off + 1], b = rgba[off + 2];
            if (g > Math.max(r, b) + 30 && g > 80) greenPixelsBefore++;
          }
          console.log(`[generate-landing-image] Green pixels before removal: ${greenPixelsBefore} / ${imgW * imgH} (${Math.round(greenPixelsBefore / (imgW * imgH) * 100)}%)`);

          // Remove green background
          console.log(`[generate-landing-image] Running green screen removal...`);
          const processedRgba = removeGreenScreen(rgba, imgW, imgH);

          // Count transparent pixels for verification
          let transparentCount = 0;
          let semiTransparentCount = 0;
          for (let i = 3; i < processedRgba.length; i += 4) {
            if (processedRgba[i] === 0) transparentCount++;
            else if (processedRgba[i] < 200) semiTransparentCount++;
          }
          console.log(`[generate-landing-image] After removal: transparent=${transparentCount}, semi-transparent=${semiTransparentCount}, total=${imgW * imgH}`);
          console.log(`[generate-landing-image] Transparency: ${Math.round((transparentCount + semiTransparentCount) / (imgW * imgH) * 100)}%`);

          // Re-encode as PNG with alpha channel
          const processedBuf = new ArrayBuffer(processedRgba.length);
          new Uint8Array(processedBuf).set(processedRgba);

          console.log(`[generate-landing-image] Encoding to PNG...`);
          const pngArrayBuffer = UPNG.encode([processedBuf], imgW, imgH, 0);
          imageBytes = new Uint8Array(pngArrayBuffer);

          console.log(`[generate-landing-image] Chromakey done! Output PNG: ${imageBytes.length} bytes`);
        } catch (chromaErr: any) {
          console.error(`[generate-landing-image] Chromakey FAILED: ${chromaErr?.message || chromaErr}`);
          console.error(`[generate-landing-image] Stack: ${chromaErr?.stack || "no stack"}`);
          console.log("[generate-landing-image] Falling back to original image (no bg removal)");
        }
      }
    } else {
      console.log(`[generate-landing-image] remove_bg is falsy: ${JSON.stringify(remove_bg)}, type: ${typeof remove_bg}`);
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const safeName = image_path.replace(/[^a-zA-Z0-9]/g, "_").slice(-40);

    // Optimize: for landing images we want JPEG compression (much smaller),
    // but if remove_bg was requested we must preserve the alpha channel → keep PNG.
    let uploadBytes = imageBytes;
    let uploadContentType = "image/png";
    let uploadExt = "png";
    if (!remove_bg) {
      const opt = await optimizeImage(imageBytes);
      uploadBytes = opt.bytes;
      uploadContentType = opt.contentType;
      uploadExt = opt.ext;
    }
    const filePath = `${landing_id}/${block_id}/ai_${safeName}_${timestamp}.${uploadExt}`;

    const { error: uploadError } = await supabase.storage
      .from("landing-assets")
      .upload(filePath, uploadBytes, { contentType: uploadContentType, upsert: false });
    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Update block's _image_overrides
    const { data: block, error: blockErr } = await supabase
      .from("landing_blocks")
      .select("content_overrides")
      .eq("id", block_id)
      .single();
    if (blockErr) throw new Error(`Block not found: ${blockErr.message}`);

    const currentOverrides = block.content_overrides || {};
    const newImageOverrides = { ...(currentOverrides._image_overrides || {}), [image_path]: publicUrl };
    const newOverrides = { ...currentOverrides, _image_overrides: newImageOverrides };

    const { error: updateErr } = await supabase
      .from("landing_blocks")
      .update({ content_overrides: newOverrides })
      .eq("id", block_id);
    if (updateErr) throw new Error(`Block update error: ${updateErr.message}`);

    console.log(`[generate-landing-image] Success: ${publicUrl}`);

    const responseData = {
      success: true,
      image_url: publicUrl,
      image_path,
      block_id,
    };

    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing-image error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

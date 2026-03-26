import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BANNER_SIZES: Record<string, { width: number; height: number }> = {
  header_banner: { width: 600, height: 200 },
  case_card: { width: 600, height: 240 },
  program_banner: { width: 600, height: 220 },
  custom: { width: 1024, height: 1024 },
};

const PREAMBLE = `STRICTLY FORBIDDEN in the image:
— Any watermarks, logos, domain names (no 'talentsy.ru', no URLs)
— Any buttons, UI elements, CTAs
— Any text overlays, labels, captions on the scene
— Any interface components, navigation elements`;

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
    const { prompt, banner_type, color_scheme_id, title, category, program_id, offer_type, note, created_by, generation_prompt, reference_image, existing_banner_id } = body;
    if (!prompt || !banner_type) throw new Error("prompt and banner_type are required");

    const isCustom = banner_type === "custom";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let fullPrompt: string;

    if (isCustom) {
      // Custom: pass prompt as-is, no preamble or style
      fullPrompt = prompt;
    } else {
      // Standard: load image_style and optionally inject color scheme
      const { data: globalVars } = await supabase.from("prompt_global_variables").select("key, value").eq("key", "image_style");
      let imageStyle = "";
      if (globalVars?.[0]?.value) imageStyle = globalVars[0].value;

      if (color_scheme_id) {
        const { data: scheme } = await supabase.from("color_schemes").select("description, preview_colors").eq("id", color_scheme_id).single();
        if (scheme?.description) {
          imageStyle = imageStyle.replace(
            /\[COLOR PALETTE\]:.*$/ms,
            `[COLOR PALETTE]: ${scheme.description}. Key accent colors: ${(scheme.preview_colors || []).join(", ")}.`
          );
        }
      }

      fullPrompt = `${PREAMBLE}\n\n${imageStyle}\n\n${prompt}`;
    }

    const size = BANNER_SIZES[banner_type] || { width: 1024, height: 1024 };
    console.log(`Generating banner (${banner_type}, ${size.width}x${size.height}):`, fullPrompt.substring(0, 300));

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    // Try generating with primary prompt
    let imageUrl = await tryGenerate(OPENROUTER_API_KEY, fullPrompt, reference_image || null);

    // Retry with simplified prompt if failed (only for non-custom)
    if (!imageUrl && !isCustom) {
      console.log("Primary generation failed, retrying with simplified prompt");
      const fallbackPrompt = `${PREAMBLE}\n\nAbstract decorative banner, ${size.width}x${size.height}px proportions. Soft warm colors, geometric patterns, minimal design. No text, no people.`;
      imageUrl = await tryGenerate(OPENROUTER_API_KEY, fallbackPrompt, null);
    }

    if (!imageUrl) throw new Error("Image generation failed after retry");

    // Upload to storage
    const b64Image = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const filePath = `banners/${banner_type}/${Date.now()}.png`;
    const imageBytes = decode(b64Image);

    const { error: uploadError } = await supabase.storage.from("generated-images").upload(filePath, imageBytes, { contentType: "image/png", upsert: false });
    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Auto-save banner to banners table if metadata provided
    if (created_by && title) {
      const freshSb = createClient(supabaseUrl, supabaseServiceKey);
      const { error: insertError } = await freshSb.from("banners").insert({
        title,
        banner_type,
        category: category || "paid_program",
        program_id: program_id || null,
        offer_type: offer_type || null,
        color_scheme_id: isCustom ? null : (color_scheme_id || null),
        image_url: publicUrl,
        source: "generated",
        generation_prompt: generation_prompt || prompt,
        note: note || "",
        created_by,
      });
      if (insertError) {
        console.error("Failed to insert banner row:", insertError.message);
      } else {
        console.log("Banner row inserted successfully");
      }
    }

    const responseData = { success: true, image_url: publicUrl };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-banner-image error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function tryGenerate(apiKey: string, prompt: string, referenceImage: string | null): Promise<string | null> {
  try {
    // Build messages: multimodal if reference image provided
    let messages: any[];
    if (referenceImage) {
      messages = [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: referenceImage } },
          { type: "text", text: prompt },
        ],
      }];
    } else {
      messages = [{ role: "user", content: prompt }];
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Image API error:", response.status, errText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch (e) {
    console.error("tryGenerate error:", e);
    return null;
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenRouter error:", response.status, errText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  let imageUrl = "";

  // OpenRouter returns images in message.images array
  if (Array.isArray(message?.images)) {
    for (const img of message.images) {
      if (img.image_url?.url) {
        imageUrl = img.image_url.url;
        break;
      }
    }
  }

  // Fallback: check content array
  if (!imageUrl && Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        imageUrl = part.image_url.url;
        break;
      }
    }
  }

  if (!imageUrl) {
    console.error("No image in response:", JSON.stringify(data).substring(0, 500));
    throw new Error("Изображение не было сгенерировано");
  }

  const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, content_type, sub_type, mode } = await req.json();
    if (!project_id || !content_type || !sub_type || !mode) {
      throw new Error("project_id, content_type, sub_type, and mode are required");
    }
    if (!["carousel", "static", "banner"].includes(mode)) {
      throw new Error("mode must be 'carousel', 'static', or 'banner'");
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read saved pipeline JSON
    const { data: piece, error: pieceErr } = await supabase
      .from("content_pieces")
      .select("content")
      .eq("project_id", project_id)
      .eq("category", `pipeline_json_${sub_type}`)
      .single();
    if (pieceErr || !piece) throw new Error("Сначала сгенерируйте контент (Шаг 1)");

    const pipelineJson = JSON.parse(piece.content);
    const results: { category: string; url: string }[] = [];

    if (mode === "carousel") {
      const prompts = pipelineJson.carousel_prompts;
      if (!Array.isArray(prompts) || prompts.length === 0) {
        throw new Error("В JSON нет carousel_prompts");
      }

      for (const slide of prompts) {
        const imageData = await generateImage(slide.prompt, OPENROUTER_API_KEY);
        const fileName = `${project_id}/${content_type}_${sub_type}_carousel_${slide.slide_number}_${Date.now()}.png`;

        const { error: uploadErr } = await supabase.storage
          .from("generated-images")
          .upload(fileName, imageData, { contentType: "image/png", upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from("generated-images")
          .getPublicUrl(fileName);

        const category = `carousel_${sub_type}_${slide.slide_number}`;

        await supabase.from("content_pieces").delete()
          .eq("project_id", project_id)
          .eq("category", category);
        await supabase.from("content_pieces").insert({
          project_id,
          category,
          content: publicUrlData.publicUrl,
        });

        results.push({ category, url: publicUrlData.publicUrl });
      }
    } else if (mode === "static") {
      const prompt = pipelineJson.static_image_prompt;
      if (!prompt) throw new Error("В JSON нет static_image_prompt");

      const imageData = await generateImage(prompt, OPENROUTER_API_KEY);
      const fileName = `${project_id}/${content_type}_${sub_type}_static_${Date.now()}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(fileName, imageData, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from("generated-images")
        .getPublicUrl(fileName);

      const category = `static_image_${sub_type}`;

      await supabase.from("content_pieces").delete()
        .eq("project_id", project_id)
        .eq("category", category);
      await supabase.from("content_pieces").insert({
        project_id,
        category,
        content: publicUrlData.publicUrl,
      });

      results.push({ category, url: publicUrlData.publicUrl });
    } else if (mode === "banner") {
      const prompt = pipelineJson.banner_prompt;
      if (!prompt) throw new Error("В JSON нет banner_prompt");

      const imageData = await generateImage(prompt, OPENROUTER_API_KEY);
      const fileName = `${project_id}/${content_type}_${sub_type}_banner_${Date.now()}.png`;

      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(fileName, imageData, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from("generated-images")
        .getPublicUrl(fileName);

      const category = `banner_${sub_type}`;

      await supabase.from("content_pieces").delete()
        .eq("project_id", project_id)
        .eq("category", category);
      await supabase.from("content_pieces").insert({
        project_id,
        category,
        content: publicUrlData.publicUrl,
      });

      results.push({ category, url: publicUrlData.publicUrl });
    }

    // Record generation run
    await supabase.from("generation_runs").insert({
      project_id,
      type: mode === "banner" ? "image_email" : mode === "carousel" ? "image_carousel" : "image_post",
      status: "completed",
      input_data: { content_type, sub_type, mode },
      output_data: { results },
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pipeline-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

async function generateImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "google/gemini-3-pro-image-preview", modalities: ["image", "text"], messages: [{ role: "user", content: prompt }] }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI Gateway error:", response.status, errText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  let imageUrl = "";

  if (Array.isArray(message?.images)) {
    for (const img of message.images) {
      if (img.image_url?.url) { imageUrl = img.image_url.url; break; }
    }
  }

  if (!imageUrl && Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) { imageUrl = part.image_url.url; break; }
    }
  }

  if (!imageUrl) {
    console.error("No image in response. Keys:", JSON.stringify(Object.keys(message || {})));
    throw new Error("Изображение не было сгенерировано");
  }

  const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    const { project_id, content_type, mode, slide_number } = body;
    if (!project_id || !content_type || !mode) throw new Error("project_id, content_type, and mode are required");
    if (!["carousel", "static", "banner"].includes(mode)) throw new Error("mode must be 'carousel', 'static', or 'banner'");

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: piece, error: pieceErr } = await supabase.from("content_pieces").select("content").eq("project_id", project_id).eq("category", `pipeline_json_${content_type}`).single();
    if (pieceErr || !piece) throw new Error("Сначала сгенерируйте контент (Шаг 1)");

    const pipelineJson = JSON.parse(piece.content);
    const results: { category: string; url: string }[] = [];

    if (mode === "carousel") {
      const prompts = pipelineJson.carousel_prompts;
      if (!Array.isArray(prompts) || prompts.length === 0) throw new Error("В JSON нет carousel_prompts");
      const slidesToGenerate = typeof slide_number === "number" ? prompts.filter((s: any) => s.slide_number === slide_number) : prompts;
      if (slidesToGenerate.length === 0) throw new Error(`Слайд ${slide_number} не найден в carousel_prompts`);

      for (const slide of slidesToGenerate) {
        // Skip slides marked as video placeholder (e.g. Instagram transformation_story / testimonial_content pre-last slide)
        const rawPrompt = typeof slide.prompt === "string" ? slide.prompt.trim() : "";
        if (rawPrompt === "VIDEO_PLACEHOLDER" || rawPrompt === "" || /^video_?placeholder$/i.test(rawPrompt)) {
          console.log(`[generate-pipeline-images] Skipping slide ${slide.slide_number}: video placeholder`);
          continue;
        }
        const imageData = await generateImage(slide.prompt, OPENROUTER_API_KEY);
        const fileName = `${project_id}/${content_type}_carousel_${slide.slide_number}_${Date.now()}.png`;
        const { error: uploadErr } = await supabase.storage.from("generated-images").upload(fileName, imageData, { contentType: "image/png", upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: publicUrlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
        const category = `carousel_${content_type}_${slide.slide_number}`;
        await supabase.from("content_pieces").delete().eq("project_id", project_id).eq("category", category);
        await supabase.from("content_pieces").insert({ project_id, category, content: publicUrlData.publicUrl });
        results.push({ category, url: publicUrlData.publicUrl });
      }
    } else if (mode === "static") {
      const prompt = pipelineJson.static_image_prompt;
      if (!prompt) throw new Error("В JSON нет static_image_prompt");
      const imageData = await generateImage(prompt, OPENROUTER_API_KEY);
      const fileName = `${project_id}/${content_type}_static_${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage.from("generated-images").upload(fileName, imageData, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: publicUrlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      const category = `static_image_${content_type}`;
      await supabase.from("content_pieces").delete().eq("project_id", project_id).eq("category", category);
      await supabase.from("content_pieces").insert({ project_id, category, content: publicUrlData.publicUrl });
      results.push({ category, url: publicUrlData.publicUrl });
    } else if (mode === "banner") {
      const prompt = pipelineJson.banner_prompt || pipelineJson.banner_image_prompt;
      if (!prompt) throw new Error("В JSON нет banner_prompt / banner_image_prompt");
      const imageData = await generateImage(prompt, OPENROUTER_API_KEY);
      const fileName = `${project_id}/${content_type}_banner_${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage.from("generated-images").upload(fileName, imageData, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: publicUrlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      const category = `banner_${content_type}`;
      await supabase.from("content_pieces").delete().eq("project_id", project_id).eq("category", category);
      await supabase.from("content_pieces").insert({ project_id, category, content: publicUrlData.publicUrl });
      results.push({ category, url: publicUrlData.publicUrl });
    }

    await supabase.from("generation_runs").insert({
      project_id,
      type: mode === "banner" ? "image_email" : mode === "carousel" ? "image_carousel" : "image_post",
      status: "completed",
      input_data: { content_type, mode },
      output_data: { results },
      completed_at: new Date().toISOString(),
    });

    const responseData = { success: true, results };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pipeline-images error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

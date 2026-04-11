import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const doFetch = async () => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-pro-image-preview", modalities: ["image", "text"], messages: [{ role: "user", content: prompt }] }),
    });
    if (response.status === 402) { await response.text(); throw new Error("CREDITS_EXHAUSTED"); }
    if (response.status === 429) { await response.text(); throw new Error("RATE_LIMITED"); }
    if (!response.ok) { const errText = await response.text(); throw new Error(`Image generation failed: ${response.status}`); }
    return response;
  };

  let response: Response;
  try { response = await doFetch(); } catch (e: any) {
    if (e.message === "RATE_LIMITED") { await new Promise(r => setTimeout(r, 5000)); response = await doFetch(); } else throw e;
  }

  const data = await response.json();
  const images = data.choices?.[0]?.message?.images;
  if (images && images.length > 0) {
    const img = images[0];
    const urlStr = typeof img === "string" ? img : img?.image_url?.url || img?.image_url || img?.url;
    if (typeof urlStr === "string") {
      const b64Match = urlStr.match(/^data:image\/[^;]+;base64,(.+)/);
      if (b64Match) return decode(b64Match[1]);
      if (!urlStr.startsWith("http")) return decode(urlStr);
    }
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") { const b64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/); if (b64Match) return decode(b64Match[1]); }
  if (Array.isArray(content)) { for (const part of content) { if (part?.inline_data?.data) return decode(part.inline_data.data); } }
  throw new Error("No image in response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    const { diagnostic_id, image_index, placeholders } = body;

    console.log(`[process-image] diagnostic=${diagnostic_id}, index=${image_index}/${placeholders.length}`);

    const { data: diag } = await supabase.from("diagnostics").select("status, quiz_json, generation_progress").eq("id", diagnostic_id).single();
    if (diag?.status === "error") {
      if (taskId) await completeTask(taskId, { success: false, cancelled: true });
      return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const prompt = placeholders[image_index];
    const progress = (diag?.generation_progress as any) || {};
    let completedImages = progress.completed_images || 0;
    let failedImages = progress.failed_images || 0;

    let imageUrl: string | null = null;
    let creditsExhausted = false;
    try {
      const imageBytes = await generateImage(prompt, OPENROUTER_API_KEY);
      const fileName = `${diagnostic_id}/image_${image_index}_${Date.now()}.webp`;
      const { error: uploadErr } = await supabase.storage.from("quiz-images").upload(fileName, imageBytes, { contentType: "image/webp", upsert: true });
      if (uploadErr) { console.error(`[process-image] Upload error:`, uploadErr); failedImages++; }
      else { const { data: urlData } = supabase.storage.from("quiz-images").getPublicUrl(fileName); imageUrl = urlData.publicUrl; completedImages++; }
    } catch (imgErr: any) {
      console.error(`[process-image] Generation failed:`, imgErr);
      if (imgErr.message === "CREDITS_EXHAUSTED") creditsExhausted = true;
      failedImages++;
    }

    if (creditsExhausted) {
      await supabase.from("diagnostics").update({ status: "error", generation_progress: { total_images: placeholders.length, completed_images: completedImages, failed_images: failedImages, error: "Недостаточно кредитов OpenRouter." } }).eq("id", diagnostic_id);
      if (taskId) await failTask(taskId, "Недостаточно кредитов OpenRouter");
      return new Response(JSON.stringify({ success: false, credits_exhausted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let quizJson = diag?.quiz_json;
    if (imageUrl && quizJson) {
      const placeholder = `{{IMAGE:PROMPT=${prompt}}}`;
      let quizString = JSON.stringify(quizJson);
      quizString = quizString.split(placeholder).join(imageUrl);
      try { quizJson = JSON.parse(quizString); } catch {}
    }

    const isLast = image_index >= placeholders.length - 1;
    let newStatus = "generating_images";
    if (isLast) {
      const { data: freshDiag } = await supabase.from("diagnostics").select("card_prompt").eq("id", diagnostic_id).single();
      newStatus = freshDiag?.card_prompt ? "ready" : "images_done";
    }

    await supabase.from("diagnostics").update({ quiz_json: quizJson, status: newStatus, generation_progress: { total_images: placeholders.length, completed_images: completedImages, failed_images: failedImages } }).eq("id", diagnostic_id);

    if (!isLast) {
      fetch(`${SUPABASE_URL}/functions/v1/process-diagnostic-image`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify({ diagnostic_id, image_index: image_index + 1, placeholders }) }).catch((e) => console.error("[process-image] Chain call failed:", e));
    }

    const responseData = { success: true };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[process-image] Error:", error);
    if (taskId) await failTask(taskId, error.message).catch(() => {});
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

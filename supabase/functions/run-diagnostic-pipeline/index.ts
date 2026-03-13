import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generateImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();

  const images = data.choices?.[0]?.message?.images;
  if (images && images.length > 0) {
    const img = images[0];
    const urlStr = typeof img === "string" ? img
      : img?.image_url?.url || img?.image_url || img?.url;

    if (typeof urlStr === "string") {
      const b64Match = urlStr.match(/^data:image\/[^;]+;base64,(.+)/);
      if (b64Match) return decode(b64Match[1]);
      if (!urlStr.startsWith("http")) return decode(urlStr);
    }
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    const b64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (b64Match) return decode(b64Match[1]);
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      if (part?.inline_data?.data) {
        return decode(part.inline_data.data);
      }
    }
  }

  throw new Error("No image in response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { diagnostic_id, program_id, name, description, audience_tags, prompt_id } =
      await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    // ---- Step 1: Generate quiz JSON via Claude ----
    const { data: prompt, error: promptErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", prompt_id)
      .single();

    if (promptErr || !prompt) {
      throw new Error("Prompt not found: " + (promptErr?.message || "missing"));
    }

    const { data: program } = await supabase
      .from("paid_programs")
      .select("title, description, audience_description, program_doc_url")
      .eq("id", program_id)
      .single();

    // Fetch program description from Google Doc if available
    let programDocDescription = "";
    if (program?.program_doc_url) {
      try {
        const docMatch = program.program_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            programDocDescription = await docResponse.text();
          }
        }
      } catch (e) { console.error("Error fetching program doc:", e); }
    }

    let userPrompt = (prompt.user_prompt_template || "")
      .replace(/\{\{program_title\}\}/g, program?.title || "")
      .replace(/\{\{program_description\}\}/g, program?.description || "")
      .replace(/\{\{audience_description\}\}/g, program?.audience_description || "")
      .replace(/\{\{test_name\}\}/g, name || "")
      .replace(/\{\{test_description\}\}/g, description || "")
      .replace(/\{\{audience_tags\}\}/g, (audience_tags || []).join(", "))
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription);

    if (prompt.output_format_hint) {
      userPrompt += "\n\n" + prompt.output_format_hint;
    }

    if (!userPrompt.trim()) {
      throw new Error("Шаблон пользовательского промпта пуст.");
    }

    console.log(`[pipeline] Step 1: Calling Claude for diagnostic ${diagnostic_id}`);

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: prompt.system_prompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawContent = claudeData.content?.[0]?.text || "";

    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let fullResponse: any;
    try {
      fullResponse = JSON.parse(jsonStr);
    } catch {
      await supabase
        .from("diagnostics")
        .update({ status: "error", generation_progress: { error: "Invalid JSON from Claude" } })
        .eq("id", diagnostic_id);
      throw new Error("Claude returned invalid JSON");
    }

    // Extract 3 blocks from Claude response
    const quizPart = fullResponse.quiz || fullResponse;
    const thankYouPart = fullResponse.thankYouPage || null;
    const cardPromptPart = fullResponse.diagnosticCardPrompt || null;

    // Extract image placeholders only from quiz part
    const quizString = JSON.stringify(quizPart);
    const placeholderRegex = /\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(quizString)) !== null) {
      placeholders.push(match[1]);
    }

    // Update status to quiz_generated
    await supabase
      .from("diagnostics")
      .update({
        quiz_json: quizPart,
        thank_you_json: thankYouPart,
        card_prompt: typeof cardPromptPart === "string" ? cardPromptPart : cardPromptPart ? JSON.stringify(cardPromptPart) : null,
        status: "quiz_generated",
        generation_progress: { total_images: placeholders.length, completed_images: 0 },
      })
      .eq("id", diagnostic_id);

    console.log(`[pipeline] Step 1 done. ${placeholders.length} image placeholders found.`);

    if (placeholders.length === 0) {
      await supabase
        .from("diagnostics")
        .update({ status: "ready", generation_progress: { total_images: 0, completed_images: 0 } })
        .eq("id", diagnostic_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Step 2: Generate images (only in quiz part) ----
    await supabase
      .from("diagnostics")
      .update({ status: "generating_images" })
      .eq("id", diagnostic_id);

    let currentQuizJson = quizString;
    let completedImages = 0;
    let failedImages = 0;

    for (let i = 0; i < placeholders.length; i++) {
      console.log(`[pipeline] Generating image ${i + 1}/${placeholders.length}`);

      try {
        const imageBytes = await generateImage(placeholders[i], OPENROUTER_API_KEY);
        const fileName = `${diagnostic_id}/image_${i}_${Date.now()}.webp`;

        const { error: uploadErr } = await supabase.storage
          .from("quiz-images")
          .upload(fileName, imageBytes, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          failedImages++;
        } else {
          const { data: urlData } = supabase.storage
            .from("quiz-images")
            .getPublicUrl(fileName);

          const placeholder = `{{IMAGE:PROMPT=${placeholders[i]}}}`;
          currentQuizJson = currentQuizJson.split(placeholder).join(urlData.publicUrl);
          completedImages++;
        }
      } catch (imgErr) {
        console.error(`Image ${i} failed:`, imgErr);
        failedImages++;
      }

      // Update progress after each image
      const updatedQuizJson = JSON.parse(
        currentQuizJson.replace(/\{\{IMAGE:PROMPT=[^}]*\}\}/g, "null")
      );

      await supabase
        .from("diagnostics")
        .update({
          quiz_json: updatedQuizJson,
          generation_progress: {
            total_images: placeholders.length,
            completed_images: completedImages + failedImages,
            failed_images: failedImages,
          },
        })
        .eq("id", diagnostic_id);
    }

    // ---- Step 3: Finalize ----
    currentQuizJson = currentQuizJson.replace(/\{\{IMAGE:PROMPT=[^}]*\}\}/g, "null");
    const finalQuizJson = JSON.parse(currentQuizJson);

    await supabase
      .from("diagnostics")
      .update({
        quiz_json: finalQuizJson,
        status: "ready",
        generation_progress: {
          total_images: placeholders.length,
          completed_images: completedImages,
          failed_images: failedImages,
        },
      })
      .eq("id", diagnostic_id);

    console.log(`[pipeline] Done. ${completedImages} images ok, ${failedImages} failed.`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("run-diagnostic-pipeline error:", error);

    try {
      const { diagnostic_id } = await req.clone().json().catch(() => ({}));
      if (diagnostic_id) {
        await supabase
          .from("diagnostics")
          .update({ status: "error", generation_progress: { error: error.message } })
          .eq("id", diagnostic_id);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

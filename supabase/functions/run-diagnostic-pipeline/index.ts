import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function extractJsonFromResponse(content: string): unknown {
  let cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try { return JSON.parse(cleaned); } catch {}

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error("No JSON object found in response");

  cleaned = cleaned.substring(jsonStart);
  try { return JSON.parse(cleaned); } catch {}

  let fixed = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : "");
  try { return JSON.parse(fixed); } catch {}

  fixed = fixed.replace(/,\s*"[^"]*":\s*"[^"]*$/, "");
  fixed = fixed.replace(/,\s*"[^"]*$/, "");
  fixed = fixed.replace(/,\s*$/, "");

  let braces = 0, brackets = 0, inString = false, escape = false;
  for (const ch of fixed) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }
  if (inString) fixed += '"';
  while (brackets > 0) { fixed += "]"; brackets--; }
  while (braces > 0) { fixed += "}"; braces--; }
  try { return JSON.parse(fixed); } catch {}

  throw new Error("Could not extract valid JSON from response");
}

async function checkCancelled(supabase: any, diagnosticId: string): Promise<boolean> {
  const { data } = await supabase
    .from("diagnostics")
    .select("status")
    .eq("id", diagnosticId)
    .single();
  return data?.status === "error";
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, model: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Claude API error:", response.status, errText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

function buildUserPrompt(template: string, vars: Record<string, string>, outputHint?: string): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  if (outputHint) {
    result += "\n\n" + outputHint;
  }
  return result;
}

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
    const { diagnostic_id, program_id, name, description, audience_tags } =
      await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    // Load all active test_generation prompts ordered by step
    const { data: prompts, error: promptsErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", "test_generation")
      .eq("is_active", true)
      .order("step_order");

    if (promptsErr || !prompts || prompts.length === 0) {
      throw new Error("No active test_generation prompts found");
    }

    const prompt1 = prompts.find((p: any) => p.name.includes("теста")) || prompts[0];
    const prompt2 = prompts.find((p: any) => p.name.includes("карт")) || (prompts.length > 1 ? prompts[1] : null);

    // Load program data
    const { data: program } = await supabase
      .from("paid_programs")
      .select("title, description, audience_description, program_doc_url")
      .eq("id", program_id)
      .single();

    // Fetch program doc
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

    const templateVars: Record<string, string> = {
      program_title: program?.title || "",
      program_description: program?.description || "",
      audience_description: program?.audience_description || "",
      test_name: name || "",
      test_description: description || "",
      audience_tags: (audience_tags || []).join(", "),
      program_doc_description: programDocDescription,
    };

    // ---- Step 1: Generate quiz ----
    console.log(`[pipeline] Step 1: Calling Claude for quiz (diagnostic ${diagnostic_id})`);

    const userPrompt1 = buildUserPrompt(prompt1.user_prompt_template, templateVars, prompt1.output_format_hint);
    if (!userPrompt1.trim()) {
      throw new Error("Шаблон пользовательского промпта (шаг 1) пуст.");
    }

    const rawContent1 = await callClaude(ANTHROPIC_API_KEY, prompt1.system_prompt, userPrompt1, prompt1.model);
    console.log("[pipeline] Step 1 response length:", rawContent1.length);

    let fullResponse: any;
    try {
      fullResponse = extractJsonFromResponse(rawContent1);
    } catch (parseErr) {
      console.error("[pipeline] Step 1 JSON extraction failed. First 500 chars:", rawContent1.substring(0, 500));
      await supabase
        .from("diagnostics")
        .update({ status: "error", generation_progress: { error: "Invalid JSON from Claude (step 1)", raw_preview: rawContent1.substring(0, 300) } })
        .eq("id", diagnostic_id);
      throw new Error("Claude returned invalid JSON (step 1)");
    }

    const quizPart = fullResponse.quiz || fullResponse;

    // Extract image placeholders from quiz
    const quizString = JSON.stringify(quizPart);
    const placeholderRegex = /\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = placeholderRegex.exec(quizString)) !== null) {
      placeholders.push(match[1]);
    }

    // Save quiz results
    await supabase
      .from("diagnostics")
      .update({
        quiz_json: quizPart,
        status: "quiz_generated",
        generation_progress: { total_images: placeholders.length, completed_images: 0 },
      })
      .eq("id", diagnostic_id);

    console.log(`[pipeline] Step 1 done. ${placeholders.length} image placeholders found.`);

    if (await checkCancelled(supabase, diagnostic_id)) {
      console.log("[pipeline] Cancelled after step 1.");
      return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Step 1.5: Generate card prompt ----
    if (prompt2) {
      await supabase
        .from("diagnostics")
        .update({ status: "generating_card_prompt" })
        .eq("id", diagnostic_id);

      console.log(`[pipeline] Step 1.5: Calling Claude for card prompt`);

      const userPrompt2 = buildUserPrompt(prompt2.user_prompt_template, templateVars, prompt2.output_format_hint);
      if (!userPrompt2.trim()) {
        console.warn("[pipeline] Step 1.5 user prompt is empty, skipping card prompt generation.");
      } else {
        const rawContent2 = await callClaude(ANTHROPIC_API_KEY, prompt2.system_prompt, userPrompt2, prompt2.model);
        console.log("[pipeline] Step 1.5 response length:", rawContent2.length);

        let cardPromptValue: string;
        try {
          const parsed = extractJsonFromResponse(rawContent2);
          cardPromptValue = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        } catch {
          cardPromptValue = rawContent2
            .replace(/```[a-z]*\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();
        }

        await supabase
          .from("diagnostics")
          .update({ card_prompt: cardPromptValue })
          .eq("id", diagnostic_id);
      }

      if (await checkCancelled(supabase, diagnostic_id)) {
        console.log("[pipeline] Cancelled after step 1.5.");
        return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ---- Step 2: Generate images server-side ----
    if (placeholders.length === 0) {
      await supabase
        .from("diagnostics")
        .update({ status: "ready", generation_progress: { total_images: 0, completed_images: 0 } })
        .eq("id", diagnostic_id);

      console.log("[pipeline] No images to generate. Status set to ready.");
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      console.error("[pipeline] OPENROUTER_API_KEY not configured, skipping images.");
      await supabase
        .from("diagnostics")
        .update({ status: "ready", generation_progress: { total_images: placeholders.length, completed_images: 0, failed_images: placeholders.length, error: "OPENROUTER_API_KEY not configured" } })
        .eq("id", diagnostic_id);
      return new Response(JSON.stringify({ success: true, warning: "No OPENROUTER_API_KEY" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase
      .from("diagnostics")
      .update({ status: "generating_images", generation_progress: { total_images: placeholders.length, completed_images: 0, placeholders } })
      .eq("id", diagnostic_id);

    console.log(`[pipeline] Step 2: Generating ${placeholders.length} images server-side`);

    let currentQuizString = quizString;
    let completedImages = 0;
    let failedImages = 0;

    for (let i = 0; i < placeholders.length; i++) {
      if (await checkCancelled(supabase, diagnostic_id)) {
        console.log(`[pipeline] Cancelled during image ${i + 1}.`);
        return new Response(JSON.stringify({ success: false, cancelled: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`[pipeline] Generating image ${i + 1}/${placeholders.length}`);

      try {
        const imageBytes = await generateImage(placeholders[i], OPENROUTER_API_KEY);
        const fileName = `${diagnostic_id}/image_${i}_${Date.now()}.webp`;

        const { error: uploadErr } = await supabase.storage
          .from("quiz-images")
          .upload(fileName, imageBytes, { contentType: "image/webp", upsert: true });

        if (uploadErr) {
          console.error(`[pipeline] Upload error for image ${i}:`, uploadErr);
          failedImages++;
        } else {
          const { data: urlData } = supabase.storage
            .from("quiz-images")
            .getPublicUrl(fileName);

          const placeholder = `{{IMAGE:PROMPT=${placeholders[i]}}}`;
          currentQuizString = currentQuizString.split(placeholder).join(urlData.publicUrl);
          completedImages++;
        }
      } catch (imgErr) {
        console.error(`[pipeline] Image ${i} generation failed:`, imgErr);
        failedImages++;
      }

      // Update progress after each image
      const progressUpdate: any = {
        total_images: placeholders.length,
        completed_images: completedImages + failedImages,
        failed_images: failedImages,
      };

      // Parse current quiz string safely for progress save
      let progressQuizJson: any;
      try {
        // Remove remaining placeholders for safe parsing
        const safeString = currentQuizString.replace(/"?\{\{IMAGE:PROMPT=[^}]*\}\}"?/g, 'null');
        progressQuizJson = JSON.parse(safeString);
      } catch {
        progressQuizJson = quizPart; // fallback to original
      }

      await supabase
        .from("diagnostics")
        .update({ quiz_json: progressQuizJson, generation_progress: progressUpdate })
        .eq("id", diagnostic_id);
    }

    // Finalize
    let finalQuizJson: any;
    try {
      const safeString = currentQuizString.replace(/"?\{\{IMAGE:PROMPT=[^}]*\}\}"?/g, 'null');
      finalQuizJson = JSON.parse(safeString);
    } catch {
      finalQuizJson = quizPart;
    }

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

    console.log(`[pipeline] Done. ${completedImages} images OK, ${failedImages} failed. Status: ready.`);

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

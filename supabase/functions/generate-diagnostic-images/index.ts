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
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenRouter error:", response.status, errText);
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract image from response - OpenRouter returns images in message.images array
  const images = data.choices?.[0]?.message?.images;
  if (images && images.length > 0) {
    const imageUrl = images[0].image_url || images[0];
    const base64Match = typeof imageUrl === "string"
      ? imageUrl.match(/^data:image\/[^;]+;base64,(.+)/)
      : null;
    if (base64Match) {
      return decode(base64Match[1]);
    }
    // If it's a plain base64 string
    if (typeof imageUrl === "string" && !imageUrl.startsWith("http")) {
      return decode(imageUrl);
    }
  }

  // Fallback: check content for base64 image
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    const b64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (b64Match) {
      return decode(b64Match[1]);
    }
  }

  throw new Error("No image in response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnostic_id, image_description, placeholder_index, image_prompt_template } =
      await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build image prompt
    let imagePrompt = image_description;
    if (image_prompt_template) {
      imagePrompt = image_prompt_template.replace(
        /\{\{IMAGE_DESCRIPTION\}\}/g,
        image_description
      );
    }

    console.log(`Generating image ${placeholder_index} for diagnostic ${diagnostic_id}`);

    let publicUrl: string | null = null;

    try {
      const imageBytes = await generateImage(imagePrompt, OPENROUTER_API_KEY);
      const fileName = `${diagnostic_id}/image_${placeholder_index}_${Date.now()}.webp`;

      const { error: uploadErr } = await supabase.storage
        .from("quiz-images")
        .upload(fileName, imageBytes, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        throw uploadErr;
      }

      const { data: urlData } = supabase.storage
        .from("quiz-images")
        .getPublicUrl(fileName);

      publicUrl = urlData.publicUrl;
    } catch (imgErr) {
      console.error("Image generation failed:", imgErr);
      // Return null for this image - frontend will handle
    }

    return new Response(
      JSON.stringify({
        success: true,
        placeholder_index,
        image_url: publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-diagnostic-images error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

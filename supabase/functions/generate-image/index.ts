import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_CATEGORIES = ["image_carousel", "image_post", "image_email"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, category } = await req.json();
    if (!project_id || !category) throw new Error("project_id and category are required");
    if (!IMAGE_CATEGORIES.includes(category)) throw new Error(`Invalid image category: ${category}`);

    // API key is checked later when making the request

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project with offer, program, and lead magnets
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, offers(*, paid_programs(*)), lead_magnets!lead_magnets_project_id_fkey(*)")
      .eq("id", project_id)
      .single();
    if (projErr) throw projErr;

    const offer = project.offers;
    if (!offer) throw new Error("Project has no associated offer");
    const program = offer.paid_programs;
    const selectedLead = project.lead_magnets?.find((lm: any) => lm.is_selected);
    if (!selectedLead) throw new Error("Не выбран лид-магнит");

    // Get audience description
    let audienceDescription = program.audience_description || "";
    if (program.audience_doc_url && !audienceDescription) {
      try {
        const docMatch = program.audience_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            audienceDescription = await docResponse.text();
            await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
          }
        }
      } catch (docErr) {
        console.error("Error fetching Google Doc:", docErr);
      }
    }

    // Get offer description
    let offerDescription = offer.description || "";
    if (offer.doc_url && !offerDescription) {
      try {
        const docMatch = offer.doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const exportUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            offerDescription = await docResponse.text();
          }
        }
      } catch (docErr) {
        console.error("Error fetching offer Google Doc:", docErr);
      }
    }

    // Get active prompt for this category
    const { data: prompt } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!prompt) {
      throw new Error(`Нет активного промпта для категории "${category}". Создайте его в разделе «Управление промптами».`);
    }

    const leadMagnetContext = `Выбранный лид-магнит:
- Название: ${selectedLead.title}
- Визуальный формат: ${selectedLead.visual_format || ""}
- Визуальный контент: ${selectedLead.visual_content || ""}
- Мгновенная ценность: ${selectedLead.instant_value || ""}
- Переход к курсу: ${selectedLead.transition_to_course || ""}`;

    const imagePrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title)
      .replace(/\{\{offer_type\}\}/g, offer.offer_type)
      .replace(/\{\{offer_title\}\}/g, offer.title)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_description\}\}/g, offerDescription)
      .replace(/\{\{lead_magnet\}\}/g, leadMagnetContext)
      .replace(/\{\{lead_magnet_title\}\}/g, selectedLead.title)
      .replace(/\{\{lead_magnet_description\}\}/g, selectedLead.visual_content || "");

    console.log("Generating image with prompt:", imagePrompt.substring(0, 200));

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const imageResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error("Image generation API error:", imageResponse.status, errText);
      throw new Error(`Image generation API error: ${imageResponse.status} - ${errText}`);
    }

    const imageData = await imageResponse.json();
    console.log("OpenRouter response keys:", JSON.stringify(Object.keys(imageData)));
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image in OpenRouter response: " + JSON.stringify(imageData).substring(0, 500));

    // Strip "data:image/...;base64," prefix to get raw base64
    const b64Image = imageUrl.replace(/^data:image\/\w+;base64,/, "");

    // Upload to storage
    const timestamp = Date.now();
    const filePath = `${project_id}/${category}/${timestamp}.png`;
    const imageBytes = decode(b64Image);

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(filePath, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });
    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

    // Get public URL
    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Record generation run
    const { data: run } = await supabase.from("generation_runs").insert({
      project_id,
      prompt_id: prompt.id,
      type: category,
      status: "completed",
      input_data: {
        program_title: program.title,
        offer_title: offer.title,
        lead_magnet_title: selectedLead.title,
        image_prompt: imagePrompt,
      },
      output_data: { image_url: publicUrl },
      completed_at: new Date().toISOString(),
    }).select("id").single();

    // Save to content_pieces (URL as content)
    await supabase.from("content_pieces").delete().eq("project_id", project_id).eq("category", category);
    await supabase.from("content_pieces").insert({
      project_id,
      category,
      content: publicUrl,
      generation_run_id: run?.id || null,
    });

    return new Response(JSON.stringify({ success: true, image_url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

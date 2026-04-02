import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function transliterate(text: string): string {
  return text.toLowerCase().split("").map(c => TRANSLIT[c] ?? c).join("");
}

function generateSlug(title: string): string {
  const base = transliterate(title).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${rand}`;
}

async function generateImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-pro-image-preview", modalities: ["image", "text"], messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) { const errText = await response.text(); console.error("OpenRouter error:", response.status, errText); throw new Error(`Image generation failed: ${response.status}`); }
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
    const { pdf_material_id } = body;
    if (!pdf_material_id) throw new Error("pdf_material_id is required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: material, error: matErr } = await supabase.from("pdf_materials").select("*").eq("id", pdf_material_id).single();
    if (matErr) throw matErr;

    let programDocDescription = "";
    if (material.program_id) {
      const { data: program } = await supabase.from("paid_programs").select("program_doc_url, description, title").eq("id", material.program_id).single();
      if (program?.program_doc_url) {
        try {
          const docResp = await fetch(`${supabaseUrl}/functions/v1/fetch-google-doc`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` }, body: JSON.stringify({ url: program.program_doc_url }) });
          if (docResp.ok) { const docData = await docResp.json(); programDocDescription = docData.text || ""; }
        } catch (e) { console.error("Failed to fetch program doc:", e); }
      }
      if (!programDocDescription) programDocDescription = program?.description || "";
    }

    const { data: globalVars } = await supabase.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    (globalVars || []).forEach((v: any) => { gv[v.key] = v.value || ""; });

    let logoUrl = "";
    const { data: headerSetting } = await supabase.from("email_settings").select("setting_value").eq("setting_key", "email_header_html").single();
    if (headerSetting?.setting_value) {
      const imgMatch = headerSetting.setting_value.match(/src="([^"]+)"/);
      if (imgMatch) {
        const originalLogoUrl = imgMatch[1];
        const logoPath = "brand/logo.png";
        const { data: existingFile } = await supabase.storage.from("generated-images").list("brand", { search: "logo.png" });
        if (existingFile && existingFile.length > 0) {
          const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(logoPath);
          logoUrl = urlData.publicUrl;
        } else {
          try {
            const logoResp = await fetch(originalLogoUrl);
            if (logoResp.ok) {
              const logoBytes = new Uint8Array(await logoResp.arrayBuffer());
              const { error: uploadErr } = await supabase.storage.from("generated-images").upload(logoPath, logoBytes, { contentType: "image/png", upsert: true });
              if (!uploadErr) { const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(logoPath); logoUrl = urlData.publicUrl; } else { logoUrl = originalLogoUrl; }
            } else { logoUrl = originalLogoUrl; }
          } catch (e) { logoUrl = originalLogoUrl; }
        }
      }
    }

    let brandStyle = material.brand_style_name || "";
    if (material.brand_style_name) {
      const { data: scheme } = await supabase.from("color_schemes").select("description").eq("name", material.brand_style_name).single();
      if (scheme) brandStyle = scheme.description || material.brand_style_name;
    }

    const audienceKeyMap: Record<string, string> = {
      "С нуля — для себя": "audience_from_scratch_personal", "С нуля — новая профессия": "audience_from_scratch_career",
      "С нуля — для себя и возможно профессия": "audience_from_scratch_both", "Есть образование — повышение квалификации": "audience_with_diploma",
    };
    const audienceKey = audienceKeyMap[material.audience_name || ""] || "";
    const audienceDescription = audienceKey ? (gv[audienceKey] || material.audience_name || "") : (material.audience_name || "");

    const { data: prompt, error: promptErr } = await supabase.from("prompts").select("*").eq("category", "pdf_generation").eq("is_active", true).order("step_order").limit(1).single();
    if (promptErr) throw new Error("No active pdf_generation prompt found");

    const userPrompt = prompt.user_prompt_template
      .replace(/\{\{pdf_title\}\}/g, material.title || "").replace(/\{\{material_type\}\}/g, material.material_type || "").replace(/\{\{program_name\}\}/g, material.program_name || "").replace(/\{\{program_doc_description\}\}/g, programDocDescription).replace(/\{\{audience_name\}\}/g, material.audience_name || "").replace(/\{\{audience_description\}\}/g, audienceDescription).replace(/\{\{brand_style\}\}/g, brandStyle).replace(/\{\{brand_voice\}\}/g, gv["brand_voice"] || "").replace(/\{\{logo_url\}\}/g, logoUrl);

    console.log("Calling Anthropic API for PDF generation...");

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: prompt.model || "claude-sonnet-4-20250514", max_tokens: 64000, system: prompt.system_prompt, messages: [{ role: "user", content: userPrompt }] }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errText);
      await supabase.from("pdf_materials").update({ status: "error" }).eq("id", pdf_material_id);
      if (claudeResponse.status === 402) throw new Error("Недостаточно средств на аккаунте Anthropic.");
      if (claudeResponse.status === 429) throw new Error("Превышен лимит запросов к API.");
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const text = claudeData.content?.filter((b: any) => b.type === "text").map((b: any) => b.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let result: any;
    try { result = JSON.parse(clean); } catch (parseErr) {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else { await supabase.from("pdf_materials").update({ status: "error" }).eq("id", pdf_material_id); throw new Error("Failed to parse AI response as JSON"); }
    }

    const slug = generateSlug(material.title);
    let backgroundImageUrl = "";
    let landingHtml = result.landing_html || "";

    if (result.imagen_prompt) {
      const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
      if (OPENROUTER_API_KEY) {
        try {
          const imageBytes = await generateImage(result.imagen_prompt, OPENROUTER_API_KEY);
          const fileName = `pdf-materials/${pdf_material_id}/background_${Date.now()}.png`;
          const { error: uploadErr } = await supabase.storage.from("generated-images").upload(fileName, imageBytes, { contentType: "image/png", upsert: true });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(fileName);
            backgroundImageUrl = urlData.publicUrl;
            landingHtml = landingHtml.replace(/BACKGROUND_IMAGE_URL/g, backgroundImageUrl).replace(/CHARACTER_IMAGE_URL/g, backgroundImageUrl);
          }
        } catch (imgErr) { console.error("Image generation failed (non-blocking):", imgErr); }
      }
    }

    // Use fresh client to survive HTTP connection timeout
    const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: updateErr } = await freshSb.from("pdf_materials").update({
      subtitle: result.pdf_subtitle || "", html_content: result.html_content || "", sections_count: result.sections_count || null, word_count: result.word_count || null,
      landing_headline: result.landing_headline || "", landing_descriptor: result.landing_descriptor || "", landing_button_text: result.landing_button_text || "",
      landing_modal_type_word: result.landing_modal_title_type_word || "", landing_html: landingHtml, imagen_prompt: result.imagen_prompt || "",
      background_image_url: backgroundImageUrl || null, landing_slug: slug, status: "ready",
    }).eq("id", pdf_material_id);
    if (updateErr) throw updateErr;

    const responseData = { success: true, slug };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pdf-material error:", e);
    if (taskId) await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(() => {});
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

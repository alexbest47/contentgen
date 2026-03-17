import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { letter_id, letter_blocks_summary } = await req.json();
    if (!letter_id) throw new Error("letter_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Load prompt
    const { data: prompt } = await sb.from("prompts")
      .select("*")
      .eq("content_type", "email_builder")
      .eq("slug", "email-builder-subject")
      .eq("is_active", true)
      .single();
    if (!prompt) throw new Error("Промпт email-builder-subject не найден");

    // Load global variables
    const { data: gvRows } = await sb.from("prompt_global_variables").select("key, value");
    const gv: Record<string, string> = {};
    gvRows?.forEach((r: any) => { gv[r.key] = r.value; });

    // Build summary of blocks
    const summary = JSON.stringify(letter_blocks_summary || [], null, 2);

    let userPrompt = prompt.user_prompt_template || "";
    userPrompt = userPrompt
      .replace(/\{\{letter_blocks_summary\}\}/g, summary)
      .replace(/\{\{offer_rules\}\}/g, gv.offer_rules || "")
      .replace(/\{\{antiAI_rules\}\}/g, gv.antiAI_rules || "")
      .replace(/\{\{brand_voice\}\}/g, gv.brand_voice || "");

    for (const [k, v] of Object.entries(gv)) {
      userPrompt = userPrompt.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
    }

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: prompt.system_prompt || "Ты генератор тем для email-рассылок. Возвращай JSON с полями subject и preheader.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const aiData = await aiResp.json();
    const text = aiData.content?.[0]?.text || "";

    let subject = "", preheader = "";
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      const parsed = JSON.parse(jsonStr);
      subject = parsed.subject || "";
      preheader = parsed.preheader || "";
    } catch {
      subject = text.slice(0, 60);
    }

    // Update letter
    await sb.from("email_letters").update({ subject, preheader }).eq("id", letter_id);

    return new Response(JSON.stringify({ subject, preheader }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

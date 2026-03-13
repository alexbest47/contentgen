import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { prompt_id, instruction } = await req.json();
    if (!prompt_id || !instruction) {
      throw new Error("prompt_id and instruction are required");
    }

    // Load current prompt
    const { data: prompt, error: fetchErr } = await supabase
      .from("prompts")
      .select("system_prompt, user_prompt_template, name")
      .eq("id", prompt_id)
      .single();

    if (fetchErr || !prompt) throw new Error("Prompt not found");

    const systemMessage = `Ты — эксперт по промпт-инжинирингу. Тебе дан промпт, состоящий из системного сообщения (system_prompt) и пользовательского шаблона (user_prompt_template). Пользователь просит доработать его.

Верни ТОЛЬКО валидный JSON объект с двумя полями:
{
  "system_prompt": "обновлённый системный промпт",
  "user_prompt_template": "обновлённый пользовательский шаблон"
}

Важно:
- Сохраняй все плейсхолдеры вида {{variable_name}} без изменений
- Не добавляй пояснений до или после JSON
- Если изменения затрагивают только одну часть, вторую верни без изменений`;

    const userMessage = `## Текущий промпт "${prompt.name}"

### Системный промпт (system_prompt):
${prompt.system_prompt}

### Пользовательский шаблон (user_prompt_template):
${prompt.user_prompt_template}

---

## Инструкция по доработке:
${instruction}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: systemMessage,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text ?? "";

    // Extract JSON from response
    let parsed: { system_prompt: string; user_prompt_template: string };
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try parsing the whole content
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    if (!parsed.system_prompt || !parsed.user_prompt_template) {
      throw new Error("AI response missing required fields");
    }

    // Update prompt in DB
    const { error: updateErr } = await supabase
      .from("prompts")
      .update({
        system_prompt: parsed.system_prompt,
        user_prompt_template: parsed.user_prompt_template,
      })
      .eq("id", prompt_id);

    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        system_prompt: parsed.system_prompt,
        user_prompt_template: parsed.user_prompt_template,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("refine-prompt error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

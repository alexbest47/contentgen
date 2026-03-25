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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    taskId = body._task_id || null;
    const { prompt_id, instruction } = body;
    if (!prompt_id || !instruction) throw new Error("prompt_id and instruction are required");

    const { data: prompt, error: fetchErr } = await supabase.from("prompts").select("system_prompt, user_prompt_template, output_format_hint, model, provider, name").eq("id", prompt_id).single();
    if (fetchErr || !prompt) throw new Error("Prompt not found");

    // Archive current version before AI refine
    const { data: maxV } = await supabase.from("prompt_versions").select("version_number").eq("prompt_id", prompt_id).order("version_number", { ascending: false }).limit(1).maybeSingle();
    await supabase.from("prompt_versions").insert({
      prompt_id: prompt_id,
      version_number: (maxV?.version_number ?? 0) + 1,
      system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template,
      output_format_hint: prompt.output_format_hint,
      model: prompt.model,
      provider: prompt.provider,
      change_type: "ai_refine",
    });

    const systemMessage = `Ты — эксперт по промпт-инжинирингу. Тебе дан промпт, состоящий из системного сообщения (system_prompt) и пользовательского шаблона (user_prompt_template). Пользователь просит доработать его.\n\nВерни ТОЛЬКО валидный JSON объект с двумя полями:\n{\n  "system_prompt": "обновлённый системный промпт",\n  "user_prompt_template": "обновлённый пользовательский шаблон"\n}\n\nВажно:\n- Сохраняй все плейсхолдеры вида {{variable_name}} без изменений\n- Не добавляй пояснений до или после JSON\n- Если изменения затрагивают только одну часть, вторую верни без изменений`;

    const userMessage = `## Текущий промпт "${prompt.name}"\n\n### Системный промпт (system_prompt):\n${prompt.system_prompt}\n\n### Пользовательский шаблон (user_prompt_template):\n${prompt.user_prompt_template}\n\n---\n\n## Инструкция по доработке:\n${instruction}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 64000, system: systemMessage, messages: [{ role: "user", content: userMessage }] }),
    });

    if (!response.ok) { const errBody = await response.text(); throw new Error(`Anthropic API error ${response.status}: ${errBody}`); }

    const result = await response.json();
    const content = result.content?.[0]?.text ?? "";

    let parsed: { system_prompt: string; user_prompt_template: string };
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
      let jsonStr = jsonMatch ? jsonMatch[1].trim() : null;
      if (!jsonStr) { const braceStart = content.indexOf('{'); const braceEnd = content.lastIndexOf('}'); if (braceStart !== -1 && braceEnd > braceStart) jsonStr = content.substring(braceStart, braceEnd + 1); else jsonStr = content.trim(); }
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : '');
      parsed = JSON.parse(jsonStr);
    } catch (e) { throw new Error("Failed to parse AI response as JSON"); }

    if (!parsed.system_prompt && !parsed.user_prompt_template) throw new Error("AI response missing required fields");
    parsed.system_prompt = parsed.system_prompt || prompt.system_prompt;
    parsed.user_prompt_template = parsed.user_prompt_template || prompt.user_prompt_template;

    const { error: updateErr } = await supabase.from("prompts").update({ system_prompt: parsed.system_prompt, user_prompt_template: parsed.user_prompt_template }).eq("id", prompt_id);
    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

    const responseData = { success: true, system_prompt: parsed.system_prompt, user_prompt_template: parsed.user_prompt_template };
    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("refine-prompt error:", error);
    if (taskId) await failTask(taskId, error.message).catch(() => {});
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

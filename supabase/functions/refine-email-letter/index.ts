import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_REFINE_SYSTEM_PROMPT = `Ты — редактор email-писем. Тебе присылают уже сверстанный HTML письма (без хедера и футера — они добавляются отдельно) и комментарии пользователя с правками.

ТВОЯ ЗАДАЧА:
- Внести только те правки, о которых просит пользователь.
- СОХРАНИТЬ принципы вёрстки: таблицы, inline-стили, ширины, цветовые токены, структуру блоков, отступы, шрифты, скругления, кнопки, табличную email-совместимую разметку. Ничего лишнего не трогай.
- НЕ менять общую структуру письма без явной просьбы.
- НЕ добавлять новые <html>, <head>, <body>, <style> блоки. Возвращай только тот же фрагмент, что прислали (без хедера/футера).
- НЕ трогать теги <img> с src в виде {{placeholder_id}} — они подставляются системой.
- Любые добавляемые кнопки/ссылки оформляй в том же стиле, что уже используется в письме (такие же цвета, радиусы, отступы, шрифт).
- Если пользователь просит добавить ссылку — вставляй href аккуратно в соответствующий текст/кнопку.
- Тон текста и голос бренда сохраняй как в исходнике.

ФОРМАТ ОТВЕТА:
Верни СТРОГО JSON вида:
{"letter_html": "...обновлённый HTML..."}
Без пояснений, без markdown-блоков, без текста вокруг JSON.`;

async function completeTask(taskId: string, result: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb
    .from("task_queue")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result,
    })
    .eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
}

async function failTask(taskId: string, errorMessage: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);
  await sb
    .from("task_queue")
    .update({
      status: "error",
      completed_at: new Date().toISOString(),
      error_message: errorMessage?.substring(0, 2000) || "Unknown error",
    })
    .eq("id", taskId);
  fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;

    const { letter_id, user_instructions, system_prompt } = body;

    if (!letter_id || !user_instructions) {
      const msg = "letter_id and user_instructions are required";
      if (taskId) await failTask(taskId, msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: letter, error: letterErr } = await sb
      .from("email_letters")
      .select("id, generated_html, subject, preheader")
      .eq("id", letter_id)
      .single();
    if (letterErr || !letter) throw new Error("Письмо не найдено");
    if (!letter.generated_html) {
      throw new Error("В письме пока нет HTML — сначала сгенерируйте письмо.");
    }

    const finalSystemPrompt =
      (system_prompt && system_prompt.trim()) || DEFAULT_REFINE_SYSTEM_PROMPT;

    const userMessage = `ПРАВКИ, КОТОРЫЕ НУЖНО ВНЕСТИ:
${user_instructions}

ТЕКУЩИЙ HTML ПИСЬМА (без хедера и футера):
\`\`\`html
${letter.generated_html}
\`\`\`

Верни обновлённый HTML в поле letter_html согласно правилам из system prompt.`;

    const estimatedInputTokens = Math.ceil(
      (finalSystemPrompt.length + userMessage.length) / 4
    );
    const contextLimit = 200000;
    const maxTokens = Math.min(
      32000,
      Math.max(4000, contextLimit - estimatedInputTokens - 2000)
    );

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: finalSystemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!anthropicResp.ok) {
      const errBody = await anthropicResp.text();
      throw new Error(
        `Anthropic API error (${anthropicResp.status}): ${errBody.substring(0, 500)}`
      );
    }

    const aiData = await anthropicResp.json();
    const text = aiData.content?.[0]?.text || "";

    let newHtml = "";
    try {
      const jsonMatch =
        text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        const fixedStr = jsonStr.replace(/\r?\n/g, " ");
        parsed = JSON.parse(fixedStr);
      }
      newHtml = parsed.letter_html || parsed.html || "";
    } catch (e) {
      console.error("JSON parse failed:", (e as Error).message);
      newHtml = text;
    }

    if (!newHtml || newHtml.length < 20) {
      throw new Error("ИИ вернул пустой или некорректный HTML. Попробуйте ещё раз.");
    }

    const freshSb = createClient(supabaseUrl, serviceKey);
    const { error: updateErr } = await freshSb
      .from("email_letters")
      .update({ generated_html: newHtml })
      .eq("id", letter_id);
    if (updateErr) throw updateErr;

    const responseData = { html: newHtml };
    if (taskId) await completeTask(taskId, responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("refine-email-letter error:", e?.message);
    if (taskId) await failTask(taskId, e?.message || "Unknown error");
    return new Response(
      JSON.stringify({ error: e?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
}

async function fetchDocContent(url: string): Promise<string> {
  try {
    if (!url) return "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/fetch-google-doc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ url }),
    });
    if (!resp.ok) {
      console.error(`fetch-google-doc error: ${resp.status} for ${url}`);
      return "";
    }
    const data = await resp.json();
    return data.text || "";
  } catch (e) {
    console.error("Error fetching doc content:", url, e);
  }
  return "";
}

/** Fields that AI should never generate (URLs, links, technical values) */
const SKIP_AI_FIELDS = new Set(["button_url", "url", "link", "href", "anchor"]);

/** Strip HTML tags to measure plain-text length */
function plainLength(val: unknown): number {
  if (typeof val !== "string") return 0;
  return val.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").length;
}


/**
 * Build a JSON schema description from editable_fields,
 * so Claude knows what fields to fill and their types.
 * Skips image and URL fields since we only generate text content.
 * Includes character length limits so AI preserves layout.
 */
function buildFieldsDescription(
  editableFields: any[],
  currentContent: Record<string, any>,
  prefix = "",
  isVariableRepeater = false,
): string {
  const lines: string[] = [];
  for (const f of editableFields) {
    const path = prefix ? `${prefix}.${f.field}` : f.field;
    if (f.type === "image") continue;
    if (SKIP_AI_FIELDS.has(f.field)) continue;

    if (f.type === "repeater" && Array.isArray(f.fields)) {
      const items = currentContent?.[f.field];
      const count = Array.isArray(items) ? items.length : 0;
      lines.push(`- "${path}" (repeater, ${count} items): ${f.label}`);
      for (const sf of f.fields) {
        if (sf.type === "image") continue;
        if (SKIP_AI_FIELDS.has(sf.field)) continue;
        // Calculate avg length across repeater items for this sub-field
        let avgLen = 0;
        if (Array.isArray(items) && items.length > 0) {
          const total = items.reduce((sum: number, item: any) => sum + plainLength(item?.[sf.field]), 0);
          avgLen = Math.round(total / items.length);
        }
        const lenHint = avgLen > 0 ? ` (макс ~${avgLen} символов)` : "";
        lines.push(`  - "${sf.field}" (${sf.type}): ${sf.label}${lenHint}`);
      }
    } else {
      const val = currentContent?.[f.field];
      const len = plainLength(val);
      const preview =
        typeof val === "string" ? val.substring(0, 80) : JSON.stringify(val)?.substring(0, 80);
      const lenHint = len > 0 ? ` (макс ~${len} символов)` : "";
      lines.push(`- "${path}" (${f.type}): ${f.label}${lenHint} — текущее: "${preview}"`);
    }
  }
  return lines.join("\n");
}

/**
 * Extract only text fields from content_overrides,
 * respecting editable_fields structure.
 * Skips image and URL fields.
 */
function extractTextContent(
  editableFields: any[],
  content: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const f of editableFields) {
    if (f.type === "image") continue;
    if (SKIP_AI_FIELDS.has(f.field)) continue;
    const val = content?.[f.field];
    if (f.type === "repeater" && Array.isArray(val)) {
      result[f.field] = val.map((item: any) => {
        const itemResult: Record<string, any> = {};
        for (const sf of f.fields || []) {
          if (sf.type === "image") continue;
          if (SKIP_AI_FIELDS.has(sf.field)) continue;
          if (item[sf.field] !== undefined) itemResult[sf.field] = item[sf.field];
        }
        return itemResult;
      });
    } else if (val !== undefined) {
      result[f.field] = val;
    }
  }
  return result;
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  let taskId: string | null = null;

  try {
    const body = await req.json();
    taskId = body._task_id || null;
    const { landing_id, block_id } = body;
    if (!landing_id || !block_id)
      throw new Error("landing_id and block_id are required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ─── 1. Fetch landing + program ──────────────────────────────────────────
    const { data: landing, error: landingErr } = await supabase
      .from("landings")
      .select("*, paid_programs(*)")
      .eq("id", landing_id)
      .single();
    if (landingErr) throw new Error(`Landing not found: ${landingErr.message}`);

    const program = landing.paid_programs;
    if (!program)
      throw new Error("Лендинг не привязан к программе. Привяжите программу в визарде.");

    // ─── 2. Fetch program docs — always fresh from URL, fallback to cached ──
    let audienceDescription = "";
    if (program.audience_doc_url) {
      try {
        audienceDescription = await fetchDocContent(program.audience_doc_url);
        if (audienceDescription) {
          await supabase
            .from("paid_programs")
            .update({ audience_description: audienceDescription })
            .eq("id", program.id);
        }
      } catch (docErr) { console.error("Error fetching audience doc:", docErr); }
    }
    if (!audienceDescription) audienceDescription = program.audience_description || "";

    let programDocDescription = "";
    if (program.program_doc_url) {
      programDocDescription = await fetchDocContent(program.program_doc_url);
    }

    // ─── 3. Fetch block + definition ─────────────────────────────────────────
    const { data: block, error: blockErr } = await supabase
      .from("landing_blocks")
      .select("*, landing_block_definitions(*)")
      .eq("id", block_id)
      .single();
    if (blockErr) throw new Error(`Block not found: ${blockErr.message}`);

    const blockDef = block.landing_block_definitions;
    const editableFields: any[] = blockDef?.editable_fields || [];
    const defaultContent: Record<string, any> = blockDef?.default_content || {};
    const currentContent: Record<string, any> = block.content_overrides || defaultContent;

    // ─── 4. Fetch prompt template ────────────────────────────────────────────
    // Try block-type-specific prompt first (e.g. "landing_block_teachers"),
    // then fall back to generic "landing_block_content"
    const blockType = blockDef?.block_type || "";
    const VARIABLE_REPEATER_BLOCKS = new Set(["teachers", "curriculum", "faq"]);
    const isVariableRepeater = VARIABLE_REPEATER_BLOCKS.has(blockType);
    const specificCategory = `landing_block_${blockType}`;
    let prompt: any = null;

    const { data: specificPrompt } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", specificCategory)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (specificPrompt) {
      prompt = specificPrompt;
      console.log(`[generate-landing-block] Using specific prompt: ${specificCategory}`);
    } else {
      const { data: genericPrompt } = await supabase
        .from("prompts")
        .select("*")
        .eq("category", "landing_block_content")
        .eq("is_active", true)
        .limit(1)
        .single();
      prompt = genericPrompt;
    }

    if (!prompt)
      throw new Error(
        'Нет активного промпта для категории "landing_block_content". Создайте его в разделе "Управление промптами".'
      );

    // ─── 5. Fetch global variables ───────────────────────────────────────────
    const { data: globalVars } = await supabase
      .from("prompt_global_variables")
      .select("key, value");
    const gv: Record<string, string> = {};
    (globalVars || []).forEach((v: any) => {
      gv[v.key] = v.value || "";
    });

    // ─── 6. Build context ────────────────────────────────────────────────────
    const fieldsDescription = buildFieldsDescription(editableFields, currentContent, "", isVariableRepeater);
    const textContent = extractTextContent(editableFields, currentContent);
    const textContentJson = JSON.stringify(textContent, null, 2);

    // ─── 7. Replace template variables in prompt ─────────────────────────────
    const replacements: Record<string, string> = {
      "{{program_title}}": program.title || "",
      "{{program_doc_description}}": programDocDescription,
      "{{audience_description}}": audienceDescription,
      "{{block_name}}": blockDef?.name || blockDef?.block_type || "",
      "{{block_type}}": blockDef?.block_type || "",
      "{{block_fields_description}}": fieldsDescription,
      "{{block_current_content_json}}": textContentJson,
      "{{brand_voice}}": gv["brand_voice"] || "",
      "{{antiAI_rules}}": gv["antiAI_rules"] || "",
      "{{brand_style}}": gv["brand_style"] || "",
      "{{talentsy}}": gv["talentsy"] || "",
      "{{offer_rules}}": gv["offer_rules"] || "",
    };

    let userPrompt = prompt.user_prompt_template;
    for (const [key, value] of Object.entries(replacements)) {
      userPrompt = userPrompt.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    }

    console.log(`[generate-landing-block] Block: ${blockDef?.name}, Program: ${program.title}`);
    console.log(`[generate-landing-block] programDocDescription: ${programDocDescription.length} chars`);
    console.log(`[generate-landing-block] audienceDescription: ${audienceDescription.length} chars`);
    console.log(`[generate-landing-block] Prompt length: ${userPrompt.length} chars`);

    // ─── 8. Call Claude ──────────────────────────────────────────────────────
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 16000,
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

    // ─── 9. Parse JSON from Claude response ──────────────────────────────────
    let generatedContent: Record<string, any>;
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();
      generatedContent = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse Claude response as JSON:", rawContent.substring(0, 500));
      throw new Error("AI вернул невалидный JSON. Попробуйте ещё раз.");
    }

    // ─── 10. Merge generated text into current content_overrides ─────────────
    // Keep all non-text fields (images, _all_images, _image_overrides) intact.
    const mergedOverrides = { ...currentContent };

    for (const f of editableFields) {
      if (f.type === "image") continue;
      if (SKIP_AI_FIELDS.has(f.field)) continue;

      if (f.type === "repeater" && Array.isArray(generatedContent[f.field])) {
        const genItems = generatedContent[f.field];

        if (isVariableRepeater) {
          // Variable-length repeater: AI controls the count.
          // Clear image fields so old photos don't persist.
          mergedOverrides[f.field] = genItems.map((genItem: any) => {
            const merged: Record<string, any> = {};
            for (const sf of f.fields || []) {
              if (SKIP_AI_FIELDS.has(sf.field)) continue;
              if (sf.type === "image") {
                // Clear image — user will upload new ones
                merged[sf.field] = "";
              } else if (genItem[sf.field] !== undefined) {
                merged[sf.field] = genItem[sf.field];
              }
            }
            return merged;
          });
        } else {
          // Fixed-length repeater: keep same count, merge text, keep images
          const existingItems: any[] = mergedOverrides[f.field] || [];
          mergedOverrides[f.field] = genItems.map((genItem: any, idx: number) => {
            const existing = existingItems[idx] || {};
            const merged = { ...existing };
            for (const sf of f.fields || []) {
              if (sf.type === "image") continue;
              if (SKIP_AI_FIELDS.has(sf.field)) continue;
              if (genItem[sf.field] !== undefined) {
                merged[sf.field] = genItem[sf.field];
              }
            }
            return merged;
          });
        }
      } else if (generatedContent[f.field] !== undefined) {
        mergedOverrides[f.field] = generatedContent[f.field];
      }
    }

    // ─── 11. Save updated content_overrides to block ─────────────────────────
    const freshSb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error: updateErr } = await freshSb
      .from("landing_blocks")
      .update({ content_overrides: mergedOverrides })
      .eq("id", block_id);
    if (updateErr) throw new Error(`Ошибка обновления блока: ${updateErr.message}`);

    console.log(`[generate-landing-block] Block ${block_id} updated successfully`);

    const responseData = {
      success: true,
      block_id,
      generated_content: generatedContent,
    };

    if (taskId) await completeTask(taskId, responseData);
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing-block error:", e);
    if (taskId)
      await failTask(taskId, e instanceof Error ? e.message : "Unknown error").catch(
        () => {}
      );
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

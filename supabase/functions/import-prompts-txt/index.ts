import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedSection {
  name: string;
  system_prompt: string;
  user_prompt_template: string;
}

function parseTxt(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  // Split by section headers: --- Name ---
  const sectionRegex = /^---\s+(.+?)\s+---$/gm;
  const matches: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(text)) !== null) {
    matches.push({ name: m[1].trim(), index: m.index + m[0].length });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length
      ? text.lastIndexOf("---", matches[i + 1].index - 1)
      : text.length;
    const block = text.substring(start, end);

    const spIdx = block.indexOf("[System Prompt]");
    const upIdx = block.indexOf("[User Prompt Template]");
    if (spIdx === -1 || upIdx === -1) continue;

    const systemPrompt = block.substring(spIdx + "[System Prompt]".length, upIdx).trim();
    const userPromptTemplate = block.substring(upIdx + "[User Prompt Template]".length).trim();

    sections.push({
      name: matches[i].name,
      system_prompt: systemPrompt,
      user_prompt_template: userPromptTemplate,
    });
  }
  return sections;
}

// Map section names to content_type + channel
function mapSection(name: string): { content_type: string; channel: string | null } | null {
  const map: Record<string, { content_type: string; channel: string | null }> = {
    "Генерация лид-магнитов": { content_type: "lead_magnet", channel: null },
    "Лидмагнит: Instagram": { content_type: "lead_magnet", channel: "instagram" },
    "Лидмагнит: Telegram": { content_type: "lead_magnet", channel: "telegram" },
    "Лидмагнит: VK": { content_type: "lead_magnet", channel: "vk" },
    "Лидмагнит: Email": { content_type: "lead_magnet", channel: "email" },
    "Генерация справочного материала": { content_type: "reference_material", channel: null },
    "Справочный материал: Instagram": { content_type: "reference_material", channel: "instagram" },
    "Справочный материал: Telegram": { content_type: "reference_material", channel: "telegram" },
    "Справочный материал: VK": { content_type: "reference_material", channel: "vk" },
    "Справочный материал: Email": { content_type: "reference_material", channel: "email" },
    "Генерация тем экспертного контента": { content_type: "expert_content", channel: null },
    "Экспертный контент: Instagram": { content_type: "expert_content", channel: "instagram" },
    "Экспертный контент: Telegram": { content_type: "expert_content", channel: "telegram" },
    "Экспертный контент: VK": { content_type: "expert_content", channel: "vk" },
    "Экспертный контент: Email": { content_type: "expert_content", channel: "email" },
    "Генерация тем провокационного контента": { content_type: "provocative_content", channel: null },
    "Провокационный контент: Instagram": { content_type: "provocative_content", channel: "instagram" },
    "Провокационный контент: Telegram": { content_type: "provocative_content", channel: "telegram" },
    "Провокационный контент: VK": { content_type: "provocative_content", channel: "vk" },
    "Провокационный контент: Email": { content_type: "provocative_content", channel: "email" },
    "Генерация вариантов списка": { content_type: "list_content", channel: null },
    "Список: Instagram": { content_type: "list_content", channel: "instagram" },
    "Список: Telegram": { content_type: "list_content", channel: "telegram" },
    "Список: VK": { content_type: "list_content", channel: "vk" },
    "Список: Email": { content_type: "list_content", channel: "email" },
    "Генерация углов подачи кейса": { content_type: "case_analysis", channel: null },
    "Кейсы: Instagram": { content_type: "case_analysis", channel: "instagram" },
    "Кейсы: Telegram": { content_type: "case_analysis", channel: "telegram" },
    "Кейсы: VK": { content_type: "case_analysis", channel: "vk" },
    "Кейсы: Email": { content_type: "case_analysis", channel: "email" },
    "Генерация тем контент-отзыва": { content_type: "testimonial_content", channel: null },
    "Контент-отзыв: Instagram": { content_type: "testimonial_content", channel: "instagram" },
    "Контент-отзыв: Telegram": { content_type: "testimonial_content", channel: "telegram" },
    "Контент-отзыв: VK": { content_type: "testimonial_content", channel: "vk" },
    "Контент-отзыв: Email": { content_type: "testimonial_content", channel: "email" },
  };
  return map[name] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { text } = await req.json();
    if (!text) throw new Error("text is required");

    const sections = parseTxt(text);
    console.log(`Parsed ${sections.length} sections`);

    const updated: string[] = [];
    const notFound: string[] = [];
    const unmapped: string[] = [];

    for (const section of sections) {
      const mapping = mapSection(section.name);
      if (!mapping) {
        unmapped.push(section.name);
        continue;
      }

      // Find prompt by content_type and channel
      let query = supabase
        .from("prompts")
        .select("id, name")
        .eq("content_type", mapping.content_type);

      if (mapping.channel) {
        query = query.eq("channel", mapping.channel);
      } else {
        query = query.is("channel", null);
      }

      const { data: prompts, error } = await query;
      if (error) {
        console.error(`Query error for ${section.name}:`, error);
        notFound.push(section.name);
        continue;
      }

      if (!prompts || prompts.length === 0) {
        notFound.push(section.name);
        continue;
      }

      // Update first matching prompt
      const prompt = prompts[0];
      const { error: updateErr } = await supabase
        .from("prompts")
        .update({
          system_prompt: section.system_prompt,
          user_prompt_template: section.user_prompt_template,
        })
        .eq("id", prompt.id);

      if (updateErr) {
        console.error(`Update error for ${section.name}:`, updateErr);
        notFound.push(section.name);
      } else {
        updated.push(`${section.name} → ${prompt.name} (${prompt.id})`);
      }
    }

    return new Response(
      JSON.stringify({ updated, notFound, unmapped, totalParsed: sections.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("import-prompts-txt error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

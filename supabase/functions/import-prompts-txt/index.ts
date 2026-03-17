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

const NAME_ALIASES: Record<string, string> = {
  "Генерация тем постов-провокаций": "Генерация тем провокационного контента",
  "Пост-провокация: Instagram": "Провокационный контент: Instagram",
  "Пост-провокация: Telegram": "Провокационный контент: Telegram",
  "Пост-провокация: VK": "Провокационный контент: VK",
  "Пост-провокация: Email": "Провокационный контент: Email",
  "Генерация тем поста-списка": "Генерация тем списка",
  "Пост-список: Instagram": "Пайплайн список: Instagram",
  "Пост-список: Telegram": "Пайплайн список: Telegram",
  "Пост-список: VK": "Пайплайн список: VK",
  "Пост-список: Email": "Пайплайн список: Email",
};

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

    for (const section of sections) {
      const lookupName = NAME_ALIASES[section.name] || section.name;
      const { data: prompt, error } = await supabase
        .from("prompts")
        .select("id, name")
        .eq("name", lookupName)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`Query error for ${section.name}:`, error);
        notFound.push(section.name);
        continue;
      }

      if (!prompt) {
        notFound.push(section.name);
        continue;
      }

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
      JSON.stringify({ updated, notFound, totalParsed: sections.length }),
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

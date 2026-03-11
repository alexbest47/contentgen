import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id } = await req.json();
    if (!project_id) throw new Error("project_id is required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project with course and program data
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, mini_courses(*, paid_programs(*))")
      .eq("id", project_id)
      .single();
    if (projErr) throw projErr;

    const course = project.mini_courses;
    const program = course.paid_programs;

    // Update status
    await supabase.from("projects").update({ status: "generating_leads" }).eq("id", project_id);

    // Get active prompt for lead_magnets
    const { data: prompt } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", "lead_magnets")
      .eq("is_active", true)
      .limit(1)
      .single();

    const systemPrompt = prompt?.system_prompt || `Ты — эксперт по маркетингу онлайн-образования. Генерируй лид-магниты на русском языке.`;

    const defaultUserTemplate = `Создай 3 варианта лид-магнитов для мини-курса.

Платная программа: {{program_title}}
Мини-курс: {{mini_course_title}}
Описание аудитории: {{audience_description}}
Описание мини-курса: {{mini_course_description}}

Для каждого лид-магнита верни JSON-объект с полями:
- title (название)
- promise (обещание результата)
- description (краткое описание)
- marketing_angle (маркетинговый угол)
- call_to_action (призыв к действию)
- infographic_concept (концепция инфографики)
- attention_reason (почему это привлечёт внимание)

Верни массив из 3 объектов в формате JSON. Только JSON, без markdown.`;

    const userTemplate = prompt?.user_prompt_template || defaultUserTemplate;
    const userPrompt = userTemplate
      .replace(/\{\{program_title\}\}/g, program.title)
      .replace(/\{\{mini_course_title\}\}/g, course.title)
      .replace(/\{\{audience_description\}\}/g, course.audience_description || "")
      .replace(/\{\{mini_course_description\}\}/g, course.course_description || "");

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt?.model || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errText);
      await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text || "";

    // Parse JSON from response
    let leadMagnets;
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        leadMagnets = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content);
      await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      throw new Error("Failed to parse AI response");
    }

    // Delete existing lead magnets for this project
    await supabase.from("lead_magnets").delete().eq("project_id", project_id);

    // Insert new lead magnets
    const inserts = leadMagnets.slice(0, 3).map((lm: any) => ({
      project_id,
      title: lm.title || "Без названия",
      promise: lm.promise || "",
      description: lm.description || "",
      marketing_angle: lm.marketing_angle || "",
      call_to_action: lm.call_to_action || "",
      infographic_concept: lm.infographic_concept || "",
      attention_reason: lm.attention_reason || "",
    }));

    const { error: insertErr } = await supabase.from("lead_magnets").insert(inserts);
    if (insertErr) throw insertErr;

    // Log generation run
    await supabase.from("generation_runs").insert({
      project_id,
      prompt_id: prompt?.id || null,
      type: "lead_magnets",
      status: "completed",
      input_data: { program_title: program.title, course_title: course.title },
      output_data: leadMagnets,
      completed_at: new Date().toISOString(),
    });

    // Update status
    await supabase.from("projects").update({ status: "leads_ready" }).eq("id", project_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lead-magnets error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

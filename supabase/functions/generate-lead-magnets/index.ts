import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, content_type = "lead_magnet" } = await req.json();
    if (!project_id) throw new Error("project_id is required");
    const promptCategory = content_type === "reference_material" ? "reference_materials" : content_type === "expert_content" ? "expert_content" : content_type === "provocative_content" ? "provocative_content" : content_type === "list_content" ? "list_content" : content_type === "testimonial_content" ? "testimonial_content" : "lead_magnets";

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project with offer and program data
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, offers(*, paid_programs(*))")
      .eq("id", project_id)
      .single();
    if (projErr) throw projErr;

    const offer = project.offers;
    if (!offer) throw new Error("Project has no associated offer");
    const program = offer.paid_programs;

    // Fetch audience description from Google Doc if needed
    let audienceDescription = program.audience_description || "";
    if (program.audience_doc_url) {
      try {
        const docMatch = program.audience_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const docId = docMatch[1];
          const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            audienceDescription = await docResponse.text();
            await supabase.from("paid_programs").update({ audience_description: audienceDescription }).eq("id", program.id);
          } else {
            await docResponse.text();
          }
        }
      } catch (docErr) {
        console.error("Error fetching Google Doc:", docErr);
      }
    }

    // Fetch program description from Google Doc if available
    let programDocDescription = "";
    if (program.program_doc_url) {
      try {
        const docMatch = program.program_doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const docId = docMatch[1];
          const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            programDocDescription = await docResponse.text();
          }
        }
      } catch (docErr) {
        console.error("Error fetching program doc:", docErr);
      }
    }

    // Also fetch offer-level doc if present
    let offerDescription = offer.description || "";
    if (offer.doc_url) {
      try {
        const docMatch = offer.doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (docMatch) {
          const docId = docMatch[1];
          const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
          const docResponse = await fetch(exportUrl);
          if (docResponse.ok) {
            offerDescription = await docResponse.text();
          } else {
            await docResponse.text();
          }
        }
      } catch (docErr) {
        console.error("Error fetching offer Google Doc:", docErr);
      }
    }

    // Update status
    await supabase.from("projects").update({ status: "generating_leads" }).eq("id", project_id);

    // Get active prompt for the given category
    const { data: prompt, error: promptErr } = await supabase
      .from("prompts")
      .select("*")
      .eq("category", promptCategory)
      .eq("is_active", true)
      .is("channel", null)
      .limit(1)
      .maybeSingle();

    if (promptErr || !prompt) {
      await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      throw new Error(`No active prompt found for category '${promptCategory}'. Please create one in the Prompts section.`);
    }

    const systemPrompt = prompt.system_prompt;
    const userPrompt = prompt.user_prompt_template
      .replace(/\{\{program_title\}\}/g, program.title)
      .replace(/\{\{offer_type\}\}/g, offer.offer_type)
      .replace(/\{\{offer_title\}\}/g, offer.title)
      .replace(/\{\{audience_description\}\}/g, audienceDescription)
      .replace(/\{\{offer_description\}\}/g, offerDescription)
      .replace(/\{\{program_doc_description\}\}/g, programDocDescription);

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 64000,
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

    let leadMagnets;
    try {
      if (content_type === "reference_material") {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          leadMagnets = [JSON.parse(jsonMatch[0])];
        } else {
          throw new Error("No JSON object found in response");
        }
      } else {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          leadMagnets = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON array found in response");
        }
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content);
      await supabase.from("projects").update({ status: "error" }).eq("id", project_id);
      throw new Error("Failed to parse AI response");
    }

    await supabase.from("lead_magnets").delete().eq("project_id", project_id);

    const items = (content_type === "reference_material" || content_type === "expert_content" || content_type === "provocative_content" || content_type === "list_content") ? leadMagnets : leadMagnets.slice(0, 3);
    const inserts = items.map((lm: any) => {
      if (content_type === "list_content") {
        return {
          project_id,
          title: lm.list_title || lm.title || "Без названия",
          visual_format: lm.subtype || "",
          visual_content: JSON.stringify(lm.items || []),
          instant_value: lm.hook || "",
          save_reason: "",
          transition_to_course: lm.transition_to_offer || "",
          cta_text: "",
        };
      }
      if (content_type === "expert_content") {
        return {
          project_id,
          title: lm.topic_title || lm.title || "Без названия",
          visual_format: lm.category || "",
          visual_content: lm.topic_angle || "",
          instant_value: lm.hook || "",
          save_reason: "",
          transition_to_course: lm.transition_to_offer || "",
          cta_text: "",
        };
      }
      if (content_type === "provocative_content") {
        return {
          project_id,
          title: lm.topic_title || lm.title || "Без названия",
          visual_format: lm.format || "",
          visual_content: lm.topic_angle || "",
          instant_value: lm.hook || "",
          save_reason: lm.discussion_trigger || "",
          transition_to_course: lm.transition_to_offer || "",
          cta_text: "",
        };
      }
      return {
        project_id,
        title: lm.title || "Без названия",
        visual_format: lm.visual_format || "",
        visual_content: lm.visual_content || "",
        instant_value: lm.instant_value || "",
        save_reason: lm.save_reason || "",
        transition_to_course: lm.transition_to_test || lm.transition_to_course || "",
        cta_text: lm.cta_text || "",
      };
    });

    const { error: insertErr } = await supabase.from("lead_magnets").insert(inserts);
    if (insertErr) throw insertErr;

    await supabase.from("generation_runs").insert({
      project_id,
      prompt_id: prompt.id,
      type: promptCategory,
      status: "completed",
      input_data: { program_title: program.title, offer_title: offer.title, content_type },
      output_data: leadMagnets,
      completed_at: new Date().toISOString(),
    });

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

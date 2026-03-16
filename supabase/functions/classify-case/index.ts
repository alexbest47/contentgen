import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { file_id, job_id } = await req.json();
    if (!file_id || !job_id) {
      return new Response(JSON.stringify({ error: "file_id and job_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Queue check: is there already a file actively being classified?
    const { data: activeFiles } = await supabase
      .from("case_files")
      .select("id")
      .eq("status", "classifying")
      .limit(1);

    if (activeFiles && activeFiles.length > 0) {
      // Another classification is in progress — it will pick us up via self-chain
      console.log(`Another classification active, skipping file ${file_id}`);
      return new Response(
        JSON.stringify({ success: true, queued: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set this file to "classifying" (only one at a time)
    await supabase
      .from("case_files")
      .update({ status: "classifying", status_updated_at: new Date().toISOString() })
      .eq("id", file_id);

    // Get the file
    const { data: file, error: fileError } = await supabase
      .from("case_files")
      .select("*")
      .eq("id", file_id)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileError?.message}`);
    }

    if (!file.transcript_text) {
      throw new Error("No transcript text available for classification");
    }

    // Deduplication: check if this file_name already has a classification
    const { data: existingClassification } = await supabase
      .from("case_classifications")
      .select("id, classification_json")
      .eq("file_name", file.file_name)
      .limit(1)
      .maybeSingle();

    if (existingClassification) {
      console.log(`File ${file_id} (${file.file_name}) already classified, skipping`);
      // Copy existing classification for this job
      await supabase
        .from("case_classifications")
        .insert({
          file_id: file.id,
          job_id,
          file_name: file.file_name,
          classification_json: existingClassification.classification_json,
        });
      await supabase
        .from("case_files")
        .update({ status: "skipped", status_updated_at: new Date().toISOString() })
        .eq("id", file_id);

      // Continue chain
      const { data: nextFile } = await supabase
        .from("case_files")
        .select("id, job_id")
        .eq("status", "transcribed")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (nextFile) {
        fetch(`${supabaseUrl}/functions/v1/classify-case`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ file_id: nextFile.id, job_id: nextFile.job_id }),
        }).catch(() => {});
      }

      // Check job completion
      const { count: remainingCount } = await supabase
        .from("case_files")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job_id)
        .in("status", ["pending", "downloading", "transcribing", "transcribed", "classifying"]);

      if (!remainingCount || remainingCount === 0) {
        await supabase
          .from("case_jobs")
          .update({ status: "completed" })
          .eq("id", job_id);
      }

      return new Response(
        JSON.stringify({ success: true, file_id, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the prompt from DB
    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("system_prompt, user_prompt_template, model")
      .eq("content_type", "case_analysis")
      .eq("is_active", true)
      .order("step_order", { ascending: true })
      .limit(1)
      .single();

    if (promptError || !prompt) {
      throw new Error(`Classification prompt not found: ${promptError?.message}`);
    }

    // Build user prompt by substituting {{transcript_text}}
    const userPrompt = prompt.user_prompt_template
      ? prompt.user_prompt_template.replace(/\{\{transcript_text\}\}/g, file.transcript_text)
      : file.transcript_text;

    // Call Anthropic API
    console.log(`Classifying file ${file_id} (${file.file_name})...`);
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: prompt.model || "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: prompt.system_prompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const responseText = anthropicData.content?.[0]?.text ?? "";

    // Parse JSON from response
    let classificationJson: any;
    try {
      // Try direct parse first
      classificationJson = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        classificationJson = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding outermost braces
        const start = responseText.indexOf("{");
        const end = responseText.lastIndexOf("}");
        if (start !== -1 && end > start) {
          classificationJson = JSON.parse(responseText.slice(start, end + 1));
        } else {
          throw new Error("Could not parse JSON from Claude response");
        }
      }
    }

    // Build source URL for Yandex Disk
    const { data: jobData } = await supabase
      .from("case_jobs")
      .select("folder_url")
      .eq("id", job_id)
      .single();

    const sourceUrl = jobData?.folder_url
      ? `${jobData.folder_url}${file.file_path}`
      : null;

    // Save classification result
    await supabase
      .from("case_classifications")
      .insert({
        file_id: file.id,
        job_id,
        file_name: file.file_name,
        source_url: sourceUrl,
        classification_json: classificationJson,
      });

    // Update file status to classified
    await supabase
      .from("case_files")
      .update({ status: "classified", status_updated_at: new Date().toISOString() })
      .eq("id", file_id);

    console.log(`File ${file_id} classified successfully`);

    // Self-chain: find next file waiting for classification
    const { data: nextFile } = await supabase
      .from("case_files")
      .select("id, job_id")
      .eq("status", "transcribed")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (nextFile) {
      console.log(`Chaining to next file: ${nextFile.id}`);
      fetch(`${supabaseUrl}/functions/v1/classify-case`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ file_id: nextFile.id, job_id: nextFile.job_id }),
      }).catch(() => {});
    }

    // Check if all files in this job are done (classified or error)
    const { count: remainingCount } = await supabase
      .from("case_files")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job_id)
      .in("status", ["pending", "downloading", "transcribing", "transcribed", "classifying"]);

    if (!remainingCount || remainingCount === 0) {
      await supabase
        .from("case_jobs")
        .update({ status: "completed" })
        .eq("id", job_id);
    }

    return new Response(
      JSON.stringify({ success: true, file_id, classified: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("classify-case error:", error);

    // Mark file as error
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.file_id) {
        await supabase
          .from("case_files")
          .update({
            status: "error",
            error_message: `Classification error: ${error.message}`,
            status_updated_at: new Date().toISOString(),
          })
          .eq("id", body.file_id);
      }

      // Continue chain even on error
      const { data: nextFile } = await supabase
        .from("case_files")
        .select("id, job_id")
        .eq("status", "transcribed")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (nextFile) {
        fetch(`${supabaseUrl}/functions/v1/classify-case`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ file_id: nextFile.id, job_id: nextFile.job_id }),
        }).catch(() => {});
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

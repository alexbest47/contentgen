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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get("file_id");
    const jobId = url.searchParams.get("job_id");

    if (!fileId || !jobId) {
      return new Response(JSON.stringify({ error: "file_id and job_id query params required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify file exists and is in transcribing status
    const { data: file, error: fileError } = await supabase
      .from("case_files")
      .select("id, status")
      .eq("id", fileId)
      .eq("job_id", jobId)
      .single();

    if (fileError || !file) {
      console.error("File not found or invalid:", fileId, fileError?.message);
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.status !== "transcribing") {
      console.warn(`File ${fileId} status is '${file.status}', expected 'transcribing'. Ignoring.`);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse Deepgram result from request body
    const deepgramData = await req.json();

    const transcript =
      deepgramData.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    // Save transcript and set status to "transcribed" (waiting for classification)
    await supabase
      .from("case_files")
      .update({
        status: "transcribed",
        transcript_text: transcript,
        transcript_json: deepgramData,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // Trigger classification for this file
    fetch(`${supabaseUrl}/functions/v1/classify-case`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ file_id: fileId, job_id: jobId }),
    }).catch(() => {});

    // Continue transcription chain: find next pending file and trigger transcription
    const { data: nextFile } = await supabase
      .from("case_files")
      .select("id")
      .eq("job_id", jobId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (nextFile) {
      const fnUrl = `${supabaseUrl}/functions/v1/transcribe-case-file`;
      fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ job_id: jobId, file_id: nextFile.id }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, file_id: fileId, transcript_length: transcript.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("deepgram-callback error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
  const deepgramKey = Deno.env.get("DEEPGRAM_API_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { job_id, file_id } = await req.json();
    if (!job_id || !file_id) {
      return new Response(JSON.stringify({ error: "job_id and file_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get file record
    const { data: file, error: fileError } = await supabase
      .from("case_files")
      .select("*")
      .eq("id", file_id)
      .single();

    if (fileError || !file) {
      throw new Error(`File not found: ${fileError?.message}`);
    }

    // Get job to extract folder_url
    const { data: job } = await supabase
      .from("case_jobs")
      .select("folder_url, status")
      .eq("id", job_id)
      .single();

    if (!job || job.status === "error") {
      console.log("Job cancelled or not found, stopping chain");
      return new Response(JSON.stringify({ success: false, reason: "job cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update file status to downloading
    await supabase
      .from("case_files")
      .update({ status: "downloading" })
      .eq("id", file_id);

    // Get download URL from Yandex
    const publicKey = job.folder_url;
    const dlParams = new URLSearchParams({
      public_key: publicKey,
      path: file.file_path,
    });
    const dlRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/public/resources/download?${dlParams}`
    );
    if (!dlRes.ok) {
      const errText = await dlRes.text();
      throw new Error(`Yandex download URL error: ${dlRes.status} ${errText}`);
    }
    const dlData = await dlRes.json();
    const downloadUrl = dlData.href;

    if (!downloadUrl) {
      throw new Error("No download URL returned from Yandex");
    }

    // Update status to transcribing
    await supabase
      .from("case_files")
      .update({ status: "transcribing", download_url: downloadUrl })
      .eq("id", file_id);

    // Build callback URL for Deepgram to send results to
    const callbackUrl = `${supabaseUrl}/functions/v1/deepgram-callback?file_id=${file_id}&job_id=${job_id}`;

    // Send to Deepgram with callback — function returns immediately
    const deepgramParams = new URLSearchParams({
      model: "nova-2",
      language: "ru",
      punctuate: "true",
      utterances: "true",
      callback: callbackUrl,
    });

    const deepgramRes = await fetch(
      `https://api.deepgram.com/v1/listen?${deepgramParams}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${deepgramKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: downloadUrl }),
      }
    );

    if (!deepgramRes.ok) {
      const errText = await deepgramRes.text();
      throw new Error(`Deepgram error ${deepgramRes.status}: ${errText}`);
    }

    // Deepgram accepted the request — results will come via callback
    // No need to wait or self-chain; deepgram-callback handles continuation
    return new Response(
      JSON.stringify({ success: true, file_id, status: "transcribing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("transcribe-case-file error:", error);

    // Mark file as error and trigger next file
    try {
      const { job_id, file_id } = await req.clone().json().catch(() => ({}));
      if (file_id) {
        await supabase
          .from("case_files")
          .update({ status: "error", error_message: error.message })
          .eq("id", file_id);
      }

      // Continue with next file even on error
      if (job_id) {
        const { data: nextFile } = await supabase
          .from("case_files")
          .select("id")
          .eq("job_id", job_id)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (nextFile) {
          fetch(`${supabaseUrl}/functions/v1/transcribe-case-file`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ job_id, file_id: nextFile.id }),
          }).catch(() => {});
        } else {
          const { count } = await supabase
            .from("case_files")
            .select("id", { count: "exact", head: true })
            .eq("job_id", job_id)
            .in("status", ["pending", "downloading", "transcribing"]);

          if (!count || count === 0) {
            await supabase
              .from("case_jobs")
              .update({ status: "completed" })
              .eq("id", job_id);
          }
        }
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

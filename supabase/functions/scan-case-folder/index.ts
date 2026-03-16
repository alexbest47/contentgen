import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "webm"];

interface YandexResource {
  name: string;
  type: "dir" | "file";
  path: string;
  size?: number;
  resource_id?: string;
  _embedded?: {
    items: YandexResource[];
    total: number;
    limit: number;
    offset: number;
  };
}

async function fetchPublicResources(
  publicKey: string,
  path = "/",
  limit = 100,
  offset = 0
): Promise<YandexResource> {
  const params = new URLSearchParams({
    public_key: publicKey,
    path,
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(
    `https://cloud-api.yandex.net/v1/disk/public/resources?${params}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yandex API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function collectVideos(
  publicKey: string,
  path = "/",
  videos: { name: string; path: string; size: number; resource_id: string }[] = []
): Promise<typeof videos> {
  let offset = 0;
  const limit = 100;

  while (true) {
    const resource = await fetchPublicResources(publicKey, path, limit, offset);
    const items = resource._embedded?.items ?? [];

    for (const item of items) {
      if (item.type === "dir") {
        await collectVideos(publicKey, item.path, videos);
      } else if (item.type === "file") {
        const ext = item.name.split(".").pop()?.toLowerCase();
        if (ext && VIDEO_EXTENSIONS.includes(ext)) {
          videos.push({
            name: item.name,
            path: item.path,
            size: item.size ?? 0,
            resource_id: item.resource_id ?? item.path,
          });
        }
      }
    }

    const total = resource._embedded?.total ?? 0;
    offset += limit;
    if (offset >= total) break;
  }

  return videos;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folder_url } = await req.json();
    if (!folder_url) {
      return new Response(JSON.stringify({ error: "folder_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create job
    const { data: job, error: jobError } = await supabase
      .from("case_jobs")
      .insert({ folder_url, status: "processing", created_by: user.id })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create job: ${jobError?.message}`);
    }

    // Extract public key from URL
    const publicKey = folder_url;

    // Scan folder for videos
    let videos: { name: string; path: string; size: number; resource_id: string }[];
    try {
      videos = await collectVideos(publicKey);
    } catch (e) {
      await supabase
        .from("case_jobs")
        .update({ status: "error", error_message: `Ошибка сканирования папки: ${e.message}` })
        .eq("id", job.id);
      throw e;
    }

    if (videos.length === 0) {
      await supabase
        .from("case_jobs")
        .update({ status: "completed", error_message: "Видеофайлы не найдены" })
        .eq("id", job.id);
      return new Response(
        JSON.stringify({ success: true, job_id: job.id, files_found: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert file records
    const fileRows = videos.map((v) => ({
      job_id: job.id,
      file_path: v.path,
      file_name: v.name,
      file_size: v.size,
      resource_id: v.resource_id,
      status: "pending",
    }));

    const { data: insertedFiles, error: filesError } = await supabase
      .from("case_files")
      .insert(fileRows)
      .select("id");

    if (filesError) {
      throw new Error(`Failed to insert files: ${filesError.message}`);
    }

    // Chain to transcribe first file
    const firstFile = insertedFiles?.[0];
    if (firstFile) {
      const fnUrl = `${supabaseUrl}/functions/v1/transcribe-case-file`;
      fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ job_id: job.id, file_id: firstFile.id }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, job_id: job.id, files_found: videos.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scan-case-folder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

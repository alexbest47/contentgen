import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deleteFromSelectelS3 } from "../_shared/selectelS3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildObjectKey(path: string): string {
  return `landings/${path}/index.html`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { publication_id } = await req.json();
    if (!publication_id || typeof publication_id !== "string") {
      throw new Error("publication_id is required");
    }

    const { data: publication, error: publicationError } = await adminClient
      .from("published_s3_landings")
      .select("id, path")
      .eq("id", publication_id)
      .single();

    if (publicationError || !publication) {
      throw new Error("Публикация не найдена");
    }

    await deleteFromSelectelS3(buildObjectKey(publication.path));

    const { error: deleteError } = await adminClient
      .from("published_s3_landings")
      .delete()
      .eq("id", publication_id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("delete-s3-landing error:", error);

    return new Response(JSON.stringify({
      error: error?.message || "Delete failed",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

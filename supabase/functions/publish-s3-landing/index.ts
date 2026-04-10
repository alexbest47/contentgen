import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deleteFromSelectelS3, uploadHtmlToSelectelS3 } from "../_shared/selectelS3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLIC_BASE_URL = "https://land.talentsy.ru/landings";
const ROOT_PREFIX = "landings";

function normalizePath(path: string): string {
  return path
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function buildObjectKey(path: string): string {
  return `${ROOT_PREFIX}/${path}/index.html`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      landing_id,
      path: rawPath,
      html,
    } = await req.json();

    if (!landing_id || typeof landing_id !== "string") {
      throw new Error("landing_id is required");
    }
    if (!rawPath || typeof rawPath !== "string") {
      throw new Error("path is required");
    }
    if (!html || typeof html !== "string") {
      throw new Error("html is required");
    }

    const normalizedPath = normalizePath(rawPath);
    if (!normalizedPath) {
      throw new Error("path is empty");
    }

    const { data: landing, error: landingError } = await adminClient
      .from("landings")
      .select("id, created_by, landing_type")
      .eq("id", landing_id)
      .single();

    if (landingError || !landing) {
      throw new Error("Лендинг не найден");
    }

    if (landing.landing_type !== "s3") {
      throw new Error("Публикация сейчас доступна только для s3-лендингов");
    }

    const { data: existingPublication } = await adminClient
      .from("published_s3_landings")
      .select("id, path")
      .eq("landing_id", landing_id)
      .maybeSingle();

    const { data: pathConflict } = await adminClient
      .from("published_s3_landings")
      .select("id, landing_id, path")
      .eq("path", normalizedPath)
      .maybeSingle();

    if (pathConflict && pathConflict.landing_id !== landing_id) {
      throw new Error("Этот URL уже занят другой опубликованной s3-страницей");
    }

    if (existingPublication?.path && existingPublication.path !== normalizedPath) {
      await deleteFromSelectelS3(buildObjectKey(existingPublication.path));
      await adminClient
        .from("published_s3_landings")
        .delete()
        .eq("id", existingPublication.id);
    }

    await uploadHtmlToSelectelS3(buildObjectKey(normalizedPath), html);

    const publicationPayload = {
      landing_id,
      path: normalizedPath,
    };

    const publicationQuery = existingPublication
      ? adminClient
          .from("published_s3_landings")
          .update(publicationPayload)
          .eq("id", existingPublication.id)
      : adminClient
          .from("published_s3_landings")
          .insert(publicationPayload);

    const { data: publication, error: publicationError } = await publicationQuery
      .select("id, landing_id, path")
      .single();

    if (publicationError || !publication) {
      throw publicationError || new Error("Не удалось сохранить запись публикации");
    }

    return new Response(JSON.stringify({
      id: publication.id,
      landing_id: publication.landing_id,
      path: publication.path,
      url: `${PUBLIC_BASE_URL}/${publication.path}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("publish-s3-landing error:", error);

    return new Response(JSON.stringify({
      error: error?.message || "Publish failed",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

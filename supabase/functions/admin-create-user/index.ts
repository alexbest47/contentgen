import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generatePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: requester },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !requester) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      throw new Error(`Role check failed: ${roleError.message}`);
    }

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, role } = await req.json();

    if (!email || !full_name || !String(full_name).trim()) {
      return new Response(JSON.stringify({ error: "email and full_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedRole = role === "admin" ? "admin" : "user";
    const generatedPassword = generatePassword();

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: String(full_name).trim(),
      },
    });

    if (createError || !createdUser.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? "Failed to create user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: clearRolesError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", createdUser.user.id);

    if (clearRolesError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      throw new Error(`Role cleanup failed: ${clearRolesError.message}`);
    }

    const { error: insertRoleError } = await adminClient.from("user_roles").insert({
      user_id: createdUser.user.id,
      role: normalizedRole,
    });

    if (insertRoleError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      throw new Error(`Role insert failed: ${insertRoleError.message}`);
    }

    return new Response(
      JSON.stringify({
        id: createdUser.user.id,
        email: createdUser.user.email,
        password: generatedPassword,
        role: normalizedRole,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

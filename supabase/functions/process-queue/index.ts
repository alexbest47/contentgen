import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function processLane(supabase: any, supabaseUrl: string, serviceKey: string, lane: string): Promise<boolean> {
  // Only grab if no other task is currently processing in this lane
  const { data: processing } = await supabase
    .from("task_queue")
    .select("id")
    .eq("lane", lane)
    .eq("status", "processing")
    .limit(1);

  if (processing && processing.length > 0) {
    console.log(`Lane ${lane} already has a processing task, skipping`);
    return false;
  }

  // Get the next pending task
  const { data: tasks, error: fetchError } = await supabase
    .from("task_queue")
    .select("*")
    .eq("lane", lane)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (fetchError || !tasks || tasks.length === 0) {
    return false;
  }

  const task = tasks[0];

  // Atomically mark as processing
  const { data: claimed, error: claimError } = await supabase
    .from("task_queue")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", task.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (claimError || !claimed) {
    console.log(`Failed to claim task ${task.id}, already taken`);
    return false;
  }

  console.log(`Dispatching task ${task.id}: ${task.function_name} (lane: ${lane})`);

  // Fire-and-forget: call the target function with _task_id in payload
  const payloadWithTaskId = { ...task.payload, _task_id: task.id };

  fetch(`${supabaseUrl}/functions/v1/${task.function_name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payloadWithTaskId),
  }).catch((err) => {
    console.error(`Failed to dispatch task ${task.id}:`, err.message);
  });

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Watchdog: reset stuck tasks (processing > 10 min)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await supabase
      .from("task_queue")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
        error_message: "Timeout: задача выполнялась более 10 минут",
      })
      .eq("status", "processing")
      .lt("started_at", tenMinAgo);

    const lanes = ["claude", "openrouter"];
    const results: Record<string, boolean> = {};

    // Process one task per lane in parallel
    const promises = lanes.map(async (lane) => {
      results[lane] = await processLane(supabase, supabaseUrl, serviceKey, lane);
    });
    await Promise.all(promises);

    // Check if there are more pending tasks in any lane
    const { data: remaining } = await supabase
      .from("task_queue")
      .select("lane")
      .eq("status", "pending")
      .limit(1);

    if (remaining && remaining.length > 0) {
      // Self-chain: trigger another round after a short delay
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      setTimeout(() => {
        fetch(`${supabaseUrl}/functions/v1/process-queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ trigger: true }),
        }).catch(() => {});
      }, 1000);
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-queue error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Concurrency limits per lane
const LANE_CONCURRENCY: Record<string, number> = {
  claude: 3,
  openrouter: 5,
};

// Timeout in minutes
const TASK_TIMEOUT_MINUTES = 3;

async function processLane(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
  lane: string,
  maxConcurrent: number
): Promise<number> {
  let dispatched = 0;

  // Try to claim up to maxConcurrent tasks (claim_next_task checks active count)
  for (let i = 0; i < maxConcurrent; i++) {
    const { data: tasks, error: rpcError } = await supabase.rpc("claim_next_task", {
      p_lane: lane,
      p_max_concurrent: maxConcurrent,
    });

    if (rpcError) {
      console.error(`RPC claim_next_task error for lane ${lane}:`, rpcError.message);
      break;
    }

    if (!tasks || tasks.length === 0) {
      break; // No more tasks or lane at capacity
    }

    const task = tasks[0];
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

    dispatched++;
  }

  return dispatched;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Watchdog: reset stuck tasks (processing > 3 min)
    const timeoutAgo = new Date(Date.now() - TASK_TIMEOUT_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from("task_queue")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
        error_message: `Timeout: задача выполнялась более ${TASK_TIMEOUT_MINUTES} минут`,
      })
      .eq("status", "processing")
      .lt("started_at", timeoutAgo);

    const lanes = Object.keys(LANE_CONCURRENCY);
    const results: Record<string, number> = {};

    // Process lanes in parallel, each may dispatch multiple tasks
    const promises = lanes.map(async (lane) => {
      results[lane] = await processLane(
        supabase,
        supabaseUrl,
        serviceKey,
        lane,
        LANE_CONCURRENCY[lane]
      );
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

    return new Response(JSON.stringify({ dispatched: results }), {
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

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TaskType = "landing" | "letter" | "content";

interface EnqueueOptions {
  functionName: string;
  payload: Record<string, any>;
  displayTitle: string;
  lane: "claude" | "openrouter";
  taskType?: TaskType;
  targetUrl?: string;
}

export function useTaskQueue() {
  const enqueue = useCallback(async (options: EnqueueOptions): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("enqueue-task", {
        body: {
          function_name: options.functionName,
          payload: options.payload,
          display_title: options.displayTitle,
          lane: options.lane,
          task_type: options.taskType || "content",
          target_url: options.targetUrl,
        },
      });

      if (error) throw error;

      toast.success("Задача добавлена в очередь", {
        description: options.displayTitle,
      });

      return data?.task_id || null;
    } catch (err: any) {
      toast.error("Ошибка добавления в очередь", {
        description: err.message,
      });
      return null;
    }
  }, []);

  return { enqueue };
}

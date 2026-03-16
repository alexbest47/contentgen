import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UsePromptInfoFilters {
  category?: string;
  content_type?: string;
  channel?: string;
  enabled?: boolean;
}

export function usePromptInfo(filters: UsePromptInfoFilters) {
  return useQuery({
    queryKey: ["prompt_info", filters.category, filters.content_type, filters.channel],
    queryFn: async () => {
      let query = supabase
        .from("prompts")
        .select("name, content_type, channel")
        .eq("is_active", true);

      if (filters.category) query = query.eq("category", filters.category as any);
      if (filters.content_type) query = query.eq("content_type", filters.content_type);
      if (filters.channel) query = query.eq("channel", filters.channel);

      const { data, error } = await query.order("step_order");
      if (error) throw error;
      return data;
    },
    enabled: filters.enabled !== false,
  });
}

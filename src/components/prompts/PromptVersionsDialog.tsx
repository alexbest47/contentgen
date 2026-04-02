import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface Props {
  promptId: string;
  promptName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const changeTypeLabels: Record<string, string> = {
  manual: "Ручное редактирование",
  ai_refine: "Доработка AI",
  import: "Импорт TXT",
  rollback: "Откат",
};

export default function PromptVersionsDialog({ promptId, promptName, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ["prompt_versions", promptId],
    enabled: open && !!promptId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", promptId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async (version: any) => {
      // First archive current state
      const { data: current, error: fetchErr } = await supabase
        .from("prompts").select("system_prompt, user_prompt_template, output_format_hint, model, provider")
        .eq("id", promptId).single();
      if (fetchErr) throw fetchErr;

      const maxVersion = versions?.[0]?.version_number ?? 0;

      const { error: insertErr } = await supabase.from("prompt_versions").insert({
        prompt_id: promptId,
        version_number: maxVersion + 1,
        system_prompt: current.system_prompt,
        user_prompt_template: current.user_prompt_template,
        output_format_hint: current.output_format_hint,
        model: current.model,
        provider: current.provider,
        change_type: `rollback`,
      });
      if (insertErr) throw insertErr;

      // Apply selected version
      const { error: updateErr } = await supabase.from("prompts").update({
        system_prompt: version.system_prompt,
        user_prompt_template: version.user_prompt_template,
        output_format_hint: version.output_format_hint ?? undefined,
        model: version.model ?? undefined,
        provider: version.provider ?? undefined,
      }).eq("id", promptId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      toast.success("Промпт откачен к выбранной версии");
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["prompt_versions", promptId] });
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>История версий</DialogTitle>
          <DialogDescription>{promptName}</DialogDescription>
        </DialogHeader>

        {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}

        {!isLoading && (!versions || versions.length === 0) && (
          <p className="text-sm text-muted-foreground py-4">Нет сохранённых версий</p>
        )}

        {versions && versions.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {versions.map((v: any) => (
              <AccordionItem key={v.id} value={v.id}>
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2 text-left">
                    <Badge variant="outline">v{v.version_number}</Badge>
                    <Badge variant="secondary">{changeTypeLabels[v.change_type] ?? v.change_type}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(v.created_at), "dd.MM.yyyy HH:mm")}
                    </span>
                    {v.model && <span className="text-xs text-muted-foreground">{v.provider}/{v.model}</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium mb-1">System Prompt</p>
                      <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">{v.system_prompt}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">User Prompt Template</p>
                      <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">{v.user_prompt_template}</pre>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rollbackMutation.mutate(v)}
                      disabled={rollbackMutation.isPending}
                    >
                      {rollbackMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-2 h-3 w-3" />}
                      Откатиться к этой версии
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}

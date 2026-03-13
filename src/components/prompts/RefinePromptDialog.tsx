import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RefinePromptDialogProps {
  prompt: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RefinePromptDialog({ prompt, open, onOpenChange }: RefinePromptDialogProps) {
  const [instruction, setInstruction] = useState("");
  const queryClient = useQueryClient();

  const refineMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("refine-prompt", {
        body: { prompt_id: prompt?.id, instruction },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success("Промпт доработан с помощью AI");
      setInstruction("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`Ошибка: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setInstruction(""); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Доработать промпт с AI</DialogTitle>
          <DialogDescription>
            {prompt?.name ? `Промпт: ${prompt.name}` : "Опишите, что нужно изменить"}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Опишите, что вы хотите изменить в промпте..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={5}
        />
        <DialogFooter>
          <Button
            onClick={() => refineMutation.mutate()}
            disabled={!instruction.trim() || refineMutation.isPending}
          >
            {refineMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Доработать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

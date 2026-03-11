import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  generating_leads: "Генерация лид-магнитов...",
  leads_ready: "Выберите лид-магнит",
  lead_selected: "Лид-магнит выбран",
  generating_content: "Генерация контента...",
  completed: "Завершено",
  error: "Ошибка",
};

export default function ProjectDetail() {
  const { programId, courseId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: leadMagnets } = useQuery({
    queryKey: ["lead_magnets", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_magnets").select("*").eq("project_id", projectId!);
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-lead-magnets", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["lead_magnets", projectId] });
      toast.success("Лид-магниты сгенерированы!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectMutation = useMutation({
    mutationFn: async (leadMagnetId: string) => {
      // Deselect all
      await supabase.from("lead_magnets").update({ is_selected: false }).eq("project_id", projectId!);
      // Select one
      await supabase.from("lead_magnets").update({ is_selected: true }).eq("id", leadMagnetId);
      // Update project
      const { error } = await supabase.from("projects").update({
        selected_lead_magnet_id: leadMagnetId,
        status: "lead_selected" as const,
      }).eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["lead_magnets", projectId] });
      toast.success("Лид-магнит выбран");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canGenerate = project?.status === "draft" || project?.status === "error";
  const showLeadMagnets = leadMagnets && leadMagnets.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}/courses/${courseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.title ?? "..."}</h1>
          <p className="text-muted-foreground">{statusLabels[project?.status ?? "draft"]}</p>
        </div>
      </div>

      {/* Step 1: Generate lead magnets */}
      {canGenerate && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Sparkles className="h-10 w-10 text-primary" />
            <p className="text-center text-muted-foreground">
              Нажмите кнопку, чтобы сгенерировать 3 варианта лид-магнитов с помощью AI
            </p>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              {generateMutation.isPending ? "Генерация..." : "Сгенерировать лид-магниты"}
            </Button>
          </CardContent>
        </Card>
      )}

      {project?.status === "generating_leads" && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <div className="animate-pulse">Генерация лид-магнитов...</div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Show and select lead magnets */}
      {showLeadMagnets && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Варианты лид-магнитов</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {leadMagnets.map((lm) => (
              <Card key={lm.id} className={`transition-all ${lm.is_selected ? "ring-2 ring-primary" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{lm.title}</CardTitle>
                    {lm.is_selected && <Badge className="bg-primary text-primary-foreground"><Check className="mr-1 h-3 w-3" />Выбран</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><span className="font-medium">Обещание:</span> {lm.promise}</div>
                  <div><span className="font-medium">Описание:</span> {lm.description}</div>
                  <div><span className="font-medium">Маркетинговый угол:</span> {lm.marketing_angle}</div>
                  <div><span className="font-medium">Призыв к действию:</span> {lm.call_to_action}</div>
                  <div><span className="font-medium">Инфографика:</span> {lm.infographic_concept}</div>
                  <div><span className="font-medium">Почему привлечёт:</span> {lm.attention_reason}</div>
                  {!lm.is_selected && (project?.status === "leads_ready" || project?.status === "lead_selected") && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => selectMutation.mutate(lm.id)}
                      disabled={selectMutation.isPending}
                    >
                      Выбрать этот вариант
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Future: Step 3 - Generate full content (Этап 2) */}
      {project?.status === "lead_selected" && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Генерация полного набора контента будет доступна в следующем обновлении.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

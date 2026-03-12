import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Sparkles, Check, Loader2, RefreshCw, Image, Send, Mail, ExternalLink } from "lucide-react";
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

interface ContentType {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isEmail: boolean;
}

const contentTypes: ContentType[] = [
  { key: "instagram", label: "Пост в Instagram", description: "Текст, карусель и изображения", icon: <Image className="h-5 w-5" />, isEmail: false },
  { key: "telegram", label: "Пост в Telegram", description: "Текст, карусель и изображения", icon: <Send className="h-5 w-5" />, isEmail: false },
  { key: "vk", label: "Пост в ВКонтакте", description: "Текст, карусель и изображения", icon: <Send className="h-5 w-5" />, isEmail: false },
  { key: "email", label: "Email-рассылка", description: "Тема, текст и баннер", icon: <Mail className="h-5 w-5" />, isEmail: true },
];

const subTypes = [
  { key: "announcement", label: "Анонс", description: "Привлечь внимание" },
  { key: "warmup", label: "Прогрев", description: "Усилить интерес" },
  { key: "conversion", label: "Конверсия", description: "Побудить к действию" },
];

export default function ProjectDetail() {
  const { programId, offerType, offerId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  const backUrl = `/programs/${programId}/offers/${offerType}/${offerId}`;

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

  const { data: contentPieces } = useQuery({
    queryKey: ["content_pieces", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_pieces")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: project?.status === "lead_selected" || project?.status === "completed",
  });

  const { data: pipelineCounts } = useQuery({
    queryKey: ["pipeline_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("content_type, sub_type, id")
        .eq("is_active", true)
        .not("content_type", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((p: any) => {
        const key = `${p.content_type}::${p.sub_type}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    },
  });

  const selectMutation = useMutation({
    mutationFn: async (leadMagnetId: string) => {
      const selectedLm = leadMagnets?.find(lm => lm.id === leadMagnetId);
      await supabase.from("lead_magnets").update({ is_selected: false }).eq("project_id", projectId!);
      await supabase.from("lead_magnets").update({ is_selected: true }).eq("id", leadMagnetId);
      const { error } = await supabase.from("projects").update({
        selected_lead_magnet_id: leadMagnetId,
        status: "lead_selected" as const,
        title: selectedLm?.title ?? project?.title ?? "",
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

  const generatePipelineMutation = useMutation({
    mutationFn: async ({ contentType, subType }: { contentType: string; subType: string }) => {
      const key = `${contentType}::${subType}`;
      setGeneratingKey(key);
      const { data, error } = await supabase.functions.invoke("generate-pipeline", {
        body: { project_id: projectId, content_type: contentType, sub_type: subType },
      });
      if (error) throw new Error(error.message || "Ошибка генерации");
      if (data?.error) throw new Error(data.error);
      return { data, key };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Контент сгенерирован!");
      setGeneratingKey(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingKey(null);
    },
  });

  const getPipelineJson = (subType: string) =>
    contentPieces?.find((cp) => cp.category === `pipeline_json_${subType}`);

  const showLeadMagnets = leadMagnets && leadMagnets.length > 0;
  const showContentGeneration = project?.status === "lead_selected" || project?.status === "completed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.title ?? "..."}</h1>
          <p className="text-muted-foreground">{statusLabels[project?.status ?? "draft"]}</p>
        </div>
      </div>

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
                  <div><span className="font-medium">Визуальный формат:</span> {lm.visual_format}</div>
                  <div><span className="font-medium">Визуальный контент:</span> {lm.visual_content}</div>
                  <div><span className="font-medium">Мгновенная ценность:</span> {lm.instant_value}</div>
                  <div><span className="font-medium">Переход к курсу:</span> {lm.transition_to_course}</div>
                  {!lm.is_selected && (project?.status === "leads_ready" || project?.status === "lead_selected") && (
                    <Button variant="outline" className="w-full" onClick={() => selectMutation.mutate(lm.id)} disabled={selectMutation.isPending}>
                      Выбрать этот вариант
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showContentGeneration && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Создание контента</h2>
          {contentTypes.map((ct) => (
            <Card key={ct.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{ct.icon}</div>
                  <div>
                    <CardTitle className="text-base">{ct.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{ct.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип</TableHead>
                      <TableHead className="w-[100px] text-center">Статус</TableHead>
                      <TableHead className="w-[180px] text-right">Действие</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subTypes.map((st) => {
                      const pipelineKey = `${ct.key}::${st.key}`;
                      const stepCount = pipelineCounts?.[pipelineKey] || 0;
                      const isGenerating = generatingKey === pipelineKey;
                      const hasContent = !!getPipelineJson(st.key);

                      const contentUrl = `/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}/content/${ct.key}/${st.key}`;

                      return (
                        <TableRow
                          key={st.key}
                          className={hasContent ? "cursor-pointer" : ""}
                          onClick={() => hasContent && navigate(contentUrl)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-sm">{st.label}</p>
                                <p className="text-xs text-muted-foreground">{st.description}</p>
                              </div>
                              {hasContent && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {hasContent && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Готово
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={hasContent ? "outline" : "default"}
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePipelineMutation.mutate({ contentType: ct.key, subType: st.key });
                              }}
                              disabled={isGenerating || (!!generatingKey && generatingKey !== pipelineKey) || stepCount === 0}
                            >
                              {isGenerating ? (
                                <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
                              ) : hasContent ? (
                                <><RefreshCw className="mr-1 h-3 w-3" />Обновить</>
                              ) : (
                                <><Sparkles className="mr-1 h-3 w-3" />Создать</>
                              )}
                            </Button>
                            {stepCount === 0 && <p className="text-xs text-destructive mt-1">Нет промптов</p>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Check, Loader2, RefreshCw, Image, Send, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { usePromptInfo } from "@/hooks/usePromptInfo";

const getStatusLabel = (status: string, contentType?: string): string => {
  if (contentType === "reference_material") {
    const refLabels: Record<string, string> = {
      generating_leads: "Генерация справочного материала...",
      leads_ready: "Выберите справочный материал",
      lead_selected: "Справочный материал выбран",
    };
    if (refLabels[status]) return refLabels[status];
  }
  if (contentType === "expert_content") {
    const expertLabels: Record<string, string> = {
      generating_leads: "Генерация тем экспертного контента...",
      leads_ready: "Выберите тему экспертного контента",
      lead_selected: "Тема экспертного контента выбрана",
    };
    if (expertLabels[status]) return expertLabels[status];
  }
  if (contentType === "provocative_content") {
    const provocativeLabels: Record<string, string> = {
      generating_leads: "Генерация тем провокационного контента...",
      leads_ready: "Выберите тему провокационного контента",
      lead_selected: "Тема провокационного контента выбрана",
    };
    if (provocativeLabels[status]) return provocativeLabels[status];
  }
  if (contentType === "list_content") {
    const listLabels: Record<string, string> = {
      generating_leads: "Генерация тем списка...",
      leads_ready: "Выберите тему списка",
      lead_selected: "Тема списка выбрана",
    };
    if (listLabels[status]) return listLabels[status];
  }
  const defaultLabels: Record<string, string> = {
    draft: "Черновик",
    generating_leads: "Генерация лид-магнитов...",
    leads_ready: "Выберите лид-магнит",
    lead_selected: "Лид-магнит выбран",
    generating_content: "Генерация контента...",
    completed: "Завершено",
    error: "Ошибка",
  };
  return defaultLabels[status] ?? status;
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

export default function ProjectDetail() {
  const { programId, offerType, offerId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  const backUrl = `/programs/${programId}/offers/${offerType}/${offerId}`;

  const { data: allPromptInfo } = usePromptInfo({
    enabled: true,
  });

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
        .select("channel, id")
        .eq("is_active", true)
        .not("channel", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((p: any) => {
        counts[p.channel] = (counts[p.channel] || 0) + 1;
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
      toast.success(project?.content_type === "reference_material" ? "Справочный материал выбран" : project?.content_type === "expert_content" ? "Тема экспертного контента выбрана" : project?.content_type === "provocative_content" ? "Тема провокационного контента выбрана" : project?.content_type === "list_content" ? "Тема списка выбрана" : "Лид-магнит выбран");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generatePipelineMutation = useMutation({
    mutationFn: async (contentType: string) => {
      setGeneratingKey(contentType);
      const { data, error } = await supabase.functions.invoke("generate-pipeline", {
        body: { project_id: projectId, content_type: contentType },
      });
      if (error) throw new Error(error.message || "Ошибка генерации");
      if (data?.error) throw new Error(data.error);
      return data;
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

  const getPipelineJson = (contentType: string) =>
    contentPieces?.find((cp) => cp.category === `pipeline_json_${contentType}`);

  const isLeadSelected = project?.status === "lead_selected" || project?.status === "completed";
  const visibleLeadMagnets = isLeadSelected
    ? leadMagnets?.filter(lm => lm.is_selected)
    : leadMagnets;
  const showLeadMagnets = visibleLeadMagnets && visibleLeadMagnets.length > 0;
  const showContentGeneration = isLeadSelected;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.title ?? "..."}</h1>
          <p className="text-muted-foreground">{getStatusLabel(project?.status ?? "draft", project?.content_type)}</p>
        </div>
      </div>

      {showLeadMagnets && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{project?.content_type === "reference_material" ? "Варианты справочных материалов" : (project?.content_type === "expert_content" || project?.content_type === "provocative_content") ? "Темы контента" : "Варианты лид-магнитов"}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleLeadMagnets.map((lm) => (
              <Card key={lm.id} className={`transition-all ${lm.is_selected ? "ring-2 ring-primary" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{lm.title}</CardTitle>
                    {lm.is_selected && <Badge className="bg-primary text-primary-foreground"><Check className="mr-1 h-3 w-3" />Выбран</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                   {project?.content_type === "expert_content" ? (
                     <>
                       <div><span className="font-medium">Категория:</span> {lm.visual_format}</div>
                       <div><span className="font-medium">Угол подачи:</span> {lm.visual_content}</div>
                       <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
                       <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                     </>
                   ) : project?.content_type === "provocative_content" ? (
                     <>
                       <div><span className="font-medium">Формат:</span> {lm.visual_format}</div>
                       <div><span className="font-medium">Угол подачи:</span> {lm.visual_content}</div>
                       <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
                       <div><span className="font-medium">Триггер дискуссии:</span> {(lm as any).save_reason}</div>
                       <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                     </>
                  ) : (
                    <>
                      <div><span className="font-medium">Визуальный формат:</span> {lm.visual_format}</div>
                      <div><span className="font-medium">Визуальный контент:</span> {lm.visual_content}</div>
                      <div><span className="font-medium">Мгновенная ценность:</span> {lm.instant_value}</div>
                      <div><span className="font-medium">Причина сохранить:</span> {(lm as any).save_reason}</div>
                      <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                    </>
                  )}
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Создание контента</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {contentTypes.map((ct) => {
              const isGenerating = generatingKey === ct.key;
              const hasContent = !!getPipelineJson(ct.key);
              const stepCount = pipelineCounts?.[ct.key] || 0;
              const contentUrl = `/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}/content/${ct.key}`;

              return (
                <Card
                  key={ct.key}
                  className={`transition-all ${hasContent ? "cursor-pointer hover:border-primary/50" : ""}`}
                  onClick={() => hasContent && navigate(contentUrl)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">{ct.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{ct.label}</CardTitle>
                          {hasContent && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Готово
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{ct.description}</p>
                      </div>
                      {hasContent && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      size="sm"
                      variant={hasContent ? "outline" : "default"}
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePipelineMutation.mutate(ct.key);
                      }}
                      disabled={isGenerating || (!!generatingKey && generatingKey !== ct.key) || stepCount === 0}
                    >
                      {isGenerating ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
                      ) : hasContent ? (
                        <><RefreshCw className="mr-1 h-3 w-3" />Обновить</>
                      ) : (
                        <><Sparkles className="mr-1 h-3 w-3" />Создать</>
                      )}
                    </Button>
                    {stepCount === 0 && <p className="text-xs text-destructive mt-1 text-center">Нет промптов</p>}
                    {stepCount > 0 && (() => {
                      const prompt = allPromptInfo?.find(p => p.channel === ct.key);
                      return prompt ? (
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Промпт: «{prompt.name}»
                        </p>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

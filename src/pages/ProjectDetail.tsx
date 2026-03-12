import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Check, Loader2, RefreshCw, Copy, ChevronDown, ChevronUp, Download, Image, Send, Mail } from "lucide-react";
import SlideStructureView from "@/components/project/SlideStructureView";
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
  steps: { textCategory: string; imageCategories: string[] };
}

const contentTypes: ContentType[] = [
  {
    key: "instagram",
    label: "Пост в Instagram",
    description: "Текст, карусель и изображения для Instagram",
    icon: <Image className="h-5 w-5" />,
    steps: { textCategory: "text_instagram", imageCategories: ["slide_structure", "image_post", "image_carousel"] },
  },
  {
    key: "telegram",
    label: "Пост в Telegram",
    description: "Текст, карусель и изображения для Telegram",
    icon: <Send className="h-5 w-5" />,
    steps: { textCategory: "text_telegram", imageCategories: ["slide_structure", "image_post", "image_carousel"] },
  },
  {
    key: "vk",
    label: "Пост в ВКонтакте",
    description: "Текст, карусель и изображения для VK",
    icon: <Send className="h-5 w-5" />,
    steps: { textCategory: "text_vk", imageCategories: ["slide_structure", "image_post", "image_carousel"] },
  },
  {
    key: "email",
    label: "Email-рассылка",
    description: "Текст и баннер для email",
    icon: <Mail className="h-5 w-5" />,
    steps: { textCategory: "text_email", imageCategories: ["image_email"] },
  },
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
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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
      await supabase.from("lead_magnets").update({ is_selected: false }).eq("project_id", projectId!);
      await supabase.from("lead_magnets").update({ is_selected: true }).eq("id", leadMagnetId);
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
    onSuccess: ({ key }) => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Контент сгенерирован!");
      setGeneratingKey(null);
      setExpandedKeys((prev) => new Set(prev).add(key));
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingKey(null);
    },
  });

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано в буфер обмена");
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
  };

  // Get content for a category_subtype key, e.g. "text_instagram_announcement"
  const getContent = (category: string, subType: string) =>
    contentPieces?.find((cp) => cp.category === `${category}_${subType}`);

  const hasContentForKey = (ct: ContentType, subType: string) => {
    const textContent = getContent(ct.steps.textCategory, subType);
    const imageContent = ct.steps.imageCategories.some((ic) => getContent(ic, subType));
    return !!textContent || imageContent;
  };

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
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {subTypes.map((st) => {
                    const pipelineKey = `${ct.key}::${st.key}`;
                    const stepCount = pipelineCounts?.[pipelineKey] || 0;
                    const isGenerating = generatingKey === pipelineKey;
                    const hasContent = hasContentForKey(ct, st.key);
                    const isExpanded = expandedKeys.has(pipelineKey);

                    return (
                      <div key={st.key} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{st.label}</p>
                            <p className="text-xs text-muted-foreground">{st.description}</p>
                          </div>
                          {hasContent && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Готово</Badge>}
                        </div>

                        {hasContent && isExpanded && (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(() => {
                              const textContent = getContent(ct.steps.textCategory, st.key);
                              return textContent ? (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-muted-foreground">Текст</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(textContent.content)}>
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {textContent.content}
                                  </div>
                                </div>
                              ) : null;
                            })()}
                            {ct.steps.imageCategories.map((ic) => {
                              const imgContent = getContent(ic, st.key);
                              if (!imgContent) return null;
                              const isUrl = imgContent.content.startsWith("http");
                              return (
                                <div key={ic}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-muted-foreground">{ic}</span>
                                    {isUrl && (
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(imgContent.content, `${ct.key}_${st.key}_${ic}.png`)}>
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  {isUrl ? (
                                    <div className="rounded-md overflow-hidden border">
                                      <img src={imgContent.content} alt={ic} className="w-full max-h-[200px] object-contain bg-muted/30" />
                                    </div>
                                  ) : (
                                    <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                      {imgContent.content}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {hasContent && (
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleExpand(pipelineKey)}>
                              {isExpanded ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
                              {isExpanded ? "Свернуть" : "Показать"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={hasContent ? "outline" : "default"}
                            className="ml-auto text-xs h-7"
                            onClick={() => generatePipelineMutation.mutate({ contentType: ct.key, subType: st.key })}
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
                        </div>
                        {stepCount === 0 && <p className="text-xs text-destructive">Нет промптов</p>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

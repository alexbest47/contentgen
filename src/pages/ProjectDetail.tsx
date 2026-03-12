import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Check, Loader2, RefreshCw, Copy, ChevronDown, ChevronUp, Download, Image, Send, Mail } from "lucide-react";
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
  textCategory: string;
  imageCategory?: string;
}

const contentTypes: ContentType[] = [
  {
    key: "instagram",
    label: "Пост в Instagram",
    description: "Текст и изображение для поста в Instagram",
    icon: <Image className="h-5 w-5" />,
    textCategory: "text_instagram",
    imageCategory: "image_post",
  },
  {
    key: "telegram",
    label: "Пост в Telegram",
    description: "Текст и изображение для поста в Telegram",
    icon: <Send className="h-5 w-5" />,
    textCategory: "text_telegram",
    imageCategory: "image_carousel",
  },
  {
    key: "vk",
    label: "Пост в ВКонтакте",
    description: "Текст и изображение для поста в ВК",
    icon: <Send className="h-5 w-5" />,
    textCategory: "text_vk",
    imageCategory: "image_carousel",
  },
  {
    key: "email",
    label: "Email-рассылка",
    description: "Текст и изображение для email-рассылки",
    icon: <Mail className="h-5 w-5" />,
    textCategory: "text_email",
    imageCategory: "image_email",
  },
];

export default function ProjectDetail() {
  const { programId, offerType, offerId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [generatingStep, setGeneratingStep] = useState<{ current: number; total: number } | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

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

  // Count pipeline steps for a content type
  const { data: pipelineCounts } = useQuery({
    queryKey: ["pipeline_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("content_type, id")
        .eq("is_active", true)
        .not("content_type", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((p: any) => {
        counts[p.content_type] = (counts[p.content_type] || 0) + 1;
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
    mutationFn: async (contentType: string) => {
      setGeneratingType(contentType);
      const stepCount = pipelineCounts?.[contentType] || 2;
      setGeneratingStep({ current: 1, total: stepCount });

      const { data, error } = await supabase.functions.invoke("generate-pipeline", {
        body: { project_id: projectId, content_type: contentType },
      });
      if (error) throw new Error(error.message || "Ошибка генерации");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, contentType) => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Контент сгенерирован!");
      setGeneratingType(null);
      setGeneratingStep(null);
      setExpandedTypes((prev) => new Set(prev).add(contentType));
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingType(null);
      setGeneratingStep(null);
    },
  });

  const toggleExpand = (key: string) => {
    setExpandedTypes((prev) => {
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

  const getContentForCategory = (category: string) =>
    contentPieces?.find((cp) => cp.category === category);

  const hasContentForType = (ct: ContentType) => {
    return getContentForCategory(ct.textCategory) || (ct.imageCategory && getContentForCategory(ct.imageCategory));
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
                  <div><span className="font-medium">Обещание:</span> {lm.promise}</div>
                  <div><span className="font-medium">Описание:</span> {lm.description}</div>
                  <div><span className="font-medium">Маркетинговый угол:</span> {lm.marketing_angle}</div>
                  <div><span className="font-medium">Призыв к действию:</span> {lm.call_to_action}</div>
                  <div><span className="font-medium">Инфографика:</span> {lm.infographic_concept}</div>
                  <div><span className="font-medium">Почему привлечёт:</span> {lm.attention_reason}</div>
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
              const textContent = getContentForCategory(ct.textCategory);
              const imageContent = ct.imageCategory ? getContentForCategory(ct.imageCategory) : null;
              const hasContent = hasContentForType(ct);
              const isGenerating = generatingType === ct.key;
              const isExpanded = expandedTypes.has(ct.key);
              const stepCount = pipelineCounts?.[ct.key] || 0;

              return (
                <Card key={ct.key} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{ct.icon}</div>
                        <div>
                          <CardTitle className="text-base">{ct.label}</CardTitle>
                          {stepCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">{stepCount} {stepCount === 1 ? "шаг" : stepCount < 5 ? "шага" : "шагов"} в пайплайне</p>
                          )}
                        </div>
                        {hasContent && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Готово</Badge>}
                      </div>
                    </div>
                    {!hasContent && !isGenerating && (
                      <p className="text-sm text-muted-foreground mt-1">{ct.description}</p>
                    )}
                    {isGenerating && generatingStep && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Генерация... (шаг {generatingStep.current} из {generatingStep.total})</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col flex-1 justify-end gap-3">
                    {hasContent && isExpanded && (
                      <div className="space-y-3">
                        {textContent && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Текст</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(textContent.content)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {textContent.content}
                            </div>
                          </div>
                        )}
                        {imageContent && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Изображение</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(imageContent.content, `${ct.key}.png`)}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="rounded-md overflow-hidden border">
                              <img src={imageContent.content} alt={ct.label} className="w-full max-h-[300px] object-contain bg-muted/30" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {hasContent && (
                        <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => toggleExpand(ct.key)}>
                          {isExpanded ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
                          {isExpanded ? "Свернуть" : "Показать"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={hasContent ? "outline" : "default"}
                        className="ml-auto"
                        onClick={() => generatePipelineMutation.mutate(ct.key)}
                        disabled={isGenerating || (!!generatingType && generatingType !== ct.key) || stepCount === 0}
                      >
                        {isGenerating ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
                        ) : hasContent ? (
                          <><RefreshCw className="mr-1 h-3 w-3" />Перегенерировать</>
                        ) : (
                          <><Sparkles className="mr-1 h-3 w-3" />Сгенерировать</>
                        )}
                      </Button>
                    </div>
                    {stepCount === 0 && !isGenerating && (
                      <p className="text-xs text-destructive">Нет промптов для этого типа контента</p>
                    )}
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

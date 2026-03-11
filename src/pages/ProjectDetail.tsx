import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Check, Loader2, RefreshCw, Copy, ChevronDown, ChevronUp } from "lucide-react";
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

type ContentCategory = "slide_structure" | "text_instagram" | "text_vk" | "text_telegram" | "text_email";

const contentCategories: { key: ContentCategory; label: string; description: string }[] = [
  { key: "slide_structure", label: "Структура слайдов", description: "Структура карусели / слайдов для лид-магнита" },
  { key: "text_instagram", label: "Текст Instagram", description: "Пост для Instagram с текстом и хэштегами" },
  { key: "text_vk", label: "Текст VK", description: "Пост для ВКонтакте" },
  { key: "text_telegram", label: "Текст Telegram", description: "Пост для Telegram-канала" },
  { key: "text_email", label: "Текст Email", description: "Письмо для email-рассылки" },
];

export default function ProjectDetail() {
  const { programId, courseId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingCategory, setGeneratingCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
        .from("content_pieces" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: project?.status === "lead_selected" || project?.status === "completed",
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

  const generateContentMutation = useMutation({
    mutationFn: async (category: string) => {
      setGeneratingCategory(category);
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { project_id: projectId, category },
      });
      if (error) throw new Error(error.message || "Ошибка генерации");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, category) => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Контент сгенерирован!");
      setGeneratingCategory(null);
      setExpandedCategories((prev) => new Set(prev).add(category));
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingCategory(null);
    },
  });

  const toggleExpand = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано в буфер обмена");
  };

  const getContentForCategory = (category: string) => {
    return contentPieces?.find((cp: any) => cp.category === category);
  };

  const showLeadMagnets = leadMagnets && leadMagnets.length > 0;
  const showContentGeneration = project?.status === "lead_selected" || project?.status === "completed";

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

      {/* Step 1: Show and select lead magnets */}
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

      {/* Step 2: Generate content by category */}
      {showContentGeneration && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Генерация контента</h2>
          <div className="space-y-3">
            {contentCategories.map(({ key, label, description }) => {
              const existing = getContentForCategory(key);
              const isGenerating = generatingCategory === key;
              const isExpanded = expandedCategories.has(key);

              return (
                <Card key={key}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{label}</CardTitle>
                        {existing && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            Готово
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {existing && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(existing.content)}
                              title="Копировать"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleExpand(key)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant={existing ? "outline" : "default"}
                          onClick={() => generateContentMutation.mutate(key)}
                          disabled={isGenerating || (!!generatingCategory && generatingCategory !== key)}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Генерация...
                            </>
                          ) : existing ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Перегенерировать
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-1 h-3 w-3" />
                              Сгенерировать
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {!existing && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                  </CardHeader>
                  {existing && isExpanded && (
                    <CardContent className="pt-0">
                      <div className="bg-muted/50 rounded-md p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {existing.content}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

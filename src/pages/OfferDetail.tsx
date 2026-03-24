import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";
import { usePromptInfo } from "@/hooks/usePromptInfo";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TopicChoiceDialog } from "@/components/offer/TopicChoiceDialog";

const getStatusLabel = (status: string, contentType?: string): string => {
  if (contentType === "reference_material") {
    const refLabels: Record<string, string> = {
      generating_leads: "Генерация справочного материала",
      leads_ready: "Справочный материал готов",
      lead_selected: "Справочный материал выбран",
    };
    if (refLabels[status]) return refLabels[status];
  }
  if (contentType === "expert_content") {
    const expertLabels: Record<string, string> = {
      generating_leads: "Генерация тем экспертного контента",
      leads_ready: "Темы экспертного контента готовы",
      lead_selected: "Тема экспертного контента выбрана",
    };
    if (expertLabels[status]) return expertLabels[status];
  }
  if (contentType === "provocative_content") {
    const provocativeLabels: Record<string, string> = {
      generating_leads: "Генерация тем провокационного контента",
      leads_ready: "Темы провокационного контента готовы",
      lead_selected: "Тема провокационного контента выбрана",
    };
    if (provocativeLabels[status]) return provocativeLabels[status];
  }
  if (contentType === "list_content") {
    const listLabels: Record<string, string> = {
      generating_leads: "Генерация тем списка",
      leads_ready: "Темы списка готовы",
      lead_selected: "Тема списка выбрана",
    };
    if (listLabels[status]) return listLabels[status];
  }
  if (contentType === "testimonial_content") {
    const testimonialLabels: Record<string, string> = {
      draft: "Выбор кейса",
      generating_leads: "Генерация углов подачи",
      leads_ready: "Углы подачи готовы",
      lead_selected: "Угол подачи выбран",
    };
    if (testimonialLabels[status]) return testimonialLabels[status];
  }
  const defaultLabels: Record<string, string> = {
    draft: "Черновик",
    generating_leads: "Генерация лид-магнитов",
    leads_ready: "Лид-магниты готовы",
    lead_selected: "Лид-магнит выбран",
    generating_content: "Генерация контента",
    completed: "Завершено",
    error: "Ошибка",
  };
  return defaultLabels[status] ?? status;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generating_leads: "bg-warning/20 text-warning",
  leads_ready: "bg-primary/20 text-primary",
  lead_selected: "bg-primary/20 text-primary",
  generating_content: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  error: "bg-destructive/20 text-destructive",
};

const TOPIC_DIALOG_TYPES = ["lead_magnet", "reference_material", "expert_content", "provocative_content", "list_content", "myth_busting"];

export default function OfferDetail() {
  const { programId, offerType, offerId } = useParams();
  const { user } = useAuth();
  const { enqueue } = useTaskQueue();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [topicDialogType, setTopicDialogType] = useState<string | null>(null);

  const { data: offer } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, offer_tags(tag_id, tags(name)), paid_programs(title)")
        .eq("id", offerId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects_by_offer", offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("offer_id", offerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await supabase.from("lead_magnets").delete().eq("project_id", projectId);
      await supabase.from("generation_runs").delete().eq("project_id", projectId);
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects_by_offer", offerId] });
      toast.success("Проект удалён");
      setDeleteId(null);
    },
    onError: (e: Error) => { toast.error(e.message); setDeleteId(null); },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ contentType, userTopic }: { contentType: string; userTopic: string | null }) => {
      setGeneratingType(contentType);
      const labelMap: Record<string, string> = { reference_material: "справочных материалов", expert_content: "тем экспертного контента", provocative_content: "тем провокационного контента", list_content: "тем списка", testimonial_content: "контент-отзыва", myth_busting: "тем разбора мифа", objection_handling: "отработки возражения" };
      const label = labelMap[contentType] || "лид-магнитов";
      const { data: nameData, error: nameError } = await supabase.functions.invoke("generate-project-name", {
        body: { course_title: offer?.title || "", program_title: (offer as any)?.paid_programs?.title || "" },
      });
      if (nameError) throw new Error(nameError.message || "Ошибка генерации названия");
      if (nameData?.error) throw new Error(nameData.error);

      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({ offer_id: offerId!, title: nameData.name, created_by: user!.id, content_type: contentType } as any)
        .select("id")
        .single();
      if (projError) throw projError;

      if (contentType === "testimonial_content" || contentType === "objection_handling") {
        return { projectId: project.id, label };
      }

      const payload: Record<string, any> = { project_id: project.id, content_type: contentType };
      if (userTopic) payload.user_topic = userTopic;

      await enqueue({
        functionName: "generate-lead-magnets",
        payload,
        displayTitle: `Генерация ${label}: ${nameData.name}`,
        lane: "claude",
        targetUrl: `/programs/${programId}/offers/${offerType}/${offerId}/projects/${project.id}`,
      });

      return { projectId: project.id, label };
    },
    onSuccess: ({ projectId, label }) => {
      toast.success(`Генерация ${label} завершена!`);
      setGeneratingType(null);
      queryClient.invalidateQueries({ queryKey: ["projects_by_offer", offerId] });
      navigate(`/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}`);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingType(null);
    },
  });

  const handleGenerateClick = (contentType: string) => {
    if (TOPIC_DIALOG_TYPES.includes(contentType)) {
      setTopicDialogType(contentType);
    } else {
      generateMutation.mutate({ contentType, userTopic: null });
    }
  };

  const handleTopicConfirm = (userTopic: string | null) => {
    if (!topicDialogType) return;
    const ct = topicDialogType;
    setTopicDialogType(null);
    generateMutation.mutate({ contentType: ct, userTopic });
  };

  const typeLabel = getOfferTypeLabel(offerType ?? "");

  const { data: promptInfo } = usePromptInfo({
    category: "lead_magnets",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}/offers/${offerType}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{offer?.title ?? "..."}</h1>
          <p className="text-muted-foreground">{typeLabel} • Проекты</p>
          {(offer as any)?.offer_tags?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {(offer as any).offer_tags.map((ot: any) => (
                <Badge key={ot.tag_id} variant="secondary" className="text-xs">{ot.tags?.name}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      {promptInfo?.[0] && (
        <p className="text-xs text-muted-foreground -mt-4">
          Промпт: «{promptInfo[0].name}» ({typeLabel})
        </p>
      )}


      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : projects?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Нет проектов. Нажмите «Сгенерировать лид-магниты» для начала!</CardContent></Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {projects?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/programs/${programId}/offers/${offerType}/${offerId}/projects/${p.id}`)}
            >
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <div className="font-medium">{p.title}</div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {(p as any).content_type === "reference_material" ? "Справочный материал" : (p as any).content_type === "expert_content" ? "Экспертный контент" : (p as any).content_type === "provocative_content" ? "Провокационный контент" : (p as any).content_type === "list_content" ? "Список" : (p as any).content_type === "testimonial_content" ? "Контент-отзыв" : (p as any).content_type === "myth_busting" ? "Разбор мифа" : (p as any).content_type === "objection_handling" ? "Отработка возражения" : "Лид-магнит"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                <Badge className={statusColors[p.status] ?? ""}>{getStatusLabel(p.status, (p as any).content_type)}</Badge>
                <span>{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button
          onClick={() => handleGenerateClick("lead_magnet")}
          disabled={!!generatingType}
        >
          {generatingType === "lead_magnet" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать лид-магниты
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("reference_material")}
          disabled={!!generatingType}
        >
          {generatingType === "reference_material" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать справочный материал
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("expert_content")}
          disabled={!!generatingType}
        >
          {generatingType === "expert_content" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать экспертный контент
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("provocative_content")}
          disabled={!!generatingType}
        >
          {generatingType === "provocative_content" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать провокационный контент
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("list_content")}
          disabled={!!generatingType}
        >
          {generatingType === "list_content" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать список
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("testimonial_content")}
          disabled={!!generatingType}
        >
          {generatingType === "testimonial_content" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать контент-отзыв
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("myth_busting")}
          disabled={!!generatingType}
        >
          {generatingType === "myth_busting" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать разбор мифа
        </Button>
        <Button
          variant="outline"
          onClick={() => handleGenerateClick("objection_handling")}
          disabled={!!generatingType}
        >
          {generatingType === "objection_handling" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Сгенерировать отработку возражения
        </Button>
      </div>

      <TopicChoiceDialog
        open={!!topicDialogType}
        onOpenChange={(open) => !open && setTopicDialogType(null)}
        contentType={topicDialogType || "lead_magnet"}
        onConfirm={handleTopicConfirm}
        disabled={generateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>Проект и все связанные лид-магниты будут удалены безвозвратно.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  generating_leads: "Генерация лид-магнитов",
  leads_ready: "Лид-магниты готовы",
  lead_selected: "Лид-магнит выбран",
  generating_content: "Генерация контента",
  completed: "Завершено",
  error: "Ошибка",
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

export default function OfferDetail() {
  const { programId, offerType, offerId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    mutationFn: async () => {
      setProgressText("Генерация названия...");
      const programTitle = (offer as any)?.paid_programs?.title || "";
      const { data: nameData, error: nameError } = await supabase.functions.invoke("generate-project-name", {
        body: { course_title: offer!.title, program_title: programTitle },
      });
      if (nameError) throw new Error(nameError.message || "Ошибка генерации названия");
      if (nameData?.error) throw new Error(nameData.error);

      setProgressText("Создание проекта...");
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({ offer_id: offerId!, title: nameData.name, created_by: user!.id })
        .select("id")
        .single();
      if (projError) throw projError;

      setProgressText("Генерация лид-магнитов...");
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-lead-magnets", {
        body: { project_id: project.id },
      });
      if (genError) throw new Error(genError.message || "Ошибка генерации");
      if (genData?.error) throw new Error(genData.error);

      return project.id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects_by_offer", offerId] });
      toast.success("Лид-магниты сгенерированы!");
      setProgressText("");
      navigate(`/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}`);
    },
    onError: (e: Error) => { toast.error(e.message); setProgressText(""); },
  });

  const typeLabel = getOfferTypeLabel(offerType ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}/offers/${offerType}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
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

      <div className="flex justify-end">
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !offer}>
          {generateMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{progressText}</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Сгенерировать лид-магниты</>
          )}
        </Button>
      </div>

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
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.title}</div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                <Badge className={statusColors[p.status] ?? ""}>{statusLabels[p.status] ?? p.status}</Badge>
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

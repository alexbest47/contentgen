import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, Trash2, Loader2, CalendarDays } from "lucide-react";
import AddToContentPlanDialog from "@/components/AddToContentPlanDialog";
import { toast } from "sonner";
import CreatePostCarouselWizard from "@/components/post-carousel/CreatePostCarouselWizard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  lead_magnet: "Лид-магнит",
  reference_material: "Справочный материал",
  expert_content: "Экспертный контент",
  provocative_content: "Провокационный контент",
  list_content: "Список",
  testimonial_content: "Контент-отзыв",
  myth_busting: "Разбор мифа",
  objection_handling: "Отработка возражения",
};

interface Props {
  format: "post" | "carousel";
}

export default function PostCarouselList({ format }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planProject, setPlanProject] = useState<{ id: string; title: string; program_id?: string | null } | null>(null);

  const title = format === "carousel" ? "Создание карусели" : "Создание поста";
  const buttonLabel = format === "carousel" ? "Новая карусель" : "Новый пост";
  const emptyText = format === "carousel"
    ? "Нет каруселей. Создайте первую!"
    : "Нет постов. Создайте первый!";

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects_by_format", format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, content_type, created_at, offer_id, program_id, project_program:paid_programs!projects_program_id_fkey(id, title), offers(id, offer_type, program_id, paid_programs(id, title))")
        .eq("content_format", format)
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
      queryClient.invalidateQueries({ queryKey: ["projects_by_format", format] });
      toast.success("Проект удалён");
      setDeleteId(null);
    },
    onError: (e: Error) => { toast.error(e.message); setDeleteId(null); },
  });

  const getProgramTitle = (p: any) => p.project_program?.title || p.offers?.paid_programs?.title;
  const buildUrl = (p: any) =>
    `/programs/${p.program_id || p.offers?.program_id}/offers/${p.offers?.offer_type}/${p.offer_id}/projects/${p.id}?format=${format}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {format === "carousel" ? "Создавайте карусели для соцсетей" : "Создавайте посты с одиночным изображением"}
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : !projects?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{emptyText}</CardContent></Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {projects.map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(buildUrl(p))}
            >
              <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                <div className="font-medium">{p.title}</div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {CONTENT_TYPE_LABELS[p.content_type] ?? p.content_type}
                </Badge>
                {getProgramTitle(p) && (
                  <span className="text-xs text-muted-foreground">· {getProgramTitle(p)}</span>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                <span>{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                  title="В контент-план"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlanProject({ id: p.id, title: p.title, program_id: p.program_id || p.offers?.program_id });
                    setPlanDialogOpen(true);
                  }}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
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

      <CreatePostCarouselWizard open={wizardOpen} onOpenChange={setWizardOpen} format={format} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>Проект и все связанные данные будут удалены безвозвратно.</AlertDialogDescription>
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

      {planProject && (
        <AddToContentPlanDialog
          open={planDialogOpen}
          onOpenChange={(v) => { setPlanDialogOpen(v); if (!v) setPlanProject(null); }}
          type="social"
          title={planProject.title}
          linkedId={planProject.id}
          programId={planProject.program_id}
          socialType={format}
        />
      )}
    </div>
  );
}

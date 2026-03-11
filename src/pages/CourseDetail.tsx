import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export default function CourseDetail() {
  const { programId, courseId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [progressText, setProgressText] = useState("");

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mini_courses").select("*, paid_programs(title)").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("mini_course_id", courseId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Generate project name
      setProgressText("Генерация названия...");
      const programTitle = (course as any)?.paid_programs?.title || "";
      const { data: nameData, error: nameError } = await supabase.functions.invoke("generate-project-name", {
        body: { course_title: course!.title, program_title: programTitle },
      });
      if (nameError) throw new Error(nameError.message || "Ошибка генерации названия");
      if (nameData?.error) throw new Error(nameData.error);

      // Step 2: Create project
      setProgressText("Создание проекта...");
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({ mini_course_id: courseId!, title: nameData.name, created_by: user!.id })
        .select("id")
        .single();
      if (projError) throw projError;

      // Step 3: Generate lead magnets
      setProgressText("Генерация лид-магнитов...");
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-lead-magnets", {
        body: { project_id: project.id },
      });
      if (genError) throw new Error(genError.message || "Ошибка генерации");
      if (genData?.error) throw new Error(genData.error);

      return project.id;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects", courseId] });
      toast.success("Лид-магниты сгенерированы!");
      setProgressText("");
      navigate(`/programs/${programId}/courses/${courseId}/projects/${projectId}`);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setProgressText("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course?.title ?? "..."}</h1>
          <p className="text-muted-foreground">Проекты мини-курса</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !course}>
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {progressText}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Сгенерировать лид-магниты
            </>
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
              onClick={() => navigate(`/programs/${programId}/courses/${courseId}/projects/${p.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.title}</div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                <Badge className={statusColors[p.status] ?? ""}>{statusLabels[p.status] ?? p.status}</Badge>
                <span>{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

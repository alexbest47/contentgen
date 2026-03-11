import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mini_courses").select("*").eq("id", courseId!).single();
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        mini_course_id: courseId!, title, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", courseId] });
      setOpen(false);
      setTitle("");
      toast.success("Проект создан");
    },
    onError: (e: Error) => toast.error(e.message),
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Создать проект</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый проект</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Название проекта</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название проекта" required />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : projects?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Нет проектов. Создайте первый!</CardContent></Card>
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ChevronRight, Trash2, Loader2, Clapperboard } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  in_progress: "В работе",
  completed: "Готово",
  error: "Ошибка",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export default function VideoProjectList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newProgramId, setNewProgramId] = useState<string>("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["video_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_projects")
        .select("*, paid_programs(id, title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ["paid_programs_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paid_programs")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error("Укажите название");
      const { data, error } = await supabase
        .from("video_projects")
        .insert({
          title: newTitle.trim(),
          program_id: newProgramId || null,
          created_by: user!.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["video_projects"] });
      setCreateOpen(false);
      setNewTitle("");
      setNewProgramId("");
      navigate(`/vertical-content/${data.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete stages first (cascade should handle, but be explicit)
      await supabase.from("video_stages").delete().eq("video_project_id", id);
      const { error } = await supabase.from("video_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video_projects"] });
      toast.success("Проект удалён");
      setDeleteId(null);
    },
    onError: (e: Error) => { toast.error(e.message); setDeleteId(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Вертикальный контент</h1>
          <p className="text-muted-foreground">Создавайте видео из изображений и видео-фрагментов</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новый проект
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : !projects?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clapperboard className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Нет видео-проектов. Создайте первый!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {projects.map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/vertical-content/${p.id}`)}
            >
              <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                <div className="font-medium">{p.title}</div>
                <Badge className={`text-xs ${STATUS_COLORS[p.status] || ""}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </Badge>
                {p.paid_programs?.title && (
                  <span className="text-xs text-muted-foreground">· {p.paid_programs.title}</span>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новый видео-проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Название проекта..."
              />
            </div>
            <div>
              <Label>Программа (необязательно)</Label>
              <Select value={newProgramId || "none"} onValueChange={(v) => setNewProgramId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Без программы" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без программы</SelectItem>
                  {programs?.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id}>{prog.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>Проект и все его этапы будут удалены безвозвратно.</AlertDialogDescription>
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

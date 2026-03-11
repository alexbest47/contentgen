import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ChevronRight, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function ProgramDetail() {
  const { programId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAudienceUrl, setEditAudienceUrl] = useState("");

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["mini_courses", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("mini_courses").select("*").eq("program_id", programId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mini_courses").insert({
        program_id: programId!, title,
        course_description: courseDesc, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mini_courses", programId] });
      setOpen(false);
      setTitle("");
      setCourseDesc("");
      toast.success("Мини-курс создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("paid_programs").update({
        title: editTitle,
        description: editDescription || null,
        audience_doc_url: editAudienceUrl || null,
      }).eq("id", programId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      setEditOpen(false);
      toast.success("Программа обновлена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEditDialog = () => {
    if (program) {
      setEditTitle(program.title);
      setEditDescription(program.description || "");
      setEditAudienceUrl(program.audience_doc_url || "");
      setEditOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/programs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{program?.title ?? "..."}</h1>
          <p className="text-muted-foreground">Мини-курсы программы</p>
          {(program as any)?.audience_doc_url && (
            <p className="text-xs text-muted-foreground mt-1">📄 <a href={(program as any).audience_doc_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google Doc аудитории</a></p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Создать мини-курс</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новый мини-курс</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название мини-курса" required />
              </div>
              <div className="space-y-2">
                <Label>Описание мини-курса</Label>
                <Textarea value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} placeholder="Подробное описание мини-курса..." className="min-h-[120px]" />
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
      ) : courses?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Нет мини-курсов. Создайте первый!</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses?.map((c) => (
            <Card key={c.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/programs/${programId}/courses/${c.id}`)}>
              <CardHeader>
                <CardTitle className="text-lg">{c.title}</CardTitle>
                {(c as any).course_description && <CardDescription className="line-clamp-2">{(c as any).course_description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(c.created_at).toLocaleDateString("ru-RU")}</span>
                <ChevronRight className="h-4 w-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ManagePrograms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audienceDocUrl, setAudienceDocUrl] = useState("");
  const [programDocUrl, setProgramDocUrl] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*, program_tags(tags(id, name))").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleFilterTag = (tagId: string) => {
    setFilterTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredPrograms = programs?.filter((p) => {
    if (filterTagIds.length === 0) return true;
    const programTagIds = ((p as any).program_tags || []).map((pt: any) => pt.tags?.id).filter(Boolean);
    return filterTagIds.some((id) => programTagIds.includes(id));
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: newProgram, error } = await supabase.from("paid_programs").insert({ title, description, audience_doc_url: audienceDocUrl || null, program_doc_url: programDocUrl || null, created_by: user!.id } as any).select().single();
      if (error) throw error;
      if (selectedTagIds.length > 0 && newProgram) {
        const rows = selectedTagIds.map((tag_id) => ({ program_id: (newProgram as any).id, tag_id }));
        const { error: tagErr } = await (supabase.from("program_tags" as any) as any).insert(rows);
        if (tagErr) throw tagErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paid_programs"] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setAudienceDocUrl("");
      setProgramDocUrl("");
      setSelectedTagIds([]);
      toast.success("Программа создана");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Платные программы</h1>
          <p className="text-muted-foreground">Управление образовательными программами</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Создать программу</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая программа</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Психолог-консультант" required />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание программы..." />
              </div>
              <div className="space-y-2">
                <Label>Ссылка на описание аудитории (Google Docs)</Label>
                <Input value={audienceDocUrl} onChange={(e) => setAudienceDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
                <p className="text-xs text-muted-foreground">Вставьте ссылку на Google документ (доступ по ссылке для всех)</p>
              </div>
              <div className="space-y-2">
                <Label>Ссылка на описание программы (Google Docs)</Label>
                <Input value={programDocUrl} onChange={(e) => setProgramDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
              </div>
              <div className="space-y-2">
                <Label>Теги аудитории</Label>
                {allTags && allTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет тегов. Создайте их в разделе «Теги».</p>
                )}
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
      ) : programs?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Нет программ. Создайте первую!</CardContent></Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {programs?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/manage-programs/${p.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.title}</div>
                {p.description && <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>}
                {(p as any).program_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(p as any).program_tags.map((pt: any) => (
                      <Badge key={pt.tags?.id} variant="secondary" className="text-xs py-0 px-1.5">
                        {pt.tags?.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                {(p as any).audience_doc_url && <span>📄</span>}
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

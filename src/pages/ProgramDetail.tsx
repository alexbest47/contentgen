import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Tag } from "lucide-react";
import { toast } from "sonner";
import { OFFER_TYPES } from "@/lib/offerTypes";

export default function ProgramDetail() {
  const { programId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAudienceUrl, setEditAudienceUrl] = useState("");
  const [editProgramDocUrl, setEditProgramDocUrl] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: programTags } = useQuery({
    queryKey: ["program_tags", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_tags" as any)
        .select("tag_id")
        .eq("program_id", programId!);
      if (error) throw error;
      return (data as any[]).map((r: any) => r.tag_id as string);
    },
    enabled: !!programId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("paid_programs").update({
        title: editTitle,
        description: editDescription || null,
        audience_doc_url: editAudienceUrl || null,
        program_doc_url: editProgramDocUrl || null,
      } as any).eq("id", programId!);
      if (error) throw error;

      // Sync tags: delete old, insert new
      await (supabase.from("program_tags" as any) as any).delete().eq("program_id", programId!);
      if (selectedTagIds.length > 0) {
        const rows = selectedTagIds.map((tag_id) => ({ program_id: programId!, tag_id }));
        const { error: tagErr } = await (supabase.from("program_tags" as any) as any).insert(rows);
        if (tagErr) throw tagErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", programId] });
      queryClient.invalidateQueries({ queryKey: ["program_tags", programId] });
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
      setEditProgramDocUrl((program as any).program_doc_url || "");
      setSelectedTagIds(programTags || []);
      setEditOpen(true);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const assignedTagNames = allTags?.filter((t) => programTags?.includes(t.id)).map((t) => t.name) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/programs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{program?.title ?? "..."}</h1>
            <Button variant="ghost" size="icon" onClick={openEditDialog}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">Выберите тип оффера</p>
          <div className="flex flex-wrap gap-x-4">
            {program?.audience_doc_url && (
              <p className="text-xs text-muted-foreground mt-1">
                📄 <a href={program.audience_doc_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google Doc аудитории</a>
              </p>
            )}
            {(program as any)?.program_doc_url && (
              <p className="text-xs text-muted-foreground mt-1">
                📝 <a href={(program as any).program_doc_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google Doc описания программы</a>
              </p>
            )}
          </div>
          {assignedTagNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              {assignedTagNames.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать программу</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label>Ссылка на Google Doc аудитории</Label>
              <Input value={editAudienceUrl} onChange={(e) => setEditAudienceUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
            </div>
            <div className="space-y-2">
              <Label>Ссылка на Google Doc описания программы</Label>
              <Input value={editProgramDocUrl} onChange={(e) => setEditProgramDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
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
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OFFER_TYPES.map((type) => (
          <Card
            key={type.key}
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => navigate(`/programs/${programId}/offers/${type.key}`)}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-lg bg-accent p-3 text-accent-foreground group-hover:bg-primary/10 transition-colors">
                <type.icon className="h-6 w-6" />
              </div>
              <span className="font-medium text-lg">{type.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

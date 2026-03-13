import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ChevronRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";

interface OfferFormProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  docUrl: string;
  setDocUrl: (v: string) => void;
  selectedTags: string[];
  toggleTag: (id: string) => void;
  allTags: { id: string; name: string }[] | undefined;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
}

function OfferForm({ title, setTitle, description, setDescription, docUrl, setDocUrl, selectedTags, toggleTag, allTags, onSubmit, isPending, submitLabel, pendingLabel }: OfferFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Название</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
      </div>
      <div className="space-y-2">
        <Label>Описание</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание..." className="min-h-[100px]" />
      </div>
      <div className="space-y-2">
        <Label>Ссылка на Google Doc</Label>
        <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
      </div>
      <div className="space-y-2">
        <Label>Теги аудитории</Label>
        {allTags && allTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Нет тегов. <a href="/tags" className="underline text-primary">Создать теги</a>
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

export default function OfferTypeDetail() {
  const { programId, offerType } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();


  // Archive dialog state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", programId, offerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, offer_tags(tag_id, tags(id, name))")
        .eq("program_id", programId!)
        .eq("offer_type", offerType! as any)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("offers")
        .update({
          title: editTitle,
          description: editDescription || null,
          doc_url: editDocUrl || null,
        })
        .eq("id", editingId);
      if (error) throw error;

      // Replace tags: delete old, insert new
      await supabase.from("offer_tags").delete().eq("offer_id", editingId);
      if (editSelectedTags.length > 0) {
        const { error: tagErr } = await supabase.from("offer_tags").insert(
          editSelectedTags.map((tag_id) => ({ offer_id: editingId, tag_id }))
        );
        if (tagErr) throw tagErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", programId, offerType] });
      setEditOpen(false);
      setEditingId(null);
      toast.success("Оффер обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("offers")
        .update({ is_archived: true } as any)
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", programId, offerType] });
      setArchiveOpen(false);
      setArchivingId(null);
      toast.success("Оффер перемещён в архив");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openArchive = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivingId(offerId);
    setArchiveOpen(true);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleEditTag = (tagId: string) => {
    setEditSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const openEdit = (offer: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(offer.id);
    setEditTitle(offer.title);
    setEditDescription(offer.description ?? "");
    setEditDocUrl(offer.doc_url ?? "");
    setEditSelectedTags(offer.offer_tags?.map((ot: any) => ot.tag_id) ?? []);
    setEditOpen(true);
  };

  const typeLabel = getOfferTypeLabel(offerType ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{typeLabel}</h1>
          <p className="text-muted-foreground">{program?.title}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Создать оффер</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новый оффер — {typeLabel}</DialogTitle>
            </DialogHeader>
            <OfferForm
              title={title} setTitle={setTitle}
              description={description} setDescription={setDescription}
              docUrl={docUrl} setDocUrl={setDocUrl}
              selectedTags={selectedTags} toggleTag={toggleTag}
              allTags={allTags} isPending={createMutation.isPending}
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              submitLabel="Создать" pendingLabel="Создание..."
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать оффер</DialogTitle>
          </DialogHeader>
          <OfferForm
            title={editTitle} setTitle={setEditTitle}
            description={editDescription} setDescription={setEditDescription}
            docUrl={editDocUrl} setDocUrl={setEditDocUrl}
            selectedTags={editSelectedTags} toggleTag={toggleEditTag}
            allTags={allTags} isPending={updateMutation.isPending}
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
            submitLabel="Сохранить" pendingLabel="Сохранение..."
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : offers?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет офферов. Создайте первый!
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {offers?.map((o: any) => (
            <div
              key={o.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/programs/${programId}/offers/${offerType}/${o.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{o.title}</div>
                {o.offer_tags?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {o.offer_tags.map((ot: any) => (
                      <Badge key={ot.tag_id} variant="secondary" className="text-xs">
                        {ot.tags?.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                <span>{new Date(o.created_at).toLocaleDateString("ru-RU")}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEdit(o, e)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => openArchive(o.id, e)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Archive confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Переместить в архив?</AlertDialogTitle>
            <AlertDialogDescription>
              Оффер будет перемещён в архив. Вы сможете восстановить его позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archivingId && archiveMutation.mutate(archivingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              В архив
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getOfferTypeLabel, CONTENT_OFFER_KEYS, type OfferTypeKey } from "@/lib/offerTypes";
import { ImageUploadField } from "@/components/offer/ImageUploadField";
import { uploadOfferImage } from "@/lib/uploadOfferImage";

export default function OfferTypeManagement() {
  const { offerType } = useParams<{ offerType: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isContentType = CONTENT_OFFER_KEYS.includes(offerType as OfferTypeKey);
  const typeLabel = getOfferTypeLabel(offerType ?? "");

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDocUrl, setCreateDocUrl] = useState("");
  const [createProgramId, setCreateProgramId] = useState("");
  const [createSelectedTags, setCreateSelectedTags] = useState<string[]>([]);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editExistingImageUrl, setEditExistingImageUrl] = useState<string | null>(null);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const { data: programs } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers_by_type", offerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, offer_tags(tag_id, tags(id, name)), paid_programs!offers_program_id_fkey(title)")
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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!createProgramId) throw new Error("Выберите программу");
      if (isContentType) {
        if (!createDescription.trim()) throw new Error("Укажите описание");
        if (!createImageFile) throw new Error("Загрузите изображение");
      }

      let imageUrl: string | null = null;
      if (createImageFile && user) {
        imageUrl = await uploadOfferImage(createImageFile, user.id);
      }

      const { data, error } = await supabase
        .from("offers")
        .insert({
          title: createTitle,
          description: isContentType ? createDescription : null,
          doc_url: createDocUrl || null,
          offer_type: offerType! as any,
          program_id: createProgramId,
          created_by: user!.id,
          image_url: imageUrl,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      if (createSelectedTags.length > 0) {
        const { error: tagErr } = await supabase.from("offer_tags").insert(
          createSelectedTags.map((tag_id) => ({ offer_id: data.id, tag_id }))
        );
        if (tagErr) throw tagErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers_by_type", offerType] });
      setCreateOpen(false);
      resetCreateForm();
      toast.success("Оффер создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      if (isContentType) {
        if (!editDescription.trim()) throw new Error("Укажите описание");
        if (!editImageFile && !editExistingImageUrl) throw new Error("Загрузите изображение");
      }

      let imageUrl = editExistingImageUrl;
      if (editImageFile && user) {
        imageUrl = await uploadOfferImage(editImageFile, user.id);
      }

      const { error } = await supabase
        .from("offers")
        .update({
          title: editTitle,
          description: isContentType ? editDescription : undefined,
          doc_url: editDocUrl || null,
          image_url: imageUrl,
        } as any)
        .eq("id", editingId);
      if (error) throw error;

      await supabase.from("offer_tags").delete().eq("offer_id", editingId);
      if (editSelectedTags.length > 0) {
        const { error: tagErr } = await supabase.from("offer_tags").insert(
          editSelectedTags.map((tag_id) => ({ offer_id: editingId, tag_id }))
        );
        if (tagErr) throw tagErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers_by_type", offerType] });
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
      queryClient.invalidateQueries({ queryKey: ["offers_by_type", offerType] });
      setArchiveOpen(false);
      setArchivingId(null);
      toast.success("Оффер перемещён в архив");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function resetCreateForm() {
    setCreateTitle("");
    setCreateDescription("");
    setCreateDocUrl("");
    setCreateProgramId("");
    setCreateSelectedTags([]);
    setCreateImageFile(null);
  }

  const toggleCreateTag = (tagId: string) => {
    setCreateSelectedTags((prev) =>
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
    setEditImageFile(null);
    setEditExistingImageUrl(offer.image_url ?? null);
    setEditOpen(true);
  };

  const openArchive = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivingId(offerId);
    setArchiveOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{typeLabel}</h1>
          <p className="text-muted-foreground">Управление офферами типа «{typeLabel.toLowerCase()}»</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый оффер — {typeLabel}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Программа *</Label>
              <Select value={createProgramId} onValueChange={setCreateProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите программу" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="Название оффера" required />
            </div>
            {isContentType && (
              <>
                <div className="space-y-2">
                  <Label>Описание *</Label>
                  <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Описание оффера" required />
                </div>
                <ImageUploadField imageFile={createImageFile} setImageFile={setCreateImageFile} />
              </>
            )}
            <div className="space-y-2">
              <Label>Ссылка на Google Doc</Label>
              <Input value={createDocUrl} onChange={(e) => setCreateDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
            </div>
            <div className="space-y-2">
              <Label>Теги аудитории</Label>
              {allTags && allTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge key={tag.id} variant={createSelectedTags.includes(tag.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleCreateTag(tag.id)}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет тегов.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать оффер</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            {isContentType && (
              <>
                <div className="space-y-2">
                  <Label>Описание *</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required />
                </div>
                <ImageUploadField imageFile={editImageFile} setImageFile={setEditImageFile} existingUrl={editExistingImageUrl} />
              </>
            )}
            <div className="space-y-2">
              <Label>Ссылка на Google Doc</Label>
              <Input value={editDocUrl} onChange={(e) => setEditDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
            </div>
            <div className="space-y-2">
              <Label>Теги аудитории</Label>
              {allTags && allTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge key={tag.id} variant={editSelectedTags.includes(tag.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleEditTag(tag.id)}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет тегов.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !offers?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет офферов типа «{typeLabel.toLowerCase()}».
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Программа</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      {(o as any).paid_programs?.title || "—"}
                    </TableCell>
                    <TableCell>{o.title}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/programs/${o.program_id}/offers/${offerType}/${o.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Открыть
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openEdit(o, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => openArchive(o.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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

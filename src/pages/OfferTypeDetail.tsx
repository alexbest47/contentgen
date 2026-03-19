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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronRight, ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";
import { usePromptInfo } from "@/hooks/usePromptInfo";
import { ImageUploadField } from "@/components/offer/ImageUploadField";
import { uploadOfferImage } from "@/lib/uploadOfferImage";

const CONTENT_OFFER_TYPES = ["mini_course", "webinar", "download_pdf"];

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
  showMediaFields: boolean;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  existingImageUrl?: string | null;
}

function OfferForm({
  title, setTitle, description, setDescription,
  docUrl, setDocUrl, selectedTags, toggleTag, allTags,
  onSubmit, isPending, submitLabel, pendingLabel,
  showMediaFields, imageFile, setImageFile, existingImageUrl,
}: OfferFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Название</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
      </div>

      {showMediaFields && (
        <>
          <div className="space-y-2">
            <Label>Описание *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание оффера"
              required
            />
          </div>
          <ImageUploadField
            imageFile={imageFile}
            setImageFile={setImageFile}
            existingUrl={existingImageUrl}
          />
        </>
      )}

      <div className="space-y-2">
        <Label>Ссылка на Google Doc</Label>
        <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." required />
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

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  generating: "Генерация...",
  quiz_generated: "Тест сгенерирован",
  generating_images: "Генерация изображений...",
  ready: "Готово",
  error: "Ошибка",
};

const statusVariant = (s: string) => {
  if (s === "ready") return "default" as const;
  if (s === "error") return "destructive" as const;
  return "secondary" as const;
};

export default function OfferTypeDetail() {
  const { programId, offerType } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isDiagnosticType = offerType === "diagnostic";
  const isContentType = CONTENT_OFFER_TYPES.includes(offerType ?? "");

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDocUrl, setCreateDocUrl] = useState("");
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

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: diagnosticItems, isLoading: isDiagnosticsLoading } = useQuery({
    queryKey: ["diagnostics_for_program", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, status, created_at, description, offer_id")
        .eq("program_id", programId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isDiagnosticType,
  });

  const { data: offers, isLoading: isOffersLoading } = useQuery({
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
    enabled: !isDiagnosticType,
  });

  const isLoading = isDiagnosticType ? isDiagnosticsLoading : isOffersLoading;

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
          program_id: programId!,
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
      queryClient.invalidateQueries({ queryKey: ["offers", programId, offerType] });
      setCreateOpen(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateDocUrl("");
      setCreateSelectedTags([]);
      setCreateImageFile(null);
      toast.success("Оффер создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCreateTag = (tagId: string) => {
    setCreateSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

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
      queryClient.invalidateQueries({ queryKey: ["offers", programId, offerType] });
      setEditOpen(false);
      setEditingId(null);
      setEditImageFile(null);
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

  const deleteDiagnosticMutation = useMutation({
    mutationFn: async ({ diagId, offerId }: { diagId: string; offerId: string | null }) => {
      const { error } = await supabase.from("diagnostics").delete().eq("id", diagId);
      if (error) throw error;
      if (offerId) {
        await supabase.from("offers").delete().eq("id", offerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics_for_program", programId] });
      setArchiveOpen(false);
      setArchivingId(null);
      toast.success("Диагностика удалена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openArchive = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivingId(offerId);
    setArchiveOpen(true);
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

  const typeLabel = getOfferTypeLabel(offerType ?? "");

  const { data: leadPromptInfo } = usePromptInfo({
    category: "lead_magnets",
    enabled: !isDiagnosticType,
  });

  const archivingDiagnostic = isDiagnosticType
    ? diagnosticItems?.find((d) => d.id === archivingId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{typeLabel}</h1>
          <p className="text-muted-foreground">{program?.title}</p>
          {!isDiagnosticType && leadPromptInfo?.[0] && (
            <p className="text-xs text-muted-foreground">
              Промпт лид-магнитов: «{leadPromptInfo[0].name}» ({typeLabel})
            </p>
          )}
        </div>
        {!isDiagnosticType && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить {getOfferTypeLabel(offerType ?? "").toLowerCase()}
          </Button>
        )}
      </div>

      {!isDiagnosticType && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новый оффер</DialogTitle>
            </DialogHeader>
            <OfferForm
              title={createTitle} setTitle={setCreateTitle}
              description={createDescription} setDescription={setCreateDescription}
              docUrl={createDocUrl} setDocUrl={setCreateDocUrl}
              selectedTags={createSelectedTags} toggleTag={toggleCreateTag}
              allTags={allTags} isPending={createMutation.isPending}
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              submitLabel="Создать" pendingLabel="Создание..."
              showMediaFields={isContentType}
              imageFile={createImageFile} setImageFile={setCreateImageFile}
            />
          </DialogContent>
        </Dialog>
      )}

      {!isDiagnosticType && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              showMediaFields={isContentType}
              imageFile={editImageFile} setImageFile={setEditImageFile}
              existingImageUrl={editExistingImageUrl}
            />
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : isDiagnosticType ? (
        !diagnosticItems?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет диагностик. Создайте первую!
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg divide-y">
            {diagnosticItems.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (d.offer_id) {
                    navigate(`/programs/${programId}/offers/diagnostic/${d.offer_id}`);
                  } else {
                    toast.error("У этой диагностики нет привязанного оффера");
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{d.name}</div>
                  {d.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{d.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                  <Badge variant={statusVariant(d.status)}>
                    {statusLabels[d.status] || d.status}
                  </Badge>
                  <span>{new Date(d.created_at).toLocaleDateString("ru-RU")}</span>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => openArchive(d.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        offers?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет офферов.
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
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {o.image_url && (
                    <img src={o.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
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
        )
      )}

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDiagnosticType ? "Удалить диагностику?" : "Переместить в архив?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDiagnosticType
                ? "Это действие нельзя отменить. Диагностика будет удалена навсегда."
                : "Оффер будет перемещён в архив. Вы сможете восстановить его позже."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!archivingId) return;
                if (isDiagnosticType) {
                  deleteDiagnosticMutation.mutate({
                    diagId: archivingId,
                    offerId: archivingDiagnostic?.offer_id ?? null,
                  });
                } else {
                  archiveMutation.mutate(archivingId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDiagnosticType ? "Удалить" : "В архив"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronRight, ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";
import { usePromptInfo } from "@/hooks/usePromptInfo";

interface OfferFormProps {
  title: string;
  setTitle: (v: string) => void;
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

function OfferForm({ title, setTitle, docUrl, setDocUrl, selectedTags, toggleTag, allTags, onSubmit, isPending, submitLabel, pendingLabel }: OfferFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Название</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
      </div>
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

  // Archive dialog state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  // Generation state
  const [generatingOfferId, setGeneratingOfferId] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  
  const [createDocUrl, setCreateDocUrl] = useState("");
  const [createSelectedTags, setCreateSelectedTags] = useState<string[]>([]);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
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

  // Diagnostics query (used when offerType === "diagnostic")
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

  // Offers query (used for all other offer types)
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
      const { data, error } = await supabase
        .from("offers")
        .insert({
          title: createTitle,
          description: null,
          doc_url: createDocUrl || null,
          offer_type: offerType! as any,
          program_id: programId!,
          created_by: user!.id,
        })
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
      
      setCreateDocUrl("");
      setCreateSelectedTags([]);
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
      const { error } = await supabase
        .from("offers")
        .update({
          title: editTitle,
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

  // Delete diagnostic mutation (also cleans up linked offer)
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

  const generateMutation = useMutation({
    mutationFn: async ({ offerId, contentType = "lead_magnet" }: { offerId: string; contentType?: string }) => {
      setGeneratingOfferId(offerId);
      const offer = offers?.find((o: any) => o.id === offerId);
      if (!offer) throw new Error("Оффер не найден");

      setProgressText("Генерация названия...");
      const { data: nameData, error: nameError } = await supabase.functions.invoke("generate-project-name", {
        body: { course_title: offer.title, program_title: program?.title || "" },
      });
      if (nameError) throw new Error(nameError.message || "Ошибка генерации названия");
      if (nameData?.error) throw new Error(nameData.error);

      setProgressText("Создание проекта...");
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({ offer_id: offerId, title: nameData.name, created_by: user!.id, content_type: contentType } as any)
        .select("id")
        .single();
      if (projError) throw projError;

      const label = contentType === "reference_material" ? "справочных материалов" : "лид-магнитов";
      setProgressText(`Генерация ${label}...`);
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-lead-magnets", {
        body: { project_id: project.id, content_type: contentType },
      });
      if (genError) throw new Error(genError.message || "Ошибка генерации");
      if (genData?.error) throw new Error(genData.error);

      return { offerId, projectId: project.id };
    },
    onSuccess: ({ offerId: oId, projectId }) => {
      toast.success("Генерация завершена!");
      setGeneratingOfferId(null);
      setProgressText("");
      navigate(`/programs/${programId}/offers/${offerType}/${oId}/projects/${projectId}`);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingOfferId(null);
      setProgressText("");
    },
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
    
    setEditDocUrl(offer.doc_url ?? "");
    setEditSelectedTags(offer.offer_tags?.map((ot: any) => ot.tag_id) ?? []);
    setEditOpen(true);
  };

  const typeLabel = getOfferTypeLabel(offerType ?? "");

  const { data: leadPromptInfo } = usePromptInfo({
    category: "lead_magnets",
    enabled: !isDiagnosticType,
  });

  // Find diagnostic by archivingId for deletion
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

      {/* Create dialog (non-diagnostic only) */}
      {!isDiagnosticType && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новый оффер</DialogTitle>
            </DialogHeader>
            <OfferForm
              title={createTitle} setTitle={setCreateTitle}
              docUrl={createDocUrl} setDocUrl={setCreateDocUrl}
              selectedTags={createSelectedTags} toggleTag={toggleCreateTag}
              allTags={allTags} isPending={createMutation.isPending}
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              submitLabel="Создать" pendingLabel="Создание..."
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit dialog (non-diagnostic only) */}
      {!isDiagnosticType && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать оффер</DialogTitle>
            </DialogHeader>
            <OfferForm
              title={editTitle} setTitle={setEditTitle}
              docUrl={editDocUrl} setDocUrl={setEditDocUrl}
              selectedTags={editSelectedTags} toggleTag={toggleEditTag}
              allTags={allTags} isPending={updateMutation.isPending}
              onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
              submitLabel="Сохранить" pendingLabel="Сохранение..."
            />
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : isDiagnosticType ? (
        /* Diagnostic items list */
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
        /* Regular offers list */
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
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); generateMutation.mutate({ offerId: o.id, contentType: "lead_magnet" }); }}
                    disabled={generatingOfferId === o.id}
                    title="Сгенерировать лид-магниты"
                  >
                    {generatingOfferId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-accent-foreground hover:text-accent-foreground"
                    onClick={(e) => { e.stopPropagation(); generateMutation.mutate({ offerId: o.id, contentType: "reference_material" }); }}
                    disabled={generatingOfferId === o.id}
                    title="Сгенерировать справочный материал"
                  >
                    {generatingOfferId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs font-bold">СМ</span>}
                  </Button>
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

      {/* Archive/Delete confirmation */}
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

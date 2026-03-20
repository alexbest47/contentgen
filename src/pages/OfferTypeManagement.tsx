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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Eye, Pencil, Trash2, Plus, Loader2, CalendarIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getOfferTypeLabel, CONTENT_OFFER_KEYS, type OfferTypeKey } from "@/lib/offerTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadField } from "@/components/offer/ImageUploadField";
import { uploadOfferImage } from "@/lib/uploadOfferImage";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function OfferTypeManagement() {
  const { offerType } = useParams<{ offerType: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isContentType = CONTENT_OFFER_KEYS.includes(offerType as OfferTypeKey);
  const isDiscount = offerType === "discount";
  const isSpotAvailable = offerType === "spot_available";
  const isNewStream = offerType === "new_stream";
  const isWebinar = offerType === "webinar";
  const typeLabel = getOfferTypeLabel(offerType ?? "");

  // --- Create state ---
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDocUrl, setCreateDocUrl] = useState("");
  const [createProgramId, setCreateProgramId] = useState("");
  const [createSelectedTags, setCreateSelectedTags] = useState<string[]>([]);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createPromoCode, setCreatePromoCode] = useState("");
  const [createExpiresAt, setCreateExpiresAt] = useState<Date | undefined>();
  const [createStreamStartDate, setCreateStreamStartDate] = useState<Date | undefined>();
  const [createWebinarDate, setCreateWebinarDate] = useState<Date | undefined>();
  
  const [createIsAutowebinar, setCreateIsAutowebinar] = useState(false);
  const [createLandingUrl, setCreateLandingUrl] = useState("");

  // --- Edit state ---
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editExistingImageUrl, setEditExistingImageUrl] = useState<string | null>(null);
  const [editPromoCode, setEditPromoCode] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState<Date | undefined>();
  const [editStreamStartDate, setEditStreamStartDate] = useState<Date | undefined>();
  const [editWebinarDate, setEditWebinarDate] = useState<Date | undefined>();
  
  const [editIsAutowebinar, setEditIsAutowebinar] = useState(false);
  const [editLandingUrl, setEditLandingUrl] = useState("");

  // --- Archive state ---
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
    enabled: !isDiscount && !isSpotAvailable && !isNewStream,
  });

  // --- Create mutation ---
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!createProgramId) throw new Error("Выберите программу");

      if (isDiscount) {
        if (!createDescription.trim()) throw new Error("Укажите описание");
        if (!createPromoCode.trim()) throw new Error("Укажите промо-код");
        if (!createExpiresAt) throw new Error("Укажите дату истечения");
      }

      if (isSpotAvailable) {
        if (!createTitle.trim()) throw new Error("Укажите название");
      }

      if (isNewStream) {
        if (!createTitle.trim()) throw new Error("Укажите название");
        if (!createStreamStartDate) throw new Error("Укажите дату старта потока");
      }

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
          title: isDiscount ? createDescription.slice(0, 100) : createTitle,
          description: (isContentType || isDiscount) ? createDescription : null,
          doc_url: (isDiscount || isSpotAvailable || isNewStream) ? null : (createDocUrl || null),
          offer_type: offerType! as any,
          program_id: createProgramId,
          created_by: user!.id,
          image_url: imageUrl,
          promo_code: isDiscount ? createPromoCode : null,
          expires_at: isDiscount && createExpiresAt ? format(createExpiresAt, "yyyy-MM-dd") : null,
          stream_start_date: isNewStream && createStreamStartDate ? format(createStreamStartDate, "yyyy-MM-dd") : null,
          webinar_date: isWebinar && !createIsAutowebinar && createWebinarDate ? createWebinarDate.toISOString() : null,
          is_autowebinar: isWebinar ? createIsAutowebinar : false,
          landing_url: createLandingUrl || null,
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      if (!isDiscount && !isSpotAvailable && !isNewStream && createSelectedTags.length > 0) {
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

  // --- Update mutation ---
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;

      if (isDiscount) {
        if (!editDescription.trim()) throw new Error("Укажите описание");
        if (!editPromoCode.trim()) throw new Error("Укажите промо-код");
        if (!editExpiresAt) throw new Error("Укажите дату истечения");
      }

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
          title: isDiscount ? editDescription.slice(0, 100) : editTitle,
          description: (isContentType || isDiscount) ? editDescription : undefined,
          doc_url: (isDiscount || isSpotAvailable || isNewStream) ? undefined : (editDocUrl || null),
          image_url: imageUrl,
          promo_code: isDiscount ? editPromoCode : undefined,
          expires_at: isDiscount && editExpiresAt ? format(editExpiresAt, "yyyy-MM-dd") : undefined,
          stream_start_date: isNewStream && editStreamStartDate ? format(editStreamStartDate, "yyyy-MM-dd") : undefined,
          webinar_date: isWebinar && editWebinarDate ? editWebinarDate.toISOString() : isWebinar ? null : undefined,
          is_date_confirmed: isWebinar ? editIsDateConfirmed : undefined,
          is_autowebinar: isWebinar ? editIsAutowebinar : undefined,
          landing_url: editLandingUrl || null,
        } as any)
        .eq("id", editingId);
      if (error) throw error;

      if (!isDiscount && !isSpotAvailable && !isNewStream) {
        await supabase.from("offer_tags").delete().eq("offer_id", editingId);
        if (editSelectedTags.length > 0) {
          const { error: tagErr } = await supabase.from("offer_tags").insert(
            editSelectedTags.map((tag_id) => ({ offer_id: editingId, tag_id }))
          );
          if (tagErr) throw tagErr;
        }
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

  // --- Archive mutation ---
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
    setCreatePromoCode("");
    setCreateExpiresAt(undefined);
    setCreateStreamStartDate(undefined);
    setCreateWebinarDate(undefined);
    setCreateIsDateConfirmed(false);
    setCreateIsAutowebinar(false);
    setCreateLandingUrl("");
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
    setEditPromoCode((offer as any).promo_code ?? "");
    setEditExpiresAt((offer as any).expires_at ? new Date((offer as any).expires_at) : undefined);
    setEditStreamStartDate((offer as any).stream_start_date ? new Date((offer as any).stream_start_date) : undefined);
    setEditWebinarDate((offer as any).webinar_date ? new Date((offer as any).webinar_date) : undefined);
    setEditIsDateConfirmed((offer as any).is_date_confirmed ?? false);
    setEditIsAutowebinar((offer as any).is_autowebinar ?? false);
    setEditLandingUrl((offer as any).landing_url ?? "");
    setEditOpen(true);
  };

  const openArchive = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivingId(offerId);
    setArchiveOpen(true);
  };

  // --- Render discount create/edit form fields ---
  const renderDiscountFields = (mode: "create" | "edit") => {
    const desc = mode === "create" ? createDescription : editDescription;
    const setDesc = mode === "create" ? setCreateDescription : setEditDescription;
    const code = mode === "create" ? createPromoCode : editPromoCode;
    const setCode = mode === "create" ? setCreatePromoCode : setEditPromoCode;
    const expiresAt = mode === "create" ? createExpiresAt : editExpiresAt;
    const setExpiresAt = mode === "create" ? setCreateExpiresAt : setEditExpiresAt;

    return (
      <>
        <div className="space-y-2">
          <Label>Описание промо-кода *</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Краткое описание промо-кода" required />
        </div>
        <div className="space-y-2">
          <Label>Промо-код *</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SPRING2025" required />
        </div>
        <div className="space-y-2">
          <Label>Дата истечения *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !expiresAt && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiresAt ? format(expiresAt, "dd.MM.yyyy") : "Выберите дату"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAt}
                onSelect={setExpiresAt}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </>
    );
  };

  // --- Render spot_available create/edit form fields ---
  const renderSpotAvailableFields = (mode: "create" | "edit") => {
    const title = mode === "create" ? createTitle : editTitle;
    const setTitle = mode === "create" ? setCreateTitle : setEditTitle;
    return (
      <div className="space-y-2">
        <Label>Название *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
      </div>
    );
  };

  // --- Render new_stream create/edit form fields ---
  const renderNewStreamFields = (mode: "create" | "edit") => {
    const title = mode === "create" ? createTitle : editTitle;
    const setTitle = mode === "create" ? setCreateTitle : setEditTitle;
    const streamDate = mode === "create" ? createStreamStartDate : editStreamStartDate;
    const setStreamDate = mode === "create" ? setCreateStreamStartDate : setEditStreamStartDate;
    return (
      <>
        <div className="space-y-2">
          <Label>Название *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
        </div>
        <div className="space-y-2">
          <Label>Дата старта потока *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !streamDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {streamDate ? format(streamDate, "dd.MM.yyyy") : "Выберите дату"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={streamDate}
                onSelect={setStreamDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </>
    );
  };

  // --- Render default (non-discount) create/edit form fields ---
  const renderDefaultFields = (mode: "create" | "edit") => {
    const title = mode === "create" ? createTitle : editTitle;
    const setTitle = mode === "create" ? setCreateTitle : setEditTitle;
    const desc = mode === "create" ? createDescription : editDescription;
    const setDesc = mode === "create" ? setCreateDescription : setEditDescription;
    const docUrl = mode === "create" ? createDocUrl : editDocUrl;
    const setDocUrl = mode === "create" ? setCreateDocUrl : setEditDocUrl;
    const selectedTags = mode === "create" ? createSelectedTags : editSelectedTags;
    const toggleTag = mode === "create" ? toggleCreateTag : toggleEditTag;
    const imageFile = mode === "create" ? createImageFile : editImageFile;
    const setImageFile = mode === "create" ? setCreateImageFile : setEditImageFile;
    const landingUrl = mode === "create" ? createLandingUrl : editLandingUrl;
    const setLandingUrl = mode === "create" ? setCreateLandingUrl : setEditLandingUrl;
    const webinarDate = mode === "create" ? createWebinarDate : editWebinarDate;
    const setWebinarDate = mode === "create" ? setCreateWebinarDate : setEditWebinarDate;
    const isDateConfirmed = mode === "create" ? createIsDateConfirmed : editIsDateConfirmed;
    const setIsDateConfirmed = mode === "create" ? setCreateIsDateConfirmed : setEditIsDateConfirmed;
    const isAutowebinar = mode === "create" ? createIsAutowebinar : editIsAutowebinar;
    const setIsAutowebinar = mode === "create" ? setCreateIsAutowebinar : setEditIsAutowebinar;

    return (
      <>
        <div className="space-y-2">
          <Label>Название *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
        </div>
        {isContentType && (
          <>
            <div className="space-y-2">
              <Label>Описание *</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Описание оффера" required />
            </div>
            <ImageUploadField
              imageFile={imageFile}
              setImageFile={setImageFile}
              existingUrl={mode === "edit" ? editExistingImageUrl : undefined}
            />
          </>
        )}
        {isWebinar && (
          <>
            <div className="space-y-2">
              <Label>Дата проведения</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !webinarDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {webinarDate ? format(webinarDate, "dd.MM.yyyy") : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={webinarDate}
                    onSelect={setWebinarDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`date-confirmed-${mode}`}
                checked={isDateConfirmed}
                onCheckedChange={(v) => setIsDateConfirmed(!!v)}
              />
              <Label htmlFor={`date-confirmed-${mode}`}>Дата и время подтверждены</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`autowebinar-${mode}`}
                checked={isAutowebinar}
                onCheckedChange={(v) => setIsAutowebinar(!!v)}
              />
              <Label htmlFor={`autowebinar-${mode}`}>Автовебинар</Label>
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label>Ссылка на лендинг</Label>
          <Input value={landingUrl} onChange={(e) => setLandingUrl(e.target.value)} placeholder="https://example.com/landing" />
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
                <Badge key={tag.id} variant={selectedTags.includes(tag.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(tag.id)}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Нет тегов.</p>
          )}
        </div>
      </>
    );
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
            {isDiscount ? renderDiscountFields("create") : isSpotAvailable ? renderSpotAvailableFields("create") : isNewStream ? renderNewStreamFields("create") : renderDefaultFields("create")}
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
            {isDiscount ? renderDiscountFields("edit") : isSpotAvailable ? renderSpotAvailableFields("edit") : isNewStream ? renderNewStreamFields("edit") : renderDefaultFields("edit")}
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
                  {isDiscount ? (
                    <>
                      <TableHead>Описание</TableHead>
                      <TableHead>Промо-код</TableHead>
                      <TableHead>Истекает</TableHead>
                    </>
                  ) : isNewStream ? (
                    <>
                      <TableHead>Название</TableHead>
                      <TableHead>Дата старта</TableHead>
                    </>
                  ) : (
                    <TableHead>Название</TableHead>
                  )}
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      {(o as any).paid_programs?.title || "—"}
                    </TableCell>
                    {isDiscount ? (
                      <>
                        <TableCell>{o.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">{o.promo_code || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          {o.expires_at ? format(new Date(o.expires_at), "dd.MM.yyyy") : "—"}
                        </TableCell>
                      </>
                    ) : isNewStream ? (
                      <>
                        <TableCell>{o.title}</TableCell>
                        <TableCell>
                          {(o as any).stream_start_date ? format(new Date((o as any).stream_start_date), "dd.MM.yyyy") : "—"}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell>{o.title}</TableCell>
                    )}
                    <TableCell className="text-right space-x-1">
                      {!isDiscount && !isSpotAvailable && !isNewStream && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/programs/${o.program_id}/offers/${offerType}/${o.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Открыть
                        </Button>
                      )}
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

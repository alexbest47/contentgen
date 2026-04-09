import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { OFFER_TYPES, getOfferTypeLabel } from "@/lib/offerTypes";
import TopicTreePicker, { TopicTreeSelection } from "@/components/TopicTreePicker";
import CasePickerDialog from "@/components/email-builder/CasePickerDialog";
import ObjectionPicker from "@/components/ObjectionPicker";

const CONTENT_TYPES: { key: string; label: string }[] = [
  { key: "from_scratch", label: "С нуля по описанию" },
  { key: "trust_ai", label: "Доверимся ИИ" },
  { key: "webinar_invite", label: "Приглашение на вебинар" },
  { key: "webinar_invite_2", label: "Приглашение на вебинар — Письмо 2" },
  { key: "direct_offer", label: "Прямой оффер" },
  { key: "multi_offer", label: "Мультиоффер (только карусель)" },
  { key: "transformation_story", label: "История трансформации (только карусель)" },
  { key: "lead_magnet", label: "Лид-магнит" },
  { key: "reference_material", label: "Справочный материал" },
  { key: "expert_content", label: "Экспертный контент" },
  { key: "provocative_content", label: "Провокационный контент" },
  { key: "list_content", label: "Список" },
  { key: "testimonial_content", label: "Контент-отзыв" },
  { key: "myth_busting", label: "Разбор мифа" },
  { key: "objection_handling", label: "Отработка возражения" },
];

const TOPIC_DIALOG_TYPES = ["lead_magnet", "reference_material", "expert_content", "provocative_content", "list_content", "myth_busting"];

const TYPE_LABEL_GENITIVE: Record<string, string> = {
  lead_magnet: "лид-магнитов",
  reference_material: "справочного материала",
  expert_content: "тем экспертного контента",
  provocative_content: "тем провокационного контента",
  list_content: "тем списка",
  testimonial_content: "контент-отзыва",
  myth_busting: "тем разбора мифа",
  objection_handling: "отработки возражения",
};

const AUDIENCE_SEGMENTS = [
  { key: "audience_from_scratch_personal", label: "С нуля — для себя" },
  { key: "audience_from_scratch_career", label: "С нуля — новая профессия" },
  { key: "audience_from_scratch_both", label: "С нуля — для себя и, возможно, профессия" },
  { key: "audience_with_diploma", label: "Есть образование — повышение квалификации" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: "post" | "carousel";
}

export default function CreatePostCarouselWizard({ open, onOpenChange, format }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueue } = useTaskQueue();

  const [step, setStep] = useState<1 | 2>(1);
  const [programId, setProgramId] = useState<string>("");
  const [offerType, setOfferType] = useState<string>("");
  const [offerId, setOfferId] = useState<string>("");
  const [contentType, setContentType] = useState<string>("lead_magnet");
  const [topicMode, setTopicMode] = useState<"auto" | "manual" | "tree">("auto");
  const [topic, setTopic] = useState<string>("");
  const [treeTopic, setTreeTopic] = useState<TopicTreeSelection | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [objectionIds, setObjectionIds] = useState<string[]>([]);
  const [audienceSegment, setAudienceSegment] = useState<string | null>(null);
  const [topicDescription, setTopicDescription] = useState<string>("");
  const [slideCount, setSlideCount] = useState<number>(7);
  const [extraOffers, setExtraOffers] = useState<{ offerType: string; offerId: string }[]>([]);
  const [letterThemeTitle, setLetterThemeTitle] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setProgramId("");
      setOfferType("");
      setOfferId("");
      setContentType("lead_magnet");
      setTopicMode("auto");
      setTopic("");
      setTreeTopic(null);
      setCaseId(null);
      setCasePickerOpen(false);
      setObjectionIds([]);
      setAudienceSegment(null);
      setTopicDescription("");
      setSlideCount(7);
      setExtraOffers([]);
      setLetterThemeTitle("");
      setCreating(false);
    }
  }, [open]);

  const { data: programs } = useQuery({
    queryKey: ["wizard_programs"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title").order("title");
      return data ?? [];
    },
    enabled: open,
  });

  const { data: offers } = useQuery({
    queryKey: ["wizard_offers", programId, offerType],
    queryFn: async () => {
      let q = supabase
        .from("offers")
        .select("id, title")
        .eq("offer_type", offerType as any)
        .eq("is_archived", false);
      if (offerType !== "spot_available") {
        q = q.eq("program_id", programId);
      }
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: open && !!programId && !!offerType,
  });

  const canGoNext = !!programId && !!offerType && !!offerId;
  const isTestimonialFlow = contentType === "testimonial_content";
  const isObjectionFlow = contentType === "objection_handling";
  const isFromScratchFlow = contentType === "from_scratch";
  const isTrustAiFlow = contentType === "trust_ai";
  const isWebinarInviteFlow = contentType === "webinar_invite" || contentType === "webinar_invite_2";
  const isDirectOfferFlow = contentType === "direct_offer";
  const isMultiOfferFlow = contentType === "multi_offer";
  const isTransformationStoryFlow = contentType === "transformation_story";
  const canCreate = !!audienceSegment && !!contentType && (
    isWebinarInviteFlow
      ? offerType === "webinar"
      : isMultiOfferFlow
      ? format === "carousel" && letterThemeTitle.trim().length > 0 && extraOffers.filter(e => e.offerId).length >= 1
      : isTransformationStoryFlow
      ? format === "carousel" && !!caseId
      : isDirectOfferFlow
      ? true
      : isTrustAiFlow
      ? true
      : isFromScratchFlow
      ? topicDescription.trim().length > 0 && (format === "post" || (slideCount >= 2 && slideCount <= 20))
      : isTestimonialFlow
      ? !!caseId
      : isObjectionFlow
      ? objectionIds.length > 0
      : (topicMode === "auto" ||
         (topicMode === "manual" && topic.trim().length > 0) ||
         (topicMode === "tree" && !!treeTopic))
  );

  // Load selected case info for display
  const { data: selectedCase } = useQuery({
    queryKey: ["wizard_selected_case", caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const { data } = await supabase
        .from("case_classifications")
        .select("id, file_name, classification_json")
        .eq("id", caseId)
        .single();
      return data;
    },
    enabled: !!caseId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setCreating(true);
      const userTopic = TOPIC_DIALOG_TYPES.includes(contentType)
        ? (topicMode === "manual" ? topic.trim() : topicMode === "tree" ? (treeTopic?.title || "") : "")
        : "";
      const labelGen = TYPE_LABEL_GENITIVE[contentType] ?? "контента";

      const offer = offers?.find((o) => o.id === offerId);
      const program = programs?.find((p) => p.id === programId);

      const { data: nameData, error: nameError } = await supabase.functions.invoke("generate-project-name", {
        body: { course_title: offer?.title || "", program_title: program?.title || "" },
      });
      if (nameError) throw new Error(nameError.message || "Ошибка генерации названия");
      if (nameData?.error) throw new Error(nameData.error);

      // For carousel + objection_handling with multiple objections, skip angles step entirely
      const skipAngles = contentType === "objection_handling" && format === "carousel";
      const isFromScratch = contentType === "from_scratch";
      const isTrustAi = contentType === "trust_ai";
      const isWebinarInvite = contentType === "webinar_invite" || contentType === "webinar_invite_2";
      const isDirectOffer = contentType === "direct_offer";
      const isMultiOffer = contentType === "multi_offer";
      const isTransformationStory = contentType === "transformation_story";
      const isAutonomous = isFromScratch || isTrustAi || isWebinarInvite || isDirectOffer || isMultiOffer || isTransformationStory;

      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({
          offer_id: offerId,
          program_id: programId,
          title: nameData.name,
          created_by: user!.id,
          content_type: contentType,
          content_format: format,
          audience_segment: audienceSegment || "",
          ...((contentType === "testimonial_content" || contentType === "transformation_story") && caseId ? { selected_case_id: caseId } : {}),
          ...(contentType === "objection_handling" && objectionIds.length > 0 ? { selected_objection_ids: objectionIds } : {}),
          ...(isFromScratch ? {
            topic_description: topicDescription.trim(),
            slide_count: format === "carousel" ? slideCount : null,
          } : {}),
          ...(isMultiOffer ? {
            topic_description: letterThemeTitle.trim(),
            extra_offer_ids: extraOffers.filter(e => e.offerId).map(e => e.offerId),
          } : {}),
          ...(skipAngles || isAutonomous ? { status: "lead_selected" as const } : {}),
        } as any)
        .select("id")
        .single();
      if (projError) throw projError;

      const targetUrl = format === "carousel" ? `/carousel` : `/post`;

      if (isAutonomous) {
        // No angles / lead magnets step — user will click "Generate" per channel from ProjectDetail.
        return {
          projectId: project.id,
          targetUrl: `/programs/${programId}/offers/${offerType}/${offerId}/projects/${project.id}`,
        };
      }

      if (skipAngles) {
        // Generate carousel directly from objection list, no angles
        await enqueue({
          functionName: "generate-pipeline",
          payload: { project_id: project.id, content_type: contentType, content_format: format },
          displayTitle: `Генерация ${labelGen}: ${nameData.name}`,
          lane: "claude",
          targetUrl,
        });
      } else {
        const payload: Record<string, any> = { project_id: project.id, content_type: contentType };
        if (userTopic) payload.user_topic = userTopic;
        if (contentType === "testimonial_content" && caseId) {
          payload.case_classification_id = caseId;
        }
        if (contentType === "objection_handling" && objectionIds.length > 0) {
          payload.selected_objection_ids = objectionIds;
        }

        await enqueue({
          functionName: "generate-lead-magnets",
          payload,
          displayTitle: `Генерация ${labelGen}: ${nameData.name}`,
          lane: "claude",
          targetUrl,
        });
      }

      return { projectId: project.id, targetUrl };
    },
    onSuccess: ({ targetUrl }) => {
      toast.success("Проект создан, генерация запущена");
      onOpenChange(false);
      navigate(targetUrl);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setCreating(false);
    },
  });

  const title = format === "carousel" ? "Новая карусель" : "Новый пост";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg [&>*]:min-w-0">
        <DialogHeader className="min-w-0">
          <DialogTitle>{title} — шаг {step} из 2</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 min-w-0">
            <div className="space-y-1.5">
              <Label>Платная программа</Label>
              <Select value={programId} onValueChange={(v) => { setProgramId(v); setOfferType(""); setOfferId(""); }}>
                <SelectTrigger><SelectValue placeholder="Выберите программу" /></SelectTrigger>
                <SelectContent>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Тип оффера</Label>
              <Select value={offerType} onValueChange={(v) => { setOfferType(v); setOfferId(""); }} disabled={!programId}>
                <SelectTrigger><SelectValue placeholder="Выберите тип оффера" /></SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Оффер</Label>
              <Select value={offerId} onValueChange={setOfferId} disabled={!offerType}>
                <SelectTrigger>
                  <SelectValue placeholder={offers?.length === 0 ? "Нет офферов этого типа" : "Выберите оффер"} />
                </SelectTrigger>
                <SelectContent>
                  {offers?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 min-w-0">
            <div className="text-xs text-muted-foreground break-words">
              {programs?.find((p) => p.id === programId)?.title} · {getOfferTypeLabel(offerType)} · {offers?.find((o) => o.id === offerId)?.title}
            </div>

            <div className="space-y-1.5">
              <Label>Аудитория</Label>
              <Select value={audienceSegment || ""} onValueChange={setAudienceSegment}>
                <SelectTrigger><SelectValue placeholder="Выберите аудиторию" /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SEGMENTS.map((seg) => (
                    <SelectItem key={seg.key} value={seg.key}>{seg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Тип контента</Label>
              <Select value={contentType} onValueChange={(v) => { setContentType(v); setTopicMode("auto"); setTopic(""); setObjectionIds([]); setTopicDescription(""); setExtraOffers([]); setLetterThemeTitle(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {contentType === "from_scratch" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Описание {format === "carousel" ? "карусели" : "поста"}</Label>
                  <Textarea
                    value={topicDescription}
                    onChange={(e) => setTopicDescription(e.target.value)}
                    placeholder={
                      format === "carousel"
                        ? "Например: Карусель о 5 ошибках новичков в психологии..."
                        : "Например: Пост о том, как выбрать свою первую нишу в психологии..."
                    }
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Опишите цель, ключевые мысли, тон — всё, что должно попасть в{format === "carousel" ? " карусель" : " пост"}.
                  </p>
                </div>
                {format === "carousel" && (
                  <div className="space-y-1.5">
                    <Label>Количество слайдов</Label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={slideCount}
                      onChange={(e) => setSlideCount(Math.max(2, Math.min(20, parseInt(e.target.value || "7", 10))))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {contentType === "transformation_story" && format !== "carousel" && (
              <div className="rounded-lg border bg-destructive/10 text-destructive border-destructive/40 p-3 text-sm">
                «История трансформации» доступна только для карусели.
              </div>
            )}
            {contentType === "transformation_story" && format === "carousel" && (
              <div className="space-y-2">
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  ИИ построит карусель по формату «ДО → поворот → ПОСЛЕ → инструмент из программы → CTA» на основе выбранного кейса.
                  На Instagram предпоследний слайд будет оставлен пустым — туда вручную при загрузке вставляется видео с историей ученика.
                </div>
                <Label>Кейс / история ученика</Label>
                {selectedCase ? (
                  <div className="rounded-lg border p-3 bg-muted/30 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {(selectedCase as any).classification_json?.student_name || selectedCase.file_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{selectedCase.file_name}</div>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setCasePickerOpen(true)}>
                        Изменить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setCasePickerOpen(true)}>
                    Выбрать кейс из библиотеки
                  </Button>
                )}
              </div>
            )}

            {contentType === "multi_offer" && (
              <div className="space-y-3">
                {format !== "carousel" ? (
                  <div className="rounded-lg border bg-destructive/10 text-destructive border-destructive/40 p-3 text-sm">
                    Мультиоффер доступен только для карусели.
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      ИИ сделает карусель, в которой первый оффер (выбранный на шаге 1) — основной, а дополнительные офферы идут отдельными слайдами. Последний слайд — CTA.
                    </div>
                    <div className="space-y-1.5">
                      <Label>Общая тема карусели</Label>
                      <Textarea
                        value={letterThemeTitle}
                        onChange={(e) => setLetterThemeTitle(e.target.value)}
                        placeholder="Например: Подборка способов начать карьеру в психологии"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дополнительные офферы (1–2)</Label>
                      {extraOffers.map((ex, idx) => (
                        <ExtraOfferRow
                          key={idx}
                          programId={programId}
                          value={ex}
                          onChange={(v) => setExtraOffers(prev => prev.map((p, i) => i === idx ? v : p))}
                          onRemove={() => setExtraOffers(prev => prev.filter((_, i) => i !== idx))}
                        />
                      ))}
                      {extraOffers.length < 2 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setExtraOffers(prev => [...prev, { offerType: "", offerId: "" }])}>
                          + Добавить оффер
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {contentType === "direct_offer" && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                ИИ сам составит прямой продающий {format === "carousel" ? "карусель" : "пост"} на выбранный оффер, исходя из данных программы, описания оффера и сегмента аудитории.
              </div>
            )}

            {(contentType === "webinar_invite" || contentType === "webinar_invite_2") && (
              <div className={`rounded-lg border p-3 text-sm ${offerType === "webinar" ? "bg-muted/30 text-muted-foreground" : "bg-destructive/10 text-destructive border-destructive/40"}`}>
                {offerType === "webinar"
                  ? contentType === "webinar_invite_2"
                    ? `ИИ сделает ${format === "carousel" ? "карусель" : "пост"}-приглашение в стиле «Письмо 2»: 2–3 инсайта по теме вебинара + мягкий переход к CTA. Не повторяет первый анонс.`
                    : `ИИ сам составит ${format === "carousel" ? "карусель" : "пост"}-приглашение на вебинар на основе данных оффера (дата, лендинг, тема, спикер) и сегмента аудитории.`
                  : "Этот тип контента доступен только для офферов типа «Вебинар». Вернитесь на шаг 1 и выберите вебинар."}
              </div>
            )}

            {contentType === "trust_ai" && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                ИИ сам выберет тему, ракурс, структуру{format === "carousel" ? " и количество слайдов" : ""} на основе информации о программе, оффере и сегменте аудитории. От вас — только выбор программы, оффера и сегмента.
              </div>
            )}

            {contentType === "testimonial_content" && (
              <div className="space-y-2">
                <Label>Кейс / отзыв</Label>
                {selectedCase ? (
                  <div className="rounded-lg border p-3 bg-muted/30 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {(selectedCase as any).classification_json?.student_name || selectedCase.file_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{selectedCase.file_name}</div>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setCasePickerOpen(true)}>
                        Изменить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setCasePickerOpen(true)}>
                    Выбрать кейс из библиотеки
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Под выбранный отзыв сгенерируются углы подачи контента.
                </p>
              </div>
            )}

            {contentType === "objection_handling" && (
              <div className="space-y-2">
                <Label>Возражения {format === "post" ? "(выберите одно)" : "(можно выбрать несколько)"}</Label>
                <ObjectionPicker
                  programId={programId}
                  mode={format === "post" ? "single" : "multi"}
                  value={objectionIds}
                  onChange={setObjectionIds}
                />
              </div>
            )}

            {TOPIC_DIALOG_TYPES.includes(contentType) && (
              <div className="space-y-2">
                <Label>Тема</Label>
                <RadioGroup value={topicMode} onValueChange={(v) => setTopicMode(v as "auto" | "manual" | "tree")} className="gap-2">
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="auto" id="wiz-auto" className="mt-0.5" />
                    <Label htmlFor="wiz-auto" className="cursor-pointer">
                      <div className="font-medium">Автоматически</div>
                      <div className="text-sm text-muted-foreground">Система предложит варианты</div>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="manual" id="wiz-manual" className="mt-0.5" />
                    <Label htmlFor="wiz-manual" className="cursor-pointer">
                      <div className="font-medium">Задать тему вручную</div>
                      <div className="text-sm text-muted-foreground">Опишите тему своими словами</div>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="tree" id="wiz-tree" className="mt-0.5" />
                    <Label htmlFor="wiz-tree" className="cursor-pointer">
                      <div className="font-medium">Выбрать из дерева тем</div>
                      <div className="text-sm text-muted-foreground">Направление → поднаправление → тема</div>
                    </Label>
                  </div>
                </RadioGroup>
                {topicMode === "manual" && (
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Опишите тему..."
                    rows={3}
                  />
                )}
                {topicMode === "tree" && (
                  <TopicTreePicker value={treeTopic} onChange={setTreeTopic} />
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 min-w-0">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={creating}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!canGoNext}>
              Далее
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => createMutation.mutate()} disabled={!canCreate || creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Создать
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      {/* extras dialog handled inline */}
      <CasePickerDialog
        open={casePickerOpen}
        onOpenChange={setCasePickerOpen}
        selectedCaseId={caseId}
        onSelect={(id) => setCaseId(id)}
      />
    </Dialog>
  );
}

function ExtraOfferRow({ programId, value, onChange, onRemove }: {
  programId: string;
  value: { offerType: string; offerId: string };
  onChange: (v: { offerType: string; offerId: string }) => void;
  onRemove: () => void;
}) {
  const { data: rowOffers } = useQuery({
    queryKey: ["wizard_extra_offers", programId, value.offerType],
    queryFn: async () => {
      if (!value.offerType) return [];
      let q = supabase.from("offers").select("id, title").eq("offer_type", value.offerType as any).eq("is_archived", false);
      if (value.offerType !== "spot_available") q = q.eq("program_id", programId);
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!programId && !!value.offerType,
  });
  return (
    <div className="space-y-1.5 rounded-lg border p-2">
      <div className="flex gap-2">
        <Select value={value.offerType} onValueChange={(v) => onChange({ offerType: v, offerId: "" })}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Тип оффера" /></SelectTrigger>
          <SelectContent>
            {OFFER_TYPES.map((t) => (<SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>×</Button>
      </div>
      <Select value={value.offerId} onValueChange={(v) => onChange({ ...value, offerId: v })} disabled={!value.offerType}>
        <SelectTrigger><SelectValue placeholder="Выберите оффер" /></SelectTrigger>
        <SelectContent>
          {rowOffers?.map((o) => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );
}

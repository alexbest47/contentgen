import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Check } from "lucide-react";
import { toast } from "sonner";

const AUDIENCE_SEGMENTS = [
  { key: "audience_from_scratch_personal", label: "С нуля — для себя" },
  { key: "audience_from_scratch_career", label: "С нуля — новая профессия" },
  { key: "audience_from_scratch_both", label: "С нуля — для себя и, возможно, профессия" },
  { key: "audience_with_diploma", label: "Есть образование — повышение квалификации" },
];

// Bot chain templates. Prompts live in DB with these slugs.
// kind: "webinar" → step 2 selects a webinar offer;
// kind: "warming" → step 2 selects a paid_program directly (no webinar).
const BOT_TEMPLATES: Array<{
  slug: string;
  name: string;
  description: string;
  kind: "webinar" | "warming";
  messages: Array<{ step_order: number; channel: string; prompt_slug: string; title: string }>;
}> = [
  {
    slug: "bot-webinar-before-after",
    name: "До и после вебинара",
    description: "15 сообщений в Telegram/Max-боте: разогрев до эфира и дожим после",
    kind: "webinar",
    messages: [
      { step_order: 1, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-1", title: "Приветствие" },
      { step_order: 2, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-2", title: "Знакомство со спикером" },
      { step_order: 3, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-3", title: "Задание: сформулировать запрос" },
      { step_order: 4, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-4", title: "Провокация: твоя ситуация сейчас" },
      { step_order: 5, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-5", title: "Программа эфира" },
      { step_order: 6, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-6", title: "Напоминание за 24 часа" },
      { step_order: 7, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-7", title: "Напоминание за 1 час" },
      { step_order: 8, channel: "bot_webinar_before", prompt_slug: "bot-webinar-letter-8", title: "«Мы в эфире»" },
      { step_order: 9, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-9", title: "Запись + презентация программы" },
      { step_order: 10, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-10", title: "Видео-кейс №1 (карьера/деньги)" },
      { step_order: 11, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-11", title: "Провокация + опрос" },
      { step_order: 12, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-12", title: "Бонусный материал" },
      { step_order: 13, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-13", title: "Возражения + chat CTA" },
      { step_order: 14, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-14", title: "Видео-кейс №2 (смысл/уверенность)" },
      { step_order: 15, channel: "bot_webinar_after", prompt_slug: "bot-webinar-letter-15", title: "Дедлайн / последний день" },
    ],
  },
  {
    slug: "bot-warming-after-application",
    name: "Прогрев после заявки",
    description: "7 сообщений для тех, кто оставил заявку на платной странице: welcome → экспертный контент → кейс → программа → возражения → мотивация → подарок",
    kind: "warming",
    messages: [
      { step_order: 1, channel: "bot_warming", prompt_slug: "bot-warming-letter-1", title: "Welcome после заявки" },
      { step_order: 2, channel: "bot_warming", prompt_slug: "bot-warming-letter-2", title: "Экспертный контент" },
      { step_order: 3, channel: "bot_warming", prompt_slug: "bot-warming-letter-3", title: "Кейс выпускника" },
      { step_order: 4, channel: "bot_warming", prompt_slug: "bot-warming-letter-4", title: "Что внутри программы" },
      { step_order: 5, channel: "bot_warming", prompt_slug: "bot-warming-letter-5", title: "Честные ответы на возражения" },
      { step_order: 6, channel: "bot_warming", prompt_slug: "bot-warming-letter-6", title: "Первый шаг уже сделан" },
      { step_order: 7, channel: "bot_warming", prompt_slug: "bot-warming-letter-7", title: "Подарок" },
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBotChainWizard({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueue } = useTaskQueue();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  const [templateSlug, setTemplateSlug] = useState<string>("");
  const [webinarOfferId, setWebinarOfferId] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");
  const [audienceSegment, setAudienceSegment] = useState<string>("");
  const [chainTitle, setChainTitle] = useState("");
  const [colorSchemeId, setColorSchemeId] = useState<string>("");
  const [imageStyleId, setImageStyleId] = useState<string>("");

  const { data: webinars } = useQuery({
    queryKey: ["bot_webinar_offers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("*, paid_programs(title)")
        .eq("offer_type", "webinar")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: open,
  });

  const { data: programs } = useQuery({
    queryKey: ["bot_warming_programs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("paid_programs")
        .select("id, title")
        .order("title");
      return (data || []) as any[];
    },
    enabled: open,
  });

  const { data: colorSchemes } = useQuery({
    queryKey: ["color_schemes_active"],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("*").eq("is_active", true).order("name");
      return (data || []) as any[];
    },
    enabled: open && step >= 4,
  });

  const { data: imageStyles } = useQuery({
    queryKey: ["image_styles_active"],
    queryFn: async () => {
      const { data } = await supabase.from("image_styles").select("*").eq("is_active", true).order("name");
      return (data || []) as any[];
    },
    enabled: open && step >= 4,
  });

  const selectedTemplate = BOT_TEMPLATES.find((t) => t.slug === templateSlug);
  const isWarmingKind = selectedTemplate?.kind === "warming";
  const selectedWebinar = webinars?.find((w: any) => w.id === webinarOfferId);
  const selectedProgram = programs?.find((p: any) => p.id === programId);

  const reset = () => {
    setStep(1);
    setTemplateSlug("");
    setWebinarOfferId("");
    setProgramId("");
    setAudienceSegment("");
    setChainTitle("");
    setColorSchemeId("");
    setImageStyleId("");
    setCreating(false);
  };

  const handleCreate = async () => {
    if (!user || !selectedTemplate || !audienceSegment || !chainTitle.trim() || !colorSchemeId || !imageStyleId) return;
    if (isWarmingKind ? !programId : !webinarOfferId) return;
    setCreating(true);

    try {
      const resolvedProgramId = isWarmingKind ? programId : (selectedWebinar?.program_id || null);

      // 1. Create chain
      const { data: chain, error: chainErr } = await supabase
        .from("bot_chains" as any)
        .insert({
          title: chainTitle.trim(),
          template_slug: selectedTemplate.slug,
          webinar_offer_id: isWarmingKind ? null : webinarOfferId,
          program_id: resolvedProgramId,
          selected_color_scheme_id: colorSchemeId,
          image_style_id: imageStyleId,
          audience_segment: audienceSegment,
          created_by: user.id,
        } as any)
        .select("id")
        .single();
      if (chainErr) throw chainErr;
      const chainId = (chain as any).id;

      // 2. Create messages + enqueue tasks
      for (const m of selectedTemplate.messages) {
        const { data: msg, error: msgErr } = await supabase
          .from("bot_chain_messages" as any)
          .insert({
            chain_id: chainId,
            step_order: m.step_order,
            channel: m.channel,
            prompt_slug: m.prompt_slug,
            title: m.title,
            status: "pending",
          } as any)
          .select("id")
          .single();
        if (msgErr) throw msgErr;

        await enqueue({
          functionName: "generate-bot-message",
          payload: { message_id: (msg as any).id },
          displayTitle: `Бот «${chainTitle}» — Сообщение ${m.step_order}: ${m.title}`,
          lane: "claude",
          targetUrl: `/bot-chains/${chainId}/messages/${(msg as any).id}`,
          taskType: "content",
        });
      }

      toast.success("Бот-цепочка создана! Задачи добавлены в очередь.");
      onOpenChange(false);
      reset();
      navigate(`/bot-chains/${chainId}`);
    } catch (e: any) {
      toast.error("Ошибка создания бот-цепочки", { description: e.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая бот-цепочка — Шаг {step} из 4</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Label>Выберите шаблон бот-цепочки</Label>
            {BOT_TEMPLATES.map((t) => (
              <Card
                key={t.slug}
                className={`cursor-pointer transition-colors ${templateSlug === t.slug ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/30"}`}
                onClick={() => setTemplateSlug(t.slug)}
              >
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <Bot className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <Badge variant="secondary" className="mt-1">{t.messages.length} сообщений</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 2 && !isWarmingKind && (
          <div className="space-y-4">
            <Label>Вебинар</Label>
            <Select value={webinarOfferId} onValueChange={setWebinarOfferId}>
              <SelectTrigger><SelectValue placeholder="Выберите вебинар" /></SelectTrigger>
              <SelectContent>
                {webinars?.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.title} {w.paid_programs?.title ? `(${w.paid_programs.title})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedWebinar && (
              <p className="text-sm text-muted-foreground">
                Программа: {selectedWebinar.paid_programs?.title || "—"}
                {selectedWebinar.is_autowebinar && " • Автовебинар"}
              </p>
            )}
          </div>
        )}

        {step === 2 && isWarmingKind && (
          <div className="space-y-4">
            <Label>Платная программа</Label>
            <p className="text-sm text-muted-foreground">Цепочка будет собрана для этой программы — её название, описание и аудитория подставятся во все 7 сообщений.</p>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger><SelectValue placeholder="Выберите программу" /></SelectTrigger>
              <SelectContent>
                {programs?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Сегмент аудитории</Label>
            <p className="text-sm text-muted-foreground">Это поможет точнее настроить тон и контекст сообщений</p>
            <div className="space-y-3">
              {AUDIENCE_SEGMENTS.map((seg) => {
                const isSelected = audienceSegment === seg.key;
                return (
                  <div
                    key={seg.key}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}
                    onClick={() => setAudienceSegment(seg.key)}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{seg.label}</h3>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название цепочки <span className="text-destructive">*</span></Label>
              <Input
                value={chainTitle}
                onChange={(e) => setChainTitle(e.target.value)}
                placeholder="Например: Бот-цепочка «Масштаб» — апрель 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Цветовая гамма <span className="text-destructive">*</span></Label>
              <Select key={`cs-${open}`} value={colorSchemeId} onValueChange={setColorSchemeId}>
                <SelectTrigger className={!colorSchemeId ? "border-destructive/50" : ""}>
                  <SelectValue placeholder="Обязательно — выберите гамму" />
                </SelectTrigger>
                <SelectContent>
                  {colorSchemes?.map((cs: any) => (
                    <SelectItem key={cs.id} value={cs.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {cs.preview_colors?.slice(0, 4).map((c: string, i: number) => (
                            <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        {cs.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Стиль изображений <span className="text-destructive">*</span></Label>
              <Select key={`is-${open}`} value={imageStyleId} onValueChange={setImageStyleId}>
                <SelectTrigger className={!imageStyleId ? "border-destructive/50" : ""}>
                  <SelectValue placeholder="Обязательно — выберите стиль" />
                </SelectTrigger>
                <SelectContent>
                  {imageStyles?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border bg-muted/50 p-3 space-y-1.5 text-sm">
              <p className="font-medium text-foreground">Сводка перед созданием</p>
              <p><span className="text-muted-foreground">Шаблон:</span> {selectedTemplate?.name || "—"}</p>
              {!isWarmingKind && (
                <>
                  <p><span className="text-muted-foreground">Вебинар:</span> {selectedWebinar?.title || "—"}</p>
                  <p><span className="text-muted-foreground">Программа:</span> {selectedWebinar?.paid_programs?.title || "—"}</p>
                </>
              )}
              {isWarmingKind && (
                <p><span className="text-muted-foreground">Программа:</span> {selectedProgram?.title || "—"}</p>
              )}
              <p><span className="text-muted-foreground">Сегмент:</span> {AUDIENCE_SEGMENTS.find((s) => s.key === audienceSegment)?.label || "—"}</p>
              <p className={!colorSchemeId ? "text-destructive font-medium" : ""}>
                <span className="text-muted-foreground">Цветовая гамма:</span> {colorSchemeId ? colorSchemes?.find((cs: any) => cs.id === colorSchemeId)?.name : "⚠ Не выбрана"}
              </p>
              <p className={!imageStyleId ? "text-destructive font-medium" : ""}>
                <span className="text-muted-foreground">Стиль изображений:</span> {imageStyleId ? imageStyles?.find((s: any) => s.id === imageStyleId)?.name : "⚠ Не выбран"}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}>
            {step === 1 ? "Отмена" : "Назад"}
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !templateSlug) ||
                (step === 2 && (isWarmingKind ? !programId : !webinarOfferId)) ||
                (step === 3 && !audienceSegment)
              }
            >
              Далее
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating || !chainTitle.trim() || !colorSchemeId || !imageStyleId}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Создать бот-цепочку
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

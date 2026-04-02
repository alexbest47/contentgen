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
import { Loader2, Mail, Info } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateChainWizard({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueue } = useTaskQueue();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  // Selections
  const [templateId, setTemplateId] = useState<string>("");
  const [webinarOfferId, setWebinarOfferId] = useState<string>("");
  const [pdfMaterialId, setPdfMaterialId] = useState<string>("");
  const [caseId, setCaseId] = useState<string>("");
  const [miniCourseOfferId, setMiniCourseOfferId] = useState<string>("");
  const [chainTitle, setChainTitle] = useState("");
  const [colorSchemeId, setColorSchemeId] = useState<string>("");
  const [imageStyleId, setImageStyleId] = useState<string>("");

  // Data queries
  const { data: templates } = useQuery({
    queryKey: ["email_chain_templates"],
    queryFn: async () => {
      const { data } = await supabase.from("email_chain_templates" as any).select("*").order("sort_order");
      return (data || []) as any[];
    },
    enabled: open,
  });

  const { data: webinars } = useQuery({
    queryKey: ["webinar_offers"],
    queryFn: async () => {
      const { data } = await supabase.from("offers").select("*, paid_programs(title)").eq("offer_type", "webinar").eq("is_archived", false).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: open,
  });

  const { data: pdfMaterials } = useQuery({
    queryKey: ["pdf_materials_ready"],
    queryFn: async () => {
      const { data } = await supabase.from("pdf_materials").select("id, title, program_name").eq("status", "ready").order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: open && step >= 3,
  });

  const { data: cases } = useQuery({
    queryKey: ["case_classifications_list"],
    queryFn: async () => {
      const { data } = await supabase.from("case_classifications").select("id, file_name").order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: open && step >= 3,
  });

  const { data: miniCourses } = useQuery({
    queryKey: ["mini_course_offers"],
    queryFn: async () => {
      const { data } = await supabase.from("offers").select("id, title").eq("offer_type", "mini_course").eq("is_archived", false).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: open && step >= 3,
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

  const selectedTemplate = templates?.find((t: any) => t.id === templateId);
  const selectedWebinar = webinars?.find((w: any) => w.id === webinarOfferId);

  const reset = () => {
    setStep(1);
    setTemplateId("");
    setWebinarOfferId("");
    setPdfMaterialId("");
    setCaseId("");
    setMiniCourseOfferId("");
    setChainTitle("");
    setColorSchemeId("");
    setImageStyleId("");
    setCreating(false);
  };

  const handleCreate = async () => {
    if (!user || !templateId || !webinarOfferId || !chainTitle.trim() || !colorSchemeId || !imageStyleId) return;

    // Validate that selected IDs actually exist in loaded data
    const validStyle = imageStyles?.find((s: any) => s.id === imageStyleId);
    const validScheme = colorSchemes?.find((cs: any) => cs.id === colorSchemeId);
    if (!validStyle) {
      toast.error("Выбранный стиль изображений не найден. Выберите заново.");
      return;
    }
    if (!validScheme) {
      toast.error("Выбранная цветовая гамма не найдена. Выберите заново.");
      return;
    }

    setCreating(true);

    try {
      const programId = selectedWebinar?.program_id || null;
      const lettersConfig: any[] = selectedTemplate?.letters_config || [];

      // 1. Create chain
      const { data: chain, error: chainErr } = await supabase
        .from("email_chains" as any)
        .insert({
          title: chainTitle.trim(),
          template_id: templateId,
          webinar_offer_id: webinarOfferId,
          program_id: programId,
          selected_color_scheme_id: colorSchemeId || null,
          image_style_id: imageStyleId || null,
          pdf_material_id: pdfMaterialId || null,
          case_id: caseId || null,
          mini_course_offer_id: miniCourseOfferId || null,
          created_by: user.id,
        } as any)
        .select("id")
        .single();
      if (chainErr) throw chainErr;
      const chainId = (chain as any).id;

      // 2. Create letters + chain_letters + enqueue tasks
      for (const lc of lettersConfig) {
        // Create email_letter
        const { data: letter, error: letterErr } = await supabase
          .from("email_letters")
          .insert({
            created_by: user.id,
            title: `${chainTitle} — Письмо ${lc.number}: ${lc.title}`,
            program_id: programId,
            offer_id: webinarOfferId,
            offer_type: "webinar",
            selected_color_scheme_id: colorSchemeId || null,
            image_style_id: imageStyleId || null,
            case_id: caseId || null,
            pdf_material_id: pdfMaterialId || null,
            mini_course_offer_id: miniCourseOfferId || null,
            status: "draft",
          })
          .select("id")
          .single();
        if (letterErr) throw letterErr;

        // Create chain_letter link
        await supabase.from("email_chain_letters" as any).insert({
          chain_id: chainId,
          letter_id: letter.id,
          letter_number: lc.number,
          group_name: lc.group,
          slug: lc.slug,
          status: "pending",
          sort_order: lc.number,
        } as any);

        // Enqueue generation task
        await enqueue({
          functionName: "generate-email-letter",
          payload: { letter_id: letter.id, chain_letter_slug: lc.slug },
          displayTitle: `Цепочка «${chainTitle}» — Письмо ${lc.number}: ${lc.title}`,
          lane: "claude",
          targetUrl: `/email-builder/${letter.id}`,
        });
      }

      toast.success("Цепочка создана! Задачи добавлены в очередь.");
      onOpenChange(false);
      reset();
      navigate(`/email-chains/${chainId}`);
    } catch (e: any) {
      toast.error("Ошибка создания цепочки", { description: e.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая цепочка — Шаг {step} из 4</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Label>Выберите шаблон цепочки</Label>
            {templates?.map((t: any) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-colors ${templateId === t.id ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/30"}`}
                onClick={() => setTemplateId(t.id)}
              >
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <Badge variant="secondary" className="mt-1">{t.letter_count} писем</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 2 && (
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

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Все поля необязательные — можно пропустить</p>

            <div className="space-y-2">
              <Label>PDF при регистрации (письма 1, 10)</Label>
              <Select value={pdfMaterialId} onValueChange={setPdfMaterialId}>
                <SelectTrigger><SelectValue placeholder="Пропустить" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">Пропустить</SelectItem>
                  {pdfMaterials?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Кейс студента (письма 4, 11, 15)</Label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger><SelectValue placeholder="Пропустить" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">Пропустить</SelectItem>
                  {cases?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.file_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Мини-курс (письмо 13)</Label>
              <Select value={miniCourseOfferId} onValueChange={setMiniCourseOfferId}>
                <SelectTrigger><SelectValue placeholder="Пропустить" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">Пропустить</SelectItem>
                  {miniCourses?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-start p-3 bg-muted rounded-md">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Схему-инструмент, провокационный контент, отработку возражений и дедлайн система генерирует сама на основе данных вебинара и программы
              </p>
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
                placeholder="Например: Вебинар «Масштаб» — март 2026"
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

            {(!colorSchemeId || !imageStyleId) && (
              <p className="text-sm text-destructive">Выберите цветовую гамму и стиль изображений для продолжения</p>
            )}

            {/* Summary block */}
            <div className="rounded-md border bg-muted/50 p-3 space-y-1.5 text-sm">
              <p className="font-medium text-foreground">Сводка перед созданием</p>
              <p><span className="text-muted-foreground">Шаблон:</span> {selectedTemplate?.name || "—"}</p>
              <p><span className="text-muted-foreground">Вебинар:</span> {selectedWebinar?.title || "—"}</p>
              <p><span className="text-muted-foreground">Программа:</span> {selectedWebinar?.paid_programs?.title || "—"}</p>
              <p><span className="text-muted-foreground">PDF:</span> {pdfMaterialId && pdfMaterialId !== "__skip__" ? pdfMaterials?.find((p: any) => p.id === pdfMaterialId)?.title : "Пропущено"}</p>
              <p><span className="text-muted-foreground">Кейс:</span> {caseId && caseId !== "__skip__" ? cases?.find((c: any) => c.id === caseId)?.file_name : "Пропущено"}</p>
              <p><span className="text-muted-foreground">Мини-курс:</span> {miniCourseOfferId && miniCourseOfferId !== "__skip__" ? miniCourses?.find((m: any) => m.id === miniCourseOfferId)?.title : "Пропущено"}</p>
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
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
            {step === 1 ? "Отмена" : "Назад"}
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !templateId) ||
                (step === 2 && !webinarOfferId)
              }
            >
              Далее
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating || !chainTitle.trim() || !colorSchemeId || !imageStyleId}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Создать цепочку
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

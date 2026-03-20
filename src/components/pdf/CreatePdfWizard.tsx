import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const MATERIAL_TYPES = [
  { value: "workbook", label: "Рабочая тетрадь" },
  { value: "checklist", label: "Чек-лист" },
  { value: "instruction", label: "Инструкция" },
  { value: "guide", label: "Гид" },
  { value: "reference", label: "Справочный материал" },
  { value: "expert", label: "Экспертный материал" },
];

const AUDIENCE_SEGMENTS = [
  { value: "С нуля — для себя", label: "С нуля — для себя" },
  { value: "С нуля — новая профессия", label: "С нуля — новая профессия" },
  { value: "С нуля — для себя и возможно профессия", label: "С нуля — для себя и возможно профессия" },
  { value: "Есть образование — повышение квалификации", label: "Есть образование — повышение квалификации" },
];

const PROGRESS_MESSAGES = [
  "Создаю содержание материала...",
  "Верстаю PDF...",
  "Подготавливаю лендинг...",
  "Финальная проверка...",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string, slug: string) => void;
}

export function CreatePdfWizard({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState(0);

  // Step 1
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [programId, setProgramId] = useState("");
  const [audience, setAudience] = useState("");

  // Step 2
  const [brandStyleId, setBrandStyleId] = useState("");
  const [brandVoice, setBrandVoice] = useState("");

  const { data: programs } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title").order("title");
      return data || [];
    },
  });

  const { data: colorSchemes } = useQuery({
    queryKey: ["color_schemes_active"],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("id, name, description").eq("is_active", true);
      return data || [];
    },
  });

  const { data: globalVars } = useQuery({
    queryKey: ["global_vars_brand"],
    queryFn: async () => {
      const { data } = await supabase.from("prompt_global_variables").select("key, value").in("key", ["brand_voice"]);
      return data || [];
    },
  });

  useEffect(() => {
    const bv = globalVars?.find(v => v.key === "brand_voice");
    setBrandVoice(bv?.value || "");
  }, [globalVars]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setTitle("");
      setMaterialType("");
      setProgramId("");
      setAudience("");
      setBrandStyleId("");
      setGenerating(false);
      setProgressMsg(0);
    }
  }, [open]);

  // Progress messages cycling
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setProgressMsg(prev => Math.min(prev + 1, PROGRESS_MESSAGES.length - 1));
    }, 8000);
    return () => clearInterval(interval);
  }, [generating]);

  const selectedProgram = programs?.find(p => p.id === programId);
  const selectedScheme = colorSchemes?.find(s => s.id === brandStyleId);
  const materialLabel = MATERIAL_TYPES.find(t => t.value === materialType)?.label || "";

  const canStep2 = title.trim() && materialType && programId && audience;
  const canStep3 = brandStyleId;
  const canGenerate = canStep2 && canStep3;

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setProgressMsg(0);

    try {
      // Create record
      const { data: mat, error: insErr } = await supabase.from("pdf_materials").insert({
        created_by: user.id,
        title: title.trim(),
        material_type: materialLabel,
        program_id: programId,
        program_name: selectedProgram?.title || "",
        audience_name: audience,
        brand_style_name: selectedScheme?.name || "",
        status: "generating",
      }).select("id").single();

      if (insErr) throw insErr;

      // Call edge function
      const { data, error } = await supabase.functions.invoke("generate-pdf-material", {
        body: { pdf_material_id: mat.id },
      });

      if (error) throw new Error(error.message || "Generation failed");
      if (data?.error) throw new Error(data.error);

      onSuccess(mat.id, data.slug);
      onOpenChange(false);
    } catch (e: any) {
      console.error("PDF generation error:", e);
      toast.error("Ошибка генерации. Попробуйте ещё раз.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Создать PDF — Шаг {step} из 3</DialogTitle>
        </DialogHeader>

        {generating ? (
          <div className="py-8 space-y-4">
            <Progress value={(progressMsg + 1) / PROGRESS_MESSAGES.length * 100} />
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              {PROGRESS_MESSAGES[progressMsg]}
            </p>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label>Название материала *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='Например: "5 техник снижения тревоги"'
              />
            </div>
            <div>
              <Label>Тип материала *</Label>
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Программа *</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger><SelectValue placeholder="Выберите программу" /></SelectTrigger>
                <SelectContent>
                  {programs?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {programId && (
              <div>
                <Label>Аудитория *</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue placeholder="Выберите аудиторию" /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_SEGMENTS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canStep2}>
                Далее <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <div>
              <Label>Бренд-стиль *</Label>
              <Select value={brandStyleId} onValueChange={setBrandStyleId}>
                <SelectTrigger><SelectValue placeholder="Выберите бренд-стиль" /></SelectTrigger>
                <SelectContent>
                  {colorSchemes?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Голос бренда (read-only)</Label>
              <Textarea value={brandVoice} readOnly className="bg-muted h-24 text-xs" />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Назад
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canStep3}>
                Далее <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">Название:</span> {title}</div>
              <div><span className="text-muted-foreground">Тип:</span> {materialLabel}</div>
              <div><span className="text-muted-foreground">Программа:</span> {selectedProgram?.title}</div>
              <div><span className="text-muted-foreground">Аудитория:</span> {audience}</div>
              <div><span className="text-muted-foreground">Бренд-стиль:</span> {selectedScheme?.name}</div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Назад
              </Button>
              <Button onClick={handleGenerate} disabled={!canGenerate}>
                Сгенерировать
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

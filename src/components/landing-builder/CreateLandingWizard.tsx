import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateLandingWizard({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState<string>("");
  const [programId, setProgramId] = useState<string>("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["landing_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data as any[];
    },
    enabled: open,
  });

  // Fetch programs
  const { data: programs } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paid_programs")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: open && step >= 2,
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Введите название лендинга");
      return;
    }
    setCreating(true);
    try {
      // 1. Create landing
      const { data: landing, error: landingError } = await supabase
        .from("landings")
        .insert({
          name: name.trim(),
          template_id: templateId || null,
          program_id: programId || null,
          status: "draft",
          created_by: user!.id,
        })
        .select("id")
        .single();
      if (landingError) throw landingError;

      // 2. If template selected, copy template blocks
      if (templateId) {
        const { data: templateBlocks, error: tbError } = await supabase
          .from("landing_template_blocks")
          .select("*, landing_block_definitions(default_content, editable_fields)")
          .eq("template_id", templateId)
          .order("sort_order");
        if (tbError) throw tbError;

        if (templateBlocks && templateBlocks.length > 0) {
          const landingBlocks = (templateBlocks as any[]).map((tb) => {
            // Merge: start with definition defaults, overlay template overrides
            const defContent = (tb.landing_block_definitions as any)?.default_content || {};
            const templateContent = tb.default_content || {};
            // Deep merge: template values take priority, but fill in missing fields from definition
            const merged = { ...defContent, ...templateContent };
            // For repeater fields: if template has empty array but definition has data, use definition
            const editableFields = (tb.landing_block_definitions as any)?.editable_fields || [];
            for (const field of editableFields) {
              if (field.type === "repeater" && field.field) {
                const tVal = templateContent[field.field];
                const dVal = defContent[field.field];
                if (Array.isArray(tVal) && tVal.length === 0 && Array.isArray(dVal) && dVal.length > 0) {
                  merged[field.field] = dVal;
                }
              }
            }
            return {
              landing_id: (landing as any).id,
              block_definition_id: tb.block_definition_id,
              sort_order: tb.sort_order,
              is_visible: true,
              settings: tb.default_settings || {},
              content_overrides: merged,
            };
          });
          const { error: insertError } = await supabase
            .from("landing_blocks")
            .insert(landingBlocks);
          if (insertError) throw insertError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["landings"] });
      toast.success("Лендинг создан");
      onOpenChange(false);
      resetState();
      navigate(`/landings/${(landing as any).id}`);
    } catch (e: any) {
      toast.error(e.message || "Ошибка создания");
    } finally {
      setCreating(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setTemplateId("");
    setProgramId("");
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Новый лендинг — Шаг {step} из 3
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Label>Выберите шаблон</Label>
            <RadioGroup value={templateId} onValueChange={setTemplateId} className="space-y-2">
              {templates?.map((t: any) => (
                <div key={t.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={t.id} id={t.id} />
                  <label htmlFor={t.id} className="flex-1 cursor-pointer">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  </label>
                </div>
              ))}
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer border-dashed">
                <RadioGroupItem value="" id="empty" />
                <label htmlFor="empty" className="flex-1 cursor-pointer">
                  <p className="font-medium">Начать с нуля</p>
                  <p className="text-sm text-muted-foreground">Пустой лендинг без блоков</p>
                </label>
              </div>
            </RadioGroup>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Далее</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Привязка к программе (опционально)</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите программу..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без программы</SelectItem>
                {programs?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Привязка к программе позволит автоматически подставить данные программы в блоки лендинга
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Назад</Button>
              <Button onClick={() => { if (programId === "none") setProgramId(""); setStep(3); }}>
                Далее
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Название лендинга</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Психолог-консультант — весенний набор"
              autoFocus
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Назад</Button>
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать лендинг
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

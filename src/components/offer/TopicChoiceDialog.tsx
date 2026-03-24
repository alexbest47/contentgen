import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

const PLACEHOLDERS: Record<string, string> = {
  lead_magnet: "Например: 5 признаков эмоционального выгорания, которые вы не замечаете",
  reference_material: "Например: Чек-лист восстановления после стресса",
  expert_content: "Например: Почему позитивное мышление не работает без проработки травм",
  provocative_content: "Например: Вы сами создаёте свою тревожность — и вот почему",
  list_content: "Например: 7 ошибок в общении с подростком, которые разрушают доверие",
  myth_busting: "Например: Миф о том, что депрессия — это просто лень",
};

const TYPE_LABELS: Record<string, string> = {
  lead_magnet: "лид-магнитов",
  reference_material: "справочного материала",
  expert_content: "экспертного контента",
  provocative_content: "провокационного контента",
  list_content: "списка",
  myth_busting: "разбора мифа",
};

interface TopicChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  onConfirm: (userTopic: string | null) => void;
  disabled?: boolean;
}

export function TopicChoiceDialog({
  open, onOpenChange, contentType, onConfirm, disabled,
}: TopicChoiceDialogProps) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [topic, setTopic] = useState("");

  const handleConfirm = () => {
    onConfirm(mode === "manual" && topic.trim() ? topic.trim() : null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setMode("auto");
      setTopic("");
    }
    onOpenChange(v);
  };

  const label = TYPE_LABELS[contentType] || "контента";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Генерация {label}</DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as "auto" | "manual")}
          className="gap-3"
        >
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <RadioGroupItem value="auto" id="mode-auto" className="mt-0.5" />
            <Label htmlFor="mode-auto" className="cursor-pointer">
              <div className="font-medium">Автоматически</div>
              <div className="text-sm text-muted-foreground">
                Система проанализирует продукт и аудиторию и предложит варианты
              </div>
            </Label>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <RadioGroupItem value="manual" id="mode-manual" className="mt-0.5" />
            <Label htmlFor="mode-manual" className="cursor-pointer">
              <div className="font-medium">Задать тему вручную</div>
              <div className="text-sm text-muted-foreground">
                Опишите тему или направление своими словами
              </div>
            </Label>
          </div>
        </RadioGroup>

        {mode === "manual" && (
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={PLACEHOLDERS[contentType] || "Опишите тему..."}
            rows={3}
            className="mt-1"
          />
        )}

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={disabled || (mode === "manual" && !topic.trim())}>
            {disabled ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Сгенерировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

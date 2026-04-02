import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Variant {
  id: string;
  title: string;
  visual_format?: string | null;
  visual_content?: string | null;
  instant_value?: string | null;
  save_reason?: string | null;
  transition_to_course?: string | null;
  cta_text?: string | null;
  target_segment?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: Variant[];
  contentType: string;
  onSelect: (variant: Variant) => void;
  onRegenerate: () => void;
  regenerating: boolean;
  title?: string;
}

function VariantCard({ variant, contentType, onSelect }: { variant: Variant; contentType: string; onSelect: (v: Variant) => void }) {
  return (
    <Card className="transition-all hover:border-primary/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{variant.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {(contentType === "testimonial_content" || contentType === "objection_handling") ? (
          <>
            <div><span className="font-medium">Тип угла:</span> {variant.visual_format}</div>
            <div><span className="font-medium">Ключевая цитата:</span> {variant.visual_content || "—"}</div>
            <div><span className="font-medium">Крючок:</span> {variant.instant_value}</div>
            {variant.save_reason && (() => { try { const arc = JSON.parse(variant.save_reason); return arc ? <div className="space-y-1"><span className="font-medium">Сюжетная арка:</span><div className="pl-3 text-muted-foreground"><div>До: {arc.before}</div><div>Поворот: {arc.turning_point}</div><div>После: {arc.after}</div></div></div> : null; } catch { return null; } })()}
            {variant.cta_text && <div><span className="font-medium">Что чувствует читатель:</span> {variant.cta_text}</div>}
            <div><span className="font-medium">Переход к офферу:</span> {variant.transition_to_course}</div>
          </>
        ) : contentType === "expert_content" || contentType === "myth_busting" ? (
          <>
            <div><span className="font-medium">Категория:</span> {variant.visual_format}</div>
            <div><span className="font-medium">Угол подачи:</span> {variant.visual_content}</div>
            <div><span className="font-medium">Крючок:</span> {variant.instant_value}</div>
            <div><span className="font-medium">Переход к офферу:</span> {variant.transition_to_course}</div>
          </>
        ) : contentType === "provocative_content" ? (
          <>
            <div><span className="font-medium">Формат:</span> {variant.visual_format}</div>
            <div><span className="font-medium">Угол подачи:</span> {variant.visual_content}</div>
            <div><span className="font-medium">Крючок:</span> {variant.instant_value}</div>
            <div><span className="font-medium">Триггер дискуссии:</span> {variant.save_reason}</div>
            <div><span className="font-medium">Переход к офферу:</span> {variant.transition_to_course}</div>
          </>
        ) : contentType === "list_content" ? (
          <>
            <div><span className="font-medium">Подтип:</span> {variant.visual_format}</div>
            <div><span className="font-medium">Крючок:</span> {variant.instant_value}</div>
            <div><span className="font-medium">Переход к офферу:</span> {variant.transition_to_course}</div>
          </>
        ) : (
          <>
            <div><span className="font-medium">Визуальный формат:</span> {variant.visual_format}</div>
            {contentType === "lead_magnet" && <div><span className="font-medium">Мгновенная ценность:</span> {variant.instant_value}</div>}
            {contentType === "lead_magnet" && <div><span className="font-medium">Причина сохранить:</span> {variant.save_reason}</div>}
            <div><span className="font-medium">Переход к офферу:</span> {variant.transition_to_course}</div>
            {variant.target_segment && <div><span className="font-medium">Целевой сегмент:</span> {variant.target_segment}</div>}
          </>
        )}
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => onSelect(variant)}>
          Выбрать
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VariantPickerModal({
  open, onOpenChange, variants, contentType, onSelect, onRegenerate, regenerating, title,
}: Props) {
  const modalTitle = title || "Выбор варианта";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden grid-rows-[auto_minmax(0,1fr)]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{modalTitle}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={onRegenerate}
              disabled={regenerating}
            >
              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Перегенерировать
            </Button>
          </div>
          <DialogDescription>
            {regenerating ? "Генерация новых вариантов..." : `Доступно вариантов: ${variants.length}`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 -mx-6 px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pb-4">
            {variants.map((v) => (
              <VariantCard key={v.id} variant={v} contentType={contentType} onSelect={onSelect} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

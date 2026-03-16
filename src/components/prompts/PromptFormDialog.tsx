import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { contentTypeLabels, contentTypeKeys, channelLabels, channelKeys, type PromptForm } from "@/lib/promptConstants";

interface PromptFormDialogProps {
  form: PromptForm;
  setField: (key: keyof PromptForm, value: any) => void;
  editId: string | null;
  saveMutation: { mutate: () => void; isPending: boolean };
}

export default function PromptFormDialog({ form, setField, editId, saveMutation }: PromptFormDialogProps) {
  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editId ? "Редактировать промпт" : "Новый промпт"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setField("slug", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Тип контента</Label>
            <Select value={form.content_type} onValueChange={(v) => setField("content_type", v)}>
              <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
              <SelectContent>
                {contentTypeKeys.map((ct) => (
                  <SelectItem key={ct} value={ct}>{contentTypeLabels[ct]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(form.content_type === "lead_magnet" || form.content_type === "expert_content" || form.content_type === "provocative_content" || form.content_type === "list_content") && form.content_type !== "case_analysis" && (
            <div className="space-y-2">
              <Label>Канал</Label>
              <Select value={form.channel || "_none"} onValueChange={(v) => setField("channel", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Выберите канал" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Без канала —</SelectItem>
                  {channelKeys.map((ch) => (
                    <SelectItem key={ch} value={ch}>{channelLabels[ch]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Порядок шага</Label>
            <Input type="number" min={1} value={form.step_order} onChange={(e) => setField("step_order", parseInt(e.target.value) || 1)} />
          </div>
          <div className="space-y-2">
            <Label>Провайдер</Label>
            <Input value={form.provider} onChange={(e) => setField("provider", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Модель</Label>
            <Input value={form.model} onChange={(e) => setField("model", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Описание</Label>
          <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Системный промпт</Label>
          <Textarea value={form.system_prompt} onChange={(e) => setField("system_prompt", e.target.value)} className="min-h-[120px] font-mono text-sm" />
        </div>
        <div className="space-y-2">
          <Label>Шаблон пользовательского промпта</Label>
          <Textarea value={form.user_prompt_template} onChange={(e) => setField("user_prompt_template", e.target.value)} className="min-h-[120px] font-mono text-sm" />
          <p className="text-xs text-muted-foreground">Переменные: {"{{program_title}}, {{audience_description}}, {{offer_type}}, {{offer_title}}, {{offer_description}}, {{lead_magnet}}, {{reference_material}}, {{list_topic}}, {{program_doc_description}}"}</p>
        </div>
        <div className="space-y-2">
          <Label>Подсказка формата вывода</Label>
          <Textarea value={form.output_format_hint} onChange={(e) => setField("output_format_hint", e.target.value)} className="font-mono text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
          <Label>Активен</Label>
        </div>
        <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </DialogContent>
  );
}

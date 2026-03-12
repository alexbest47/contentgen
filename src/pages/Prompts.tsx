import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PromptCategory = Database["public"]["Enums"]["prompt_category"];

const categoryLabels: Record<PromptCategory, string> = {
  lead_magnets: "Лид-магниты",
  slide_structure: "Структура слайдов",
  text_instagram: "Текст Instagram",
  text_vk: "Текст VK",
  text_telegram: "Текст Telegram",
  text_email: "Текст Email",
  test_generation: "Генерация теста",
  image_carousel: "Изображения карусели",
  image_post: "Изображения поста",
  image_email: "Изображение Email",
};

const categories = Object.keys(categoryLabels) as PromptCategory[];

const contentTypeLabels: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  vk: "ВКонтакте",
  email: "Email",
};

const contentTypeKeys = Object.keys(contentTypeLabels);

interface PromptForm {
  name: string;
  slug: string;
  category: PromptCategory;
  description: string;
  provider: string;
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  output_format_hint: string;
  is_active: boolean;
  content_type: string;
  step_order: number;
}

const emptyForm: PromptForm = {
  name: "", slug: "", category: "lead_magnets", description: "",
  provider: "anthropic", model: "claude-sonnet-4-20250514",
  system_prompt: "", user_prompt_template: "", output_format_hint: "", is_active: true,
  content_type: "", step_order: 1,
};

export default function Prompts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromptForm>(emptyForm);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prompts").select("*").order("step_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        content_type: form.content_type || null,
      };
      if (editId) {
        const { error } = await supabase.from("prompts").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prompts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success(editId ? "Промпт обновлён" : "Промпт создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("prompts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts"] }),
  });

  const openEdit = (prompt: any) => {
    setEditId(prompt.id);
    setForm({
      name: prompt.name, slug: prompt.slug, category: prompt.category,
      description: prompt.description ?? "", provider: prompt.provider,
      model: prompt.model, system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template,
      output_format_hint: prompt.output_format_hint ?? "", is_active: prompt.is_active,
      content_type: prompt.content_type ?? "", step_order: prompt.step_order ?? 1,
    });
    setOpen(true);
  };

  const setField = (key: keyof PromptForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  // Group prompts by content_type
  const grouped = prompts?.reduce((acc, p) => {
    const ct = (p as any).content_type || "_other";
    if (!acc[ct]) acc[ct] = [];
    acc[ct].push(p);
    return acc;
  }, {} as Record<string, typeof prompts>) ?? {};

  // Sort groups: content types first, then _other
  const groupOrder = [...contentTypeKeys.filter(k => grouped[k]), ...Object.keys(grouped).filter(k => !contentTypeKeys.includes(k) && k !== "_other"), "_other"].filter(k => grouped[k]);

  const renderPromptCard = (p: any) => (
    <Card key={p.id} className="border-l-4" style={{ borderLeftColor: p.is_active ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">Шаг {(p as any).step_order ?? 1}</Badge>
          <CardTitle className="text-base">{p.name}</CardTitle>
          <Badge variant="outline">{categoryLabels[p.category as PromptCategory] ?? p.category}</Badge>
          <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Активен" : "Выключен"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={p.is_active}
            onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, is_active: v })}
          />
          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {p.description && (
        <CardContent className="pt-0 text-sm text-muted-foreground">{p.description}</CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Управление промптами</h1>
          <p className="text-muted-foreground">Настройка промптов для генерации контента</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Создать промпт</Button>
          </DialogTrigger>
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
                  <Label>Тип контента (пайплайн)</Label>
                  <Select value={form.content_type} onValueChange={(v) => setField("content_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Без типа —</SelectItem>
                      {contentTypeKeys.map((ct) => (
                        <SelectItem key={ct} value={ct}>{contentTypeLabels[ct]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Порядок шага</Label>
                  <Input type="number" min={1} value={form.step_order} onChange={(e) => setField("step_order", parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label>Категория промпта</Label>
                  <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <p className="text-xs text-muted-foreground">Переменные: {"{{program_title}}, {{audience_description}}, {{offer_type}}, {{offer_title}}, {{offer_description}}, {{lead_magnet}}, {{lead_magnet_title}}, {{lead_magnet_description}}, {{previous_steps}}"}</p>
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
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : (
        <Accordion type="multiple" defaultValue={groupOrder} className="space-y-2">
          {groupOrder.map((groupKey) => {
            const groupPrompts = grouped[groupKey] || [];
            const label = groupKey === "_other" ? "Прочие" : contentTypeLabels[groupKey] || groupKey;
            return (
              <AccordionItem key={groupKey} value={groupKey} className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold">
                  <span className="flex items-center gap-2">
                    {label}
                    <Badge variant="secondary" className="text-xs">{groupPrompts.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {groupPrompts.map(renderPromptCard)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          {(!prompts || prompts.length === 0) && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Нет промптов</CardContent></Card>
          )}
        </Accordion>
      )}
    </div>
  );
}

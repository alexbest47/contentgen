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
}

const emptyForm: PromptForm = {
  name: "", slug: "", category: "lead_magnets", description: "",
  provider: "anthropic", model: "claude-sonnet-4-20250514",
  system_prompt: "", user_prompt_template: "", output_format_hint: "", is_active: true,
};

export default function Prompts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromptForm>(emptyForm);

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prompts").select("*").order("category");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("prompts").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prompts").insert(form);
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
    });
    setOpen(true);
  };

  const setField = (key: keyof PromptForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

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
                  <Label>Категория</Label>
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
                <p className="text-xs text-muted-foreground">Переменные: {"{{program_title}}, {{audience_description}}, {{offer_type}}, {{offer_title}}, {{offer_description}}, {{lead_magnet}}, {{lead_magnet_title}}, {{lead_magnet_description}}"}</p>
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
        <div className="space-y-3">
          {prompts?.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
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
          ))}
          {prompts?.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Нет промптов</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

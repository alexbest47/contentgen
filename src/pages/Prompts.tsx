import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import PromptFormDialog from "@/components/prompts/PromptFormDialog";
import PipelineGroup from "@/components/prompts/PipelineGroup";
import PromptStepCard from "@/components/prompts/PromptStepCard";

type PromptCategory = Database["public"]["Enums"]["prompt_category"];

export const categoryLabels: Record<PromptCategory, string> = {
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

export const categories = Object.keys(categoryLabels) as PromptCategory[];

export const contentTypeLabels: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  vk: "ВКонтакте",
  email: "Email",
};

export const subTypeLabels: Record<string, string> = {
  announcement: "Анонс",
  warmup: "Прогрев",
  conversion: "Конверсия",
};

const contentTypeKeys = Object.keys(contentTypeLabels);
const subTypeKeys = Object.keys(subTypeLabels);

export interface PromptForm {
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
  sub_type: string;
  step_order: number;
}

export const emptyForm: PromptForm = {
  name: "", slug: "", category: "lead_magnets", description: "",
  provider: "anthropic", model: "claude-sonnet-4-20250514",
  system_prompt: "", user_prompt_template: "", output_format_hint: "", is_active: true,
  content_type: "", sub_type: "", step_order: 1,
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
        sub_type: form.sub_type || null,
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
      content_type: prompt.content_type ?? "", sub_type: prompt.sub_type ?? "",
      step_order: prompt.step_order ?? 1,
    });
    setOpen(true);
  };

  const setField = (key: keyof PromptForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  // Group prompts by content_type → sub_type
  const grouped = prompts?.reduce((acc, p) => {
    const ct = (p as any).content_type || "_other";
    const st = (p as any).sub_type || "_none";
    const key = `${ct}::${st}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, typeof prompts>) ?? {};

  // Collect other prompts (no content_type)
  const otherPrompts = Object.entries(grouped)
    .filter(([k]) => k.startsWith("_other::"))
    .flatMap(([, v]) => v || []);

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
          <PromptFormDialog
            form={form}
            setField={setField}
            editId={editId}
            saveMutation={saveMutation}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="space-y-10">
          {contentTypeKeys.map((ctKey) => {
            const hasAnyPrompts = subTypeKeys.some((st) => grouped[`${ctKey}::${st}`]?.length);
            if (!hasAnyPrompts) return null;

            return (
              <div key={ctKey}>
                <h2 className="text-xl font-bold mb-4">Пайплайн: {contentTypeLabels[ctKey]}</h2>
                <div className="space-y-6">
                  {subTypeKeys.map((stKey) => {
                    const key = `${ctKey}::${stKey}`;
                    const groupPrompts = (grouped[key] || []).sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                    if (groupPrompts.length === 0) return null;

                    return (
                      <PipelineGroup
                        key={key}
                        groupKey={key}
                        label={subTypeLabels[stKey]}
                        prompts={groupPrompts}
                        onEdit={openEdit}
                        onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {otherPrompts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Прочие промпты</h2>
                <Badge variant="secondary">{otherPrompts.length}</Badge>
              </div>
              <div className="space-y-3">
                {otherPrompts.map((p: any) => (
                  <PromptStepCard
                    key={p.id}
                    prompt={p}
                    showStepNumber={false}
                    onEdit={openEdit}
                    onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
                  />
                ))}
              </div>
            </div>
          )}

          {(!prompts || prompts.length === 0) && (
            <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
          )}
        </div>
      )}
    </div>
  );
}

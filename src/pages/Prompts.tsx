import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import PromptFormDialog from "@/components/prompts/PromptFormDialog";
import PipelineGroup from "@/components/prompts/PipelineGroup";
import PromptStepCard from "@/components/prompts/PromptStepCard";
import RefinePromptDialog from "@/components/prompts/RefinePromptDialog";
import { contentTypeLabels, emptyForm, deriveCategory, tabContentTypes, pipelineContentTypes, type PromptForm } from "@/lib/promptConstants";
import CsvImportButton from "@/components/prompts/CsvImportButton";

export default function Prompts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromptForm>(emptyForm);
  const [refinePrompt, setRefinePrompt] = useState<any | null>(null);

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
        category: deriveCategory(form.content_type),
        content_type: form.content_type || null,
        sub_type: null,
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
      name: prompt.name, slug: prompt.slug,
      description: prompt.description ?? "", provider: prompt.provider,
      model: prompt.model, system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template,
      output_format_hint: prompt.output_format_hint ?? "", is_active: prompt.is_active,
      content_type: prompt.content_type ?? "",
      step_order: prompt.step_order ?? 1,
    });
    setOpen(true);
  };

  const openDuplicate = (prompt: any) => {
    setEditId(null);
    setForm({
      name: `${prompt.name} (копия)`, slug: `${prompt.slug}-copy`,
      description: prompt.description ?? "", provider: prompt.provider,
      model: prompt.model, system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template,
      output_format_hint: prompt.output_format_hint ?? "", is_active: prompt.is_active,
      content_type: prompt.content_type ?? "",
      step_order: prompt.step_order ?? 1,
    });
    setOpen(true);
  };

  const setField = (key: keyof PromptForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  // Group all prompts by content_type
  const grouped = (prompts ?? []).reduce((acc, p) => {
    const ct = (p as any).content_type || "_other";
    if (!acc[ct]) acc[ct] = [];
    acc[ct].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const renderTabContent = (contentTypes: readonly string[]) => {
    const pipelineTypes = contentTypes.filter(ct => (pipelineContentTypes as readonly string[]).includes(ct));
    const nonPipelineTypes = contentTypes.filter(ct => !(pipelineContentTypes as readonly string[]).includes(ct));

    return (
      <div className="space-y-10">
        {/* Non-pipeline prompts (lead_magnet, diagnostic) */}
        {nonPipelineTypes.map((ctKey) => {
          const groupPrompts = (grouped[ctKey] || []).sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (groupPrompts.length === 0) return null;
          return (
            <div key={ctKey}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">{contentTypeLabels[ctKey]}</h3>
                <Badge variant="secondary">{groupPrompts.length}</Badge>
              </div>
              <div className="space-y-3">
                {groupPrompts.map((p: any) => (
                  <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} onRefine={setRefinePrompt} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Pipeline prompts (instagram, telegram, vk, email) */}
        {pipelineTypes.map((ctKey) => {
          const groupPrompts = (grouped[ctKey] || []).sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (groupPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ctKey}
              groupKey={ctKey}
              label={`Пайплайн: ${contentTypeLabels[ctKey]}`}
              prompts={groupPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
              onRefine={setRefinePrompt}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Управление промптами</h1>
          <p className="text-muted-foreground">Настройка промптов для генерации контента</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton
            existingCount={prompts?.length ?? 0}
            prompts={prompts ?? []}
          />
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Создать промпт</Button>
            </DialogTrigger>
            <PromptFormDialog form={form} setField={setField} editId={editId} saveMutation={saveMutation} />
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : (prompts ?? []).length > 0 ? (
        <Tabs defaultValue="lead_magnet">
          <TabsList>
            <TabsTrigger value="lead_magnet">Лидмагнит</TabsTrigger>
            <TabsTrigger value="diagnostic">Диагностики</TabsTrigger>
          </TabsList>
          <TabsContent value="lead_magnet">
            {renderTabContent(tabContentTypes.lead_magnet)}
          </TabsContent>
          <TabsContent value="diagnostic">
            {renderTabContent(tabContentTypes.diagnostic)}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
      )}

      <RefinePromptDialog
        prompt={refinePrompt}
        open={!!refinePrompt}
        onOpenChange={(o) => { if (!o) setRefinePrompt(null); }}
      />
    </div>
  );
}

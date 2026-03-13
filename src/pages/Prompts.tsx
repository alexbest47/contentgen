import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import PromptFormDialog from "@/components/prompts/PromptFormDialog";
import PipelineGroup from "@/components/prompts/PipelineGroup";
import PromptStepCard from "@/components/prompts/PromptStepCard";
import { contentTypeLabels, contentTypeKeys, emptyForm, deriveCategory, type PromptForm } from "@/lib/promptConstants";
import { OFFER_TYPES, getOfferTypeLabel } from "@/lib/offerTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CsvImportButton from "@/components/prompts/CsvImportButton";

export default function Prompts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromptForm>(emptyForm);
  const [activeTab, setActiveTab] = useState<string>("");

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
        offer_type: form.offer_type || null,
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
      step_order: prompt.step_order ?? 1, offer_type: prompt.offer_type ?? "",
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
      step_order: prompt.step_order ?? 1, offer_type: prompt.offer_type ?? "",
    });
    setOpen(true);
  };

  const setField = (key: keyof PromptForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const offerTypesWithPrompts = OFFER_TYPES.filter((ot) =>
    prompts?.some((p: any) => p.offer_type === ot.key)
  );

  const otherPrompts = prompts?.filter((p: any) => !p.offer_type) ?? [];

  const renderPipelinesForOfferType = (offerTypeKey: string) => {
    const offerPrompts = prompts?.filter((p: any) => p.offer_type === offerTypeKey) ?? [];

    const grouped = offerPrompts.reduce((acc, p) => {
      const ct = (p as any).content_type || "_other";
      if (!acc[ct]) acc[ct] = [];
      acc[ct].push(p);
      return acc;
    }, {} as Record<string, typeof offerPrompts>);

    const otherInGroup = grouped["_other"] ?? [];

    return (
      <div className="space-y-10">
        {contentTypeKeys.map((ctKey) => {
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
            />
          );
        })}

        {otherInGroup.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Прочие промпты</h3>
              <Badge variant="secondary">{otherInGroup.length}</Badge>
            </div>
            <div className="space-y-3">
              {otherInGroup.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={false} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}
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
          {activeTab && activeTab !== "_other" && (
            <CsvImportButton
              offerTypeKey={activeTab}
              existingCount={prompts?.filter((p: any) => p.offer_type === activeTab).length ?? 0}
              prompts={prompts?.filter((p: any) => p.offer_type === activeTab) ?? []}
            />
          )}
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
      ) : offerTypesWithPrompts.length > 0 ? (
        <Tabs defaultValue={offerTypesWithPrompts[0]?.key} onValueChange={setActiveTab} value={activeTab || offerTypesWithPrompts[0]?.key}>
          <TabsList>
            {offerTypesWithPrompts.map((ot) => (
              <TabsTrigger key={ot.key} value={ot.key}>{ot.label}</TabsTrigger>
            ))}
            {otherPrompts.length > 0 && <TabsTrigger value="_other">Прочие</TabsTrigger>}
          </TabsList>

          {offerTypesWithPrompts.map((ot) => (
            <TabsContent key={ot.key} value={ot.key}>
              {renderPipelinesForOfferType(ot.key)}
            </TabsContent>
          ))}

          {otherPrompts.length > 0 && (
            <TabsContent value="_other">
              <div className="space-y-3">
                {otherPrompts.map((p: any) => (
                  <PromptStepCard key={p.id} prompt={p} showStepNumber={false} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
      )}
    </div>
  );
}

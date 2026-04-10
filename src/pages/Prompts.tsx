import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import PromptFormDialog from "@/components/prompts/PromptFormDialog";
import PipelineGroup from "@/components/prompts/PipelineGroup";
import PromptStepCard from "@/components/prompts/PromptStepCard";
import { contentTypeLabels, channelLabels, channelKeys, emptyForm, deriveCategory, type PromptForm } from "@/lib/promptConstants";
import ExportTxtButton from "@/components/prompts/ExportTxtButton";
import ImportTxtButton from "@/components/prompts/ImportTxtButton";

export default function Prompts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromptForm>(emptyForm);
  const [activeTab, setActiveTab] = useState<string>("content_prep");

  const CONTENT_PREP_SLUGS = [
    "lead-magnets-default",
    "ref-material-general",
    "expert-content-topics",
    "provocative-topics",
    "list-topics-generation",
    "testimonial-angles",
    "myth-busting-topics",
    "objection-handling-topics",
  ];
  const POST_CHANNELS: { key: string; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "telegram", label: "Telegram" },
    { key: "vk", label: "ВКонтакте" },
  ];
  const CONTENT_TYPE_ORDER = [
    "from_scratch",
    "trust_ai",
    "webinar_invite",
    "webinar_invite_2",
    "direct_offer",
    "multi_offer",
    "transformation_story",
    "lead_magnet",
    "reference_material",
    "expert_content",
    "provocative_content",
    "list_content",
    "testimonial_content",
    "myth_busting",
    "objection_handling",
  ];

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
        category: deriveCategory(form.content_type, form.channel),
        content_type: form.content_type || null,
        channel: form.channel || null,
        sub_type: null,
      };
      if (editId) {
        // Archive current version before updating
        const { data: current } = await supabase
          .from("prompts")
          .select("system_prompt, user_prompt_template, output_format_hint, model, provider")
          .eq("id", editId)
          .single();
        if (current) {
          const { data: maxV } = await supabase
            .from("prompt_versions")
            .select("version_number")
            .eq("prompt_id", editId)
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          await supabase.from("prompt_versions").insert({
            prompt_id: editId,
            version_number: (maxV?.version_number ?? 0) + 1,
            system_prompt: current.system_prompt,
            user_prompt_template: current.user_prompt_template,
            output_format_hint: current.output_format_hint,
            model: current.model,
            provider: current.provider,
            change_type: "manual",
          });
        }
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
      content_type: prompt.content_type ?? "lead_magnet",
      channel: prompt.channel ?? "",
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
      content_type: prompt.content_type ?? "lead_magnet",
      channel: prompt.channel ?? "",
      step_order: prompt.step_order ?? 1,
    });
    setOpen(true);
  };

  const setField = (key: keyof PromptForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  // Filter prompts by content_type for tabs
  const leadMagnetPrompts = (prompts ?? []).filter((p: any) => p.content_type === "lead_magnet");
  const referenceMaterialPrompts = (prompts ?? []).filter((p: any) => p.content_type === "reference_material");
  const diagnosticPrompts = (prompts ?? []).filter((p: any) => p.content_type === "diagnostic");
  const expertContentPrompts = (prompts ?? []).filter((p: any) => p.content_type === "expert_content");
  const provocativeContentPrompts = (prompts ?? []).filter((p: any) => p.content_type === "provocative_content");
  const listContentPrompts = (prompts ?? []).filter((p: any) => p.content_type === "list_content");
  const caseAnalysisPrompts = (prompts ?? []).filter((p: any) => p.content_type === "case_analysis");
  const testimonialContentPrompts = (prompts ?? []).filter((p: any) => p.content_type === "testimonial_content");
  const mythBustingPrompts = (prompts ?? []).filter((p: any) => p.content_type === "myth_busting");
  const objectionHandlingPrompts = (prompts ?? []).filter((p: any) => p.content_type === "objection_handling");
  const emailBuilderPrompts = (prompts ?? []).filter((p: any) => p.content_type === "email_builder");
  const botBuilderPrompts = (prompts ?? []).filter((p: any) => p.content_type === "bot_builder");
  const pdfMaterialPrompts = (prompts ?? []).filter((p: any) => p.content_type === "pdf_material");
  const landingBlockPrompts = (prompts ?? []).filter((p: any) => p.content_type === "landing_block_content");
  const competitorAnalysisPrompts = (prompts ?? []).filter((p: any) => p.content_type === "competitor_analysis");

  // Group lead_magnet prompts: those without channel are "general", others grouped by channel
  const generalLeadMagnetPrompts = leadMagnetPrompts
    .filter((p: any) => !p.channel)
    .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

  const renderLeadMagnetTab = () => (
    <div className="space-y-10">
      {/* General lead magnet prompts (no channel) */}
      {generalLeadMagnetPrompts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">{contentTypeLabels.lead_magnet}</h3>
            <Badge variant="secondary">{generalLeadMagnetPrompts.length}</Badge>
          </div>
          <div className="space-y-3">
            {generalLeadMagnetPrompts.map((p: any) => (
              <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
            ))}
          </div>
        </div>
      )}

      {/* Pipeline prompts grouped by channel */}
      {channelKeys.map((ch) => {
        const channelPrompts = leadMagnetPrompts
          .filter((p: any) => p.channel === ch)
          .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
        if (channelPrompts.length === 0) return null;
        return (
          <PipelineGroup
            key={ch}
            groupKey={ch}
            label={`Пайплайн: ${channelLabels[ch]}`}
            prompts={channelPrompts}
            onEdit={openEdit}
            onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
            onDuplicate={openDuplicate}
           
          />
        );
      })}
    </div>
  );

  const renderReferenceMaterialTab = () => {
    const generalRefPrompts = referenceMaterialPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalRefPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.reference_material}</h3>
              <Badge variant="secondary">{generalRefPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalRefPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = referenceMaterialPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
            />
          );
        })}
      </div>
    );
  };

  const renderDiagnosticTab = () => {
    const sorted = diagnosticPrompts.sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
    return (
      <div className="space-y-3">
        {sorted.length > 0 ? sorted.map((p: any) => (
          <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
        )) : (
          <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
        )}
      </div>
    );
  };

  const renderExpertContentTab = () => {
    const generalExpertPrompts = expertContentPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalExpertPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.expert_content}</h3>
              <Badge variant="secondary">{generalExpertPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalExpertPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = expertContentPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
            />
          );
        })}
      </div>
    );
  };

  const renderProvocativeContentTab = () => {
    const generalPrompts = provocativeContentPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.provocative_content}</h3>
              <Badge variant="secondary">{generalPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = provocativeContentPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
            />
          );
        })}
      </div>
    );
  };

  const renderListContentTab = () => {
    const generalPrompts = listContentPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.list_content}</h3>
              <Badge variant="secondary">{generalPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = listContentPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
            />
          );
        })}
      </div>
    );
  };

  const renderCaseAnalysisTab = () => {
    const sorted = caseAnalysisPrompts.sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
    return (
      <div className="space-y-3">
        {sorted.length > 0 ? sorted.map((p: any) => (
          <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
        )) : (
          <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
        )}
      </div>
    );
  };

  const renderTestimonialContentTab = () => {
    const generalPrompts = testimonialContentPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.testimonial_content}</h3>
              <Badge variant="secondary">{generalPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = testimonialContentPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
            />
          );
        })}
      </div>
    );
  };

  const renderMythBustingTab = () => {
    const generalPrompts = mythBustingPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.myth_busting}</h3>
              <Badge variant="secondary">{generalPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = mythBustingPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
            />
          );
        })}
      </div>
    );
  };

  const renderObjectionHandlingTab = () => {
    const generalPrompts = objectionHandlingPrompts
      .filter((p: any) => !p.channel)
      .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));

    return (
      <div className="space-y-10">
        {generalPrompts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">{contentTypeLabels.objection_handling}</h3>
              <Badge variant="secondary">{generalPrompts.length}</Badge>
            </div>
            <div className="space-y-3">
              {generalPrompts.map((p: any) => (
                <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
              ))}
            </div>
          </div>
        )}

        {channelKeys.map((ch) => {
          const channelPrompts = objectionHandlingPrompts
            .filter((p: any) => p.channel === ch)
            .sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
          if (channelPrompts.length === 0) return null;
          return (
            <PipelineGroup
              key={ch}
              groupKey={ch}
              label={`Пайплайн: ${channelLabels[ch]}`}
              prompts={channelPrompts}
              onEdit={openEdit}
              onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
              onDuplicate={openDuplicate}
             
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
          <ImportTxtButton />
          <ExportTxtButton prompts={(prompts ?? []).filter(p => p.content_type === activeTab)} contentType={activeTab} />
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
        <Tabs defaultValue="content_prep" onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="content_prep">Подготовка контента</TabsTrigger>
            <TabsTrigger value="posts">Создание постов</TabsTrigger>
            <TabsTrigger value="carousels">Создание каруселей</TabsTrigger>
            <TabsTrigger value="email_builder">Конструктор e-mail</TabsTrigger>
            <TabsTrigger value="bot_builder">Конструктор ботов</TabsTrigger>
            <TabsTrigger value="diagnostic">Подготовка диагностик</TabsTrigger>
            <TabsTrigger value="case_analysis">Подготовка кейсов</TabsTrigger>
            <TabsTrigger value="landing_block_content">Конструктор лендингов</TabsTrigger>
            <TabsTrigger value="pdf_material">Генерация PDF</TabsTrigger>
            <TabsTrigger value="competitor_analysis">Анализ конкурентов</TabsTrigger>
          </TabsList>

          <TabsContent value="content_prep">
            {(() => {
              const list = (prompts ?? [])
                .filter((p: any) => CONTENT_PREP_SLUGS.includes(p.slug))
                .sort(
                  (a: any, b: any) =>
                    CONTENT_PREP_SLUGS.indexOf(a.slug) - CONTENT_PREP_SLUGS.indexOf(b.slug),
                );
              return (
                <div className="space-y-3">
                  {list.length > 0 ? (
                    list.map((p: any) => (
                      <PromptStepCard
                        key={p.id}
                        prompt={p}
                        showStepNumber={false}
                        onEdit={openEdit}
                        onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
                        onDuplicate={openDuplicate}
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground border rounded-lg">
                      Нет промптов
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {(["posts", "carousels"] as const).map((kind) => (
            <TabsContent key={kind} value={kind}>
              <div className="space-y-10">
                {POST_CHANNELS.map((ch) => {
                  const suffix = kind === "posts" ? "-post" : "-carousel";
                  const channelPrompts = (prompts ?? [])
                    .filter(
                      (p: any) =>
                        p.channel === ch.key &&
                        typeof p.slug === "string" &&
                        p.slug.endsWith(suffix) &&
                        CONTENT_TYPE_ORDER.includes(p.content_type),
                    )
                    .sort(
                      (a: any, b: any) =>
                        CONTENT_TYPE_ORDER.indexOf(a.content_type) -
                        CONTENT_TYPE_ORDER.indexOf(b.content_type),
                    );
                  if (channelPrompts.length === 0) return null;
                  return (
                    <PipelineGroup
                      key={ch.key}
                      groupKey={`${kind}-${ch.key}`}
                      label={ch.label}
                      prompts={channelPrompts}
                      onEdit={openEdit}
                      onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })}
                      onDuplicate={openDuplicate}
                    />
                  );
                })}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="diagnostic">
            {renderDiagnosticTab()}
          </TabsContent>
          <TabsContent value="case_analysis">
            {renderCaseAnalysisTab()}
          </TabsContent>
            <TabsContent value="email_builder">
               {(() => {
                 const knownChannels = ['webinar_before', 'webinar_after', 'warming', 'closed_lead'];
                 const general = emailBuilderPrompts.filter((p: any) => !p.channel || !knownChannels.includes(p.channel));
                 const webinarBefore = emailBuilderPrompts.filter((p: any) => p.channel === 'webinar_before').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                 const webinarAfter = emailBuilderPrompts.filter((p: any) => p.channel === 'webinar_after').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                 const warming = emailBuilderPrompts.filter((p: any) => p.channel === 'warming').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                 const closedLead = emailBuilderPrompts.filter((p: any) => p.channel === 'closed_lead').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                 const sortedGeneral = general.sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                 const hasWebinar = webinarBefore.length > 0 || webinarAfter.length > 0;
                 const hasWarming = warming.length > 0;
                 const hasClosedLead = closedLead.length > 0;
                 return (
                   <div className="space-y-8">
                     {sortedGeneral.length > 0 && (
                       <PipelineGroup groupKey="email_general" label="Генерация писем" prompts={sortedGeneral} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                     )}
                     {hasWebinar && (
                       <div className="space-y-6">
                         <Separator />
                         <h2 className="text-xl font-bold">Письма ДО и ПОСЛЕ вебинара</h2>
                         {webinarBefore.length > 0 && (
                           <PipelineGroup groupKey="webinar_before" label="ДО вебинара" prompts={webinarBefore} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                         )}
                         {webinarAfter.length > 0 && (
                           <PipelineGroup groupKey="webinar_after" label="ПОСЛЕ вебинара" prompts={webinarAfter} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                         )}
                       </div>
                     )}
                     {hasWarming && (
                       <div className="space-y-6">
                         <Separator />
                         <h2 className="text-xl font-bold">Прогрев после заявки</h2>
                         <PipelineGroup groupKey="warming" label="Прогрев после заявки (7 писем)" prompts={warming} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                       </div>
                     )}
                     {hasClosedLead && (
                       <div className="space-y-6">
                         <Separator />
                         <h2 className="text-xl font-bold">Письма после закрытой заявки</h2>
                         <PipelineGroup groupKey="closed_lead" label="Письма после закрытой заявки (4 письма + «Не дозвонились»)" prompts={closedLead} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                       </div>
                     )}
                     {sortedGeneral.length === 0 && !hasWebinar && !hasWarming && !hasClosedLead && (
                       <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
                     )}
                   </div>
                 );
               })()}
             </TabsContent>
            <TabsContent value="bot_builder">
              {(() => {
                const before = botBuilderPrompts.filter((p: any) => p.channel === 'bot_webinar_before').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                const after = botBuilderPrompts.filter((p: any) => p.channel === 'bot_webinar_after').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                const warming = botBuilderPrompts.filter((p: any) => p.channel === 'bot_warming').sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                const has = before.length > 0 || after.length > 0 || warming.length > 0;
                return (
                  <div className="space-y-8">
                    {has ? (
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold">Сообщения ДО и ПОСЛЕ вебинара</h2>
                        {before.length > 0 && (
                          <PipelineGroup groupKey="bot_webinar_before" label="ДО вебинара" prompts={before} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                        )}
                        {after.length > 0 && (
                          <PipelineGroup groupKey="bot_webinar_after" label="ПОСЛЕ вебинара" prompts={after} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                        )}
                        {warming.length > 0 && (
                          <>
                            <h2 className="text-xl font-bold pt-4">Прогрев после заявки (бот)</h2>
                            <PipelineGroup groupKey="bot_warming" label="Прогрев после заявки (7 сообщений)" prompts={warming} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
            <TabsContent value="pdf_material">
              {(() => {
                const sorted = pdfMaterialPrompts.sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                return (
                  <div className="space-y-3">
                    {sorted.length > 0 ? sorted.map((p: any) => (
                      <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                    )) : (
                      <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
            <TabsContent value="landing_block_content">
              {(() => {
                const sorted = landingBlockPrompts.sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                return (
                  <div className="space-y-3">
                    {sorted.length > 0 ? sorted.map((p: any) => (
                      <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                    )) : (
                      <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
            <TabsContent value="competitor_analysis">
              {(() => {
                const sorted = competitorAnalysisPrompts.sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
                return (
                  <div className="space-y-3">
                    {sorted.length > 0 ? sorted.map((p: any) => (
                      <PromptStepCard key={p.id} prompt={p} showStepNumber={true} onEdit={openEdit} onToggle={(id, is_active) => toggleMutation.mutate({ id, is_active })} onDuplicate={openDuplicate} />
                    )) : (
                      <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
        </Tabs>
      ) : (
        <div className="py-8 text-center text-muted-foreground border rounded-lg">Нет промптов</div>
      )}
    </div>
  );
}

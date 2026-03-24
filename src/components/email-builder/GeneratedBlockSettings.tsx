import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ImageIcon, Info, Plus } from "lucide-react";
import { type EmailBlock } from "./BlockCanvas";
import { OFFER_TYPES } from "@/lib/offerTypes";
import VariantPickerModal from "./VariantPickerModal";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Props {
  block: EmailBlock;
  colorSchemeId: string | null;
  onUpdateConfig: (config: Record<string, any>) => void;
  onGenerate: () => void;
  onGenerateImage: () => void;
  generating: boolean;
  generatingImage: boolean;
  userId: string;
}

// Block types that use single-level variant selection
const SINGLE_LEVEL_TYPES = [
  "lead_magnet", "reference_material", "expert_content",
  "provocative_content", "list_content", "myth_busting",
];

// Block types that use two-level selection (item + angle)
const TWO_LEVEL_TYPES = ["testimonial_content", "objection_handling"];

const VARIANT_LABELS: Record<string, { plural: string; singular: string; action: string }> = {
  lead_magnet: { plural: "лид-магнитов", singular: "лид-магнит", action: "Выбрать лид-магнит" },
  reference_material: { plural: "справочных материалов", singular: "справочный материал", action: "Выбрать материал" },
  expert_content: { plural: "тем", singular: "тему", action: "Выбрать тему" },
  provocative_content: { plural: "тем", singular: "тему", action: "Выбрать тему" },
  list_content: { plural: "вариантов списка", singular: "список", action: "Выбрать список" },
  myth_busting: { plural: "мифов", singular: "миф", action: "Выбрать миф" },
  testimonial_content: { plural: "углов подачи", singular: "угол", action: "Выбрать угол" },
  objection_handling: { plural: "углов подачи", singular: "угол", action: "Выбрать угол" },
};

const NEW_PROJECT_VALUE = "__new__";

export default function GeneratedBlockSettings({
  block, onUpdateConfig, onGenerate, onGenerateImage, generating, generatingImage, userId,
}: Props) {
  const config = block.config;
  const queryClient = useQueryClient();
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const setConfig = (key: string, value: any) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  // ── Data queries ──
  const { data: programs } = useQuery({
    queryKey: ["paid_programs_list"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: offers } = useQuery({
    queryKey: ["offers_for_program", config.program_id, config.offer_type],
    queryFn: async () => {
      if (!config.program_id) return [];
      let q = supabase.from("offers").select("id, title").eq("program_id", config.program_id).eq("is_archived", false);
      if (config.offer_type) q = q.eq("offer_type", config.offer_type);
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!config.program_id,
  });

  // ── Variants (lead_magnets) for single-level blocks ──
  const isSingleLevel = SINGLE_LEVEL_TYPES.includes(block.block_type);
  const isTwoLevel = TWO_LEVEL_TYPES.includes(block.block_type);

  // For single-level: find ALL projects matching offer_id + content_type
  const { data: variantProjects } = useQuery({
    queryKey: ["variant_projects", config.offer_id, block.block_type],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, status, created_at")
        .eq("offer_id", config.offer_id)
        .eq("content_type", block.block_type)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isSingleLevel && !!config.offer_id,
  });

  // Selected project for single-level
  const selectedProjectId = config.selected_project_id;
  const activeProjectId = selectedProjectId || variantProjects?.[0]?.id;

  const { data: variants } = useQuery({
    queryKey: ["variants_for_block", activeProjectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_magnets")
        .select("*")
        .eq("project_id", activeProjectId!)
        .order("created_at");
      return data ?? [];
    },
    enabled: isSingleLevel && !!activeProjectId,
  });

  // ── Two-level: cases / objections ──
  const { data: cases } = useQuery({
    queryKey: ["cases_for_builder"],
    queryFn: async () => {
      const { data } = await supabase.from("case_classifications").select("id, file_name, classification_json");
      return data ?? [];
    },
    enabled: block.block_type === "testimonial_content",
  });

  const { data: objections } = useQuery({
    queryKey: ["objections_for_builder", config.program_id],
    queryFn: async () => {
      if (!config.program_id) return [];
      const { data } = await supabase.from("objections").select("id, objection_text").eq("program_id", config.program_id);
      return data ?? [];
    },
    enabled: block.block_type === "objection_handling" && !!config.program_id,
  });

  // For two-level: find ALL projects matching offer_id + content_type + case/objection
  const twoLevelItemId = block.block_type === "testimonial_content" ? config.case_id : config.objection_id;

  const { data: angleProjects } = useQuery({
    queryKey: ["angle_projects", config.offer_id, block.block_type, twoLevelItemId],
    queryFn: async () => {
      let q = supabase
        .from("projects")
        .select("id, title, status, created_at")
        .eq("offer_id", config.offer_id)
        .eq("content_type", block.block_type)
        .order("created_at", { ascending: false });
      if (block.block_type === "testimonial_content") {
        q = q.eq("selected_case_id", twoLevelItemId);
      } else {
        q = q.eq("selected_objection_id", twoLevelItemId);
      }
      const { data } = await q;
      return data ?? [];
    },
    enabled: isTwoLevel && !!config.offer_id && !!twoLevelItemId,
  });

  // Selected project for two-level
  const activeAngleProjectId = config.selected_project_id || angleProjects?.[0]?.id;

  const { data: angles } = useQuery({
    queryKey: ["angles_for_block", activeAngleProjectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_magnets")
        .select("*")
        .eq("project_id", activeAngleProjectId!)
        .order("created_at");
      return data ?? [];
    },
    enabled: isTwoLevel && !!activeAngleProjectId,
  });

  // ── Selected variant lookup ──
  const selectedVariantId = config.selected_variant_id;
  const allVariants = isSingleLevel ? (variants ?? []) : (angles ?? []);
  const selectedVariant = allVariants.find((v: any) => v.id === selectedVariantId);

  // ── Create new project + generate variants ──
  const createProjectAndGenerate = async () => {
    if (!config.offer_id) return;
    setGeneratingVariants(true);
    try {
      const offerTitle = offers?.find(o => o.id === config.offer_id)?.title || "Email Builder";
      const insertData: any = {
        offer_id: config.offer_id,
        content_type: block.block_type,
        title: `[Email] ${offerTitle}`,
        created_by: userId,
      };
      if (block.block_type === "testimonial_content") insertData.selected_case_id = twoLevelItemId;
      if (block.block_type === "objection_handling") insertData.selected_objection_id = twoLevelItemId;

      const { data: newProject, error } = await supabase
        .from("projects")
        .insert(insertData)
        .select("id")
        .single();
      if (error) throw error;

      const body: any = { project_id: newProject.id, content_type: block.block_type };
      if (block.block_type === "testimonial_content") body.case_classification_id = twoLevelItemId;
      if (block.block_type === "objection_handling") body.selected_objection_id = twoLevelItemId;

      await supabase.functions.invoke("enqueue-task", {
        body: {
          function_name: "generate-lead-magnets",
          payload: body,
          display_title: `Генерация вариантов: ${block.block_type}`,
          lane: "claude",
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["variant_projects"] });
      await queryClient.invalidateQueries({ queryKey: ["angle_projects"] });
      await queryClient.invalidateQueries({ queryKey: ["variants_for_block"] });
      await queryClient.invalidateQueries({ queryKey: ["angles_for_block"] });

      onUpdateConfig({ ...config, selected_project_id: newProject.id, selected_variant_id: undefined });
      toast.success("Новый проект создан, варианты сгенерированы");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setGeneratingVariants(false);
    }
  };

  // ── Regenerate variants for current project ──
  const regenerateVariants = async () => {
    const projectId = isSingleLevel ? activeProjectId : activeAngleProjectId;
    if (!projectId) return;
    setGeneratingVariants(true);
    try {
      const body: any = { project_id: projectId, content_type: block.block_type };
      if (block.block_type === "testimonial_content") body.case_classification_id = twoLevelItemId;
      if (block.block_type === "objection_handling") body.selected_objection_id = twoLevelItemId;

      await supabase.functions.invoke("enqueue-task", {
        body: {
          function_name: "generate-lead-magnets",
          payload: body,
          display_title: `Перегенерация вариантов: ${block.block_type}`,
          lane: "claude",
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["variants_for_block"] });
      await queryClient.invalidateQueries({ queryKey: ["angles_for_block"] });

      if (selectedVariantId) {
        setConfig("selected_variant_id", undefined);
      }
      toast.success("Варианты перегенерированы");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации вариантов");
    } finally {
      setGeneratingVariants(false);
    }
  };

  const handleSelectVariant = (variant: any) => {
    setConfig("selected_variant_id", variant.id);
    setPickerOpen(false);
  };

  const handleProjectChange = (value: string) => {
    if (value === NEW_PROJECT_VALUE) {
      createProjectAndGenerate();
    } else {
      onUpdateConfig({ ...config, selected_project_id: value, selected_variant_id: undefined });
    }
  };

  const labels = VARIANT_LABELS[block.block_type] || { plural: "вариантов", singular: "вариант", action: "Выбрать" };
  const offerTypes = OFFER_TYPES.map((t) => [t.key, t.label] as const);

  // ── Determine if generate block button should be enabled ──
  const hasVariantSelected = !!selectedVariantId;
  const canGenerate = !!config.program_id && !!config.offer_id && hasVariantSelected;

  // Current projects list for display
  const currentProjects = isSingleLevel ? (variantProjects ?? []) : (angleProjects ?? []);
  const currentActiveProjectId = isSingleLevel ? activeProjectId : activeAngleProjectId;
  const showProjectSelector = isSingleLevel
    ? !!config.offer_id
    : (isTwoLevel && !!config.offer_id && !!twoLevelItemId);

  return (
    <div className="space-y-4">
      {/* 1. Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Режим блока</Label>
        <RadioGroup value={config.mode || "text_only"} onValueChange={(v) => setConfig("mode", v)}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="text_only" id={`mode-text-${block.id}`} />
            <Label htmlFor={`mode-text-${block.id}`} className="text-sm">Только текст</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="header_image" id={`mode-header-${block.id}`} />
            <Label htmlFor={`mode-header-${block.id}`} className="text-sm">Заголовок + текст</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="schema_image" id={`mode-schema-${block.id}`} />
            <Label htmlFor={`mode-schema-${block.id}`} className="text-sm">Текст + схема</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 2. Program */}
      <div className="space-y-1.5">
        <Label className="text-xs">Платная программа</Label>
        <Select value={config.program_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, program_id: v, offer_id: "", selected_project_id: undefined, selected_variant_id: undefined })}>
          <SelectTrigger><SelectValue placeholder="Выберите программу" /></SelectTrigger>
          <SelectContent>
            {programs?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Offer type */}
      <div className="space-y-1.5">
        <Label className="text-xs">Тип оффера</Label>
        <Select value={config.offer_type || ""} onValueChange={(v) => onUpdateConfig({ ...config, offer_type: v, offer_id: "", selected_project_id: undefined, selected_variant_id: undefined })}>
          <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
          <SelectContent>
            {offerTypes.map(([key, label]) => (
              <SelectItem key={key} value={key}>{String(label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Offer */}
      <div className="space-y-1.5">
        <Label className="text-xs">Оффер</Label>
        <Select value={config.offer_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, offer_id: v, selected_project_id: undefined, selected_variant_id: undefined })}>
          <SelectTrigger><SelectValue placeholder="Выберите оффер" /></SelectTrigger>
          <SelectContent>
            {offers?.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── TWO-LEVEL: Step 1 — item selection ── */}
      {block.block_type === "testimonial_content" && config.offer_id && (
        <div className="space-y-1.5">
          <Label className="text-xs">Кейс</Label>
          {cases && cases.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Для этой программы нет кейсов.</span>
              </div>
              <Link to="/case-management" className="text-xs text-primary hover:underline">
                Добавить в «Управление кейсами» →
              </Link>
            </div>
          ) : (
            <Select value={config.case_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, case_id: v, selected_project_id: undefined, selected_variant_id: undefined })}>
              <SelectTrigger><SelectValue placeholder="Выберите кейс" /></SelectTrigger>
              <SelectContent>
                {cases?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.file_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {block.block_type === "objection_handling" && config.offer_id && (
        <div className="space-y-1.5">
          <Label className="text-xs">Возражение</Label>
          {objections && objections.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Для этой программы нет возражений.</span>
              </div>
              <Link to="/objections" className="text-xs text-primary hover:underline">
                Добавить в «Работа с возражениями» →
              </Link>
            </div>
          ) : (
            <Select value={config.objection_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, objection_id: v, selected_project_id: undefined, selected_variant_id: undefined })}>
              <SelectTrigger><SelectValue placeholder="Выберите возражение" /></SelectTrigger>
              <SelectContent>
                {objections?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.objection_text}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* ── Project selector ── */}
      {showProjectSelector && (
        <div className="space-y-1.5">
          <Label className="text-xs">Проект с вариантами</Label>
          {currentProjects.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 space-y-2">
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Для этого оффера ещё нет проектов с {labels.plural}.</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-1.5"
                onClick={createProjectAndGenerate}
                disabled={generatingVariants}
              >
                {generatingVariants ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Создать проект и сгенерировать
              </Button>
            </div>
          ) : (
            <Select
              value={currentActiveProjectId || ""}
              onValueChange={handleProjectChange}
              disabled={generatingVariants}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {currentProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} ({format(new Date(p.created_at), "dd.MM.yy")})
                  </SelectItem>
                ))}
                <SelectItem value={NEW_PROJECT_VALUE}>
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Создать новый проект
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* ── Variant selection (shared for single-level and two-level) ── */}
      {showProjectSelector && currentProjects.length > 0 && currentActiveProjectId && (
        <VariantSelectionBlock
          variants={allVariants}
          selectedVariant={selectedVariant}
          labels={labels}
          contentType={block.block_type}
          generatingVariants={generatingVariants}
          onRegenerate={regenerateVariants}
          onOpenPicker={() => setPickerOpen(true)}
          onClearSelection={() => setConfig("selected_variant_id", undefined)}
        />
      )}

      {/* Generate block button */}
      <Button
        className="w-full gap-2"
        onClick={onGenerate}
        disabled={generating || !canGenerate}
      >
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {block.generated_html ? "Перегенерировать блок" : "Сгенерировать блок"}
      </Button>

      {/* Generate image button */}
      {(config.mode === "header_image" || config.mode === "schema_image") && block.generated_html && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onGenerateImage}
          disabled={generatingImage || !block.banner_image_prompt}
        >
          {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          {block.banner_image_url ? "Перегенерировать изображение" : "Сгенерировать изображение"}
        </Button>
      )}

      {/* Variant picker modal */}
      <VariantPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        variants={allVariants}
        contentType={block.block_type}
        onSelect={handleSelectVariant}
        onRegenerate={regenerateVariants}
        regenerating={generatingVariants}
        title={`Выбор: ${labels.plural}`}
      />
    </div>
  );
}

// ── Sub-component for variant selection UI ──
function VariantSelectionBlock({
  variants, selectedVariant, labels, contentType, generatingVariants,
  onRegenerate, onOpenPicker, onClearSelection,
}: {
  variants: any[];
  selectedVariant: any;
  labels: { plural: string; singular: string; action: string };
  contentType: string;
  generatingVariants: boolean;
  onRegenerate: () => void;
  onOpenPicker: () => void;
  onClearSelection: () => void;
}) {
  const hasVariants = variants.length > 0;

  if (!hasVariants) {
    return (
      <div className="rounded-md border border-dashed p-3 space-y-2">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>В этом проекте нет {labels.plural}. Перегенерируйте или выберите другой проект.</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full gap-1.5"
          onClick={onRegenerate}
          disabled={generatingVariants}
        >
          {generatingVariants ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Перегенерировать варианты
        </Button>
      </div>
    );
  }

  // Scenario B: variants exist
  return (
    <div className="rounded-md border p-3 space-y-2">
      <Label className="text-xs">Выбранный вариант</Label>
      {selectedVariant ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{selectedVariant.title}</span>
          <button className="text-xs text-primary hover:underline shrink-0" onClick={onOpenPicker}>
            Изменить
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Вариант не выбран</p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onOpenPicker}
      >
        {selectedVariant ? "Изменить выбор" : labels.action}
      </Button>
    </div>
  );
}

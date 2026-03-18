import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ImageIcon, Info } from "lucide-react";
import { type EmailBlock } from "./BlockCanvas";
import { OFFER_TYPES } from "@/lib/offerTypes";
import VariantPickerModal from "./VariantPickerModal";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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

  // For single-level: find project matching offer_id + content_type
  const { data: variantProject } = useQuery({
    queryKey: ["variant_project", config.offer_id, block.block_type],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, status")
        .eq("offer_id", config.offer_id)
        .eq("content_type", block.block_type)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    enabled: isSingleLevel && !!config.offer_id,
  });

  const { data: variants } = useQuery({
    queryKey: ["variants_for_block", variantProject?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_magnets")
        .select("*")
        .eq("project_id", variantProject!.id)
        .order("created_at");
      return data ?? [];
    },
    enabled: isSingleLevel && !!variantProject?.id,
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

  // For two-level: find project matching offer_id + content_type + case/objection
  const twoLevelItemId = block.block_type === "testimonial_content" ? config.case_id : config.objection_id;

  const { data: angleProject } = useQuery({
    queryKey: ["angle_project", config.offer_id, block.block_type, twoLevelItemId],
    queryFn: async () => {
      let q = supabase
        .from("projects")
        .select("id, status")
        .eq("offer_id", config.offer_id)
        .eq("content_type", block.block_type)
        .order("created_at", { ascending: false })
        .limit(1);
      if (block.block_type === "testimonial_content") {
        q = q.eq("selected_case_id", twoLevelItemId);
      } else {
        q = q.eq("selected_objection_id", twoLevelItemId);
      }
      const { data } = await q;
      return data?.[0] || null;
    },
    enabled: isTwoLevel && !!config.offer_id && !!twoLevelItemId,
  });

  const { data: angles } = useQuery({
    queryKey: ["angles_for_block", angleProject?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_magnets")
        .select("*")
        .eq("project_id", angleProject!.id)
        .order("created_at");
      return data ?? [];
    },
    enabled: isTwoLevel && !!angleProject?.id,
  });

  // ── Selected variant lookup ──
  const selectedVariantId = config.selected_variant_id;
  const allVariants = isSingleLevel ? (variants ?? []) : (angles ?? []);
  const selectedVariant = allVariants.find((v: any) => v.id === selectedVariantId);

  // ── Generate variants ──
  const generateVariants = async (isRegenerate = false) => {
    if (!config.offer_id) return;
    setGeneratingVariants(true);
    try {
      let projectId: string;

      if (isSingleLevel) {
        if (variantProject?.id && isRegenerate) {
          projectId = variantProject.id;
        } else if (variantProject?.id) {
          projectId = variantProject.id;
        } else {
          // Create project
          const offerTitle = offers?.find(o => o.id === config.offer_id)?.title || "Email Builder";
          const { data: newProject, error } = await supabase
            .from("projects")
            .insert({ offer_id: config.offer_id, content_type: block.block_type, title: `[Email] ${offerTitle}`, created_by: userId })
            .select("id")
            .single();
          if (error) throw error;
          projectId = newProject.id;
        }
      } else {
        // Two-level
        if (angleProject?.id && isRegenerate) {
          projectId = angleProject.id;
        } else if (angleProject?.id) {
          projectId = angleProject.id;
        } else {
          const offerTitle = offers?.find(o => o.id === config.offer_id)?.title || "Email Builder";
          const insertData: any = {
            offer_id: config.offer_id,
            content_type: block.block_type,
            title: `[Email] ${offerTitle}`,
            created_by: userId,
          };
          if (block.block_type === "testimonial_content") insertData.selected_case_id = twoLevelItemId;
          else insertData.selected_objection_id = twoLevelItemId;

          const { data: newProject, error } = await supabase
            .from("projects")
            .insert(insertData)
            .select("id")
            .single();
          if (error) throw error;
          projectId = newProject.id;
        }
      }

      // Call generate-lead-magnets
      const body: any = { project_id: projectId, content_type: block.block_type };
      if (block.block_type === "testimonial_content") body.case_classification_id = twoLevelItemId;
      if (block.block_type === "objection_handling") body.selected_objection_id = twoLevelItemId;

      const { data, error } = await supabase.functions.invoke("generate-lead-magnets", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["variant_project"] });
      await queryClient.invalidateQueries({ queryKey: ["variants_for_block"] });
      await queryClient.invalidateQueries({ queryKey: ["angle_project"] });
      await queryClient.invalidateQueries({ queryKey: ["angles_for_block"] });

      toast.success("Варианты сгенерированы");

      // If regenerating, clear selected variant if it no longer exists
      if (isRegenerate && selectedVariantId) {
        setConfig("selected_variant_id", undefined);
      }
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

  const labels = VARIANT_LABELS[block.block_type] || { plural: "вариантов", singular: "вариант", action: "Выбрать" };
  const offerTypes = OFFER_TYPES.map((t) => [t.key, t.label] as const);

  // ── Determine if generate block button should be enabled ──
  const hasVariantSelected = !!selectedVariantId;
  const canGenerate = !!config.program_id && !!config.offer_id && hasVariantSelected;

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
            <RadioGroupItem value="text_image" id={`mode-img-${block.id}`} />
            <Label htmlFor={`mode-img-${block.id}`} className="text-sm">Текст + изображение</Label>
          </div>
        </RadioGroup>
      </div>

      {/* 2. Program */}
      <div className="space-y-1.5">
        <Label className="text-xs">Платная программа</Label>
        <Select value={config.program_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, program_id: v, offer_id: "", selected_variant_id: undefined })}>
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
        <Select value={config.offer_type || ""} onValueChange={(v) => onUpdateConfig({ ...config, offer_type: v, offer_id: "", selected_variant_id: undefined })}>
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
        <Select value={config.offer_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, offer_id: v, selected_variant_id: undefined })}>
          <SelectTrigger><SelectValue placeholder="Выберите оффер" /></SelectTrigger>
          <SelectContent>
            {offers?.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── SINGLE-LEVEL variant selection ── */}
      {isSingleLevel && config.offer_id && (
        <VariantSelectionBlock
          variants={variants ?? []}
          selectedVariant={selectedVariant}
          labels={labels}
          contentType={block.block_type}
          generatingVariants={generatingVariants}
          hasProject={!!variantProject?.id}
          onGenerateVariants={() => generateVariants(false)}
          onOpenPicker={() => setPickerOpen(true)}
          onClearSelection={() => setConfig("selected_variant_id", undefined)}
        />
      )}

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
            <Select value={config.case_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, case_id: v, selected_variant_id: undefined })}>
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
            <Select value={config.objection_id || ""} onValueChange={(v) => onUpdateConfig({ ...config, objection_id: v, selected_variant_id: undefined })}>
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

      {/* ── TWO-LEVEL: Step 2 — angle selection ── */}
      {isTwoLevel && config.offer_id && twoLevelItemId && (
        <VariantSelectionBlock
          variants={angles ?? []}
          selectedVariant={selectedVariant}
          labels={labels}
          contentType={block.block_type}
          generatingVariants={generatingVariants}
          hasProject={!!angleProject?.id}
          onGenerateVariants={() => generateVariants(false)}
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
      {config.mode === "text_image" && block.generated_html && (
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
        onRegenerate={() => generateVariants(true)}
        regenerating={generatingVariants}
        title={`Выбор: ${labels.plural}`}
      />
    </div>
  );
}

// ── Sub-component for variant selection UI ──
function VariantSelectionBlock({
  variants, selectedVariant, labels, contentType, generatingVariants,
  hasProject, onGenerateVariants, onOpenPicker, onClearSelection,
}: {
  variants: any[];
  selectedVariant: any;
  labels: { plural: string; singular: string; action: string };
  contentType: string;
  generatingVariants: boolean;
  hasProject: boolean;
  onGenerateVariants: () => void;
  onOpenPicker: () => void;
  onClearSelection: () => void;
}) {
  const hasVariants = variants.length > 0;

  if (!hasProject || !hasVariants) {
    // Scenario A: no variants
    return (
      <div className="rounded-md border border-dashed p-3 space-y-2">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Для этого оффера ещё нет сгенерированных {labels.plural}.</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full gap-1.5"
          onClick={onGenerateVariants}
          disabled={generatingVariants}
        >
          {generatingVariants ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Сгенерировать варианты
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

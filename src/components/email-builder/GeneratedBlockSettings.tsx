import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ImageIcon } from "lucide-react";
import { type EmailBlock } from "./BlockCanvas";
import { offerTypeLabels } from "@/lib/offerTypes";

interface Props {
  block: EmailBlock;
  colorSchemeId: string | null;
  onUpdateConfig: (config: Record<string, any>) => void;
  onGenerate: () => void;
  onGenerateImage: () => void;
  generating: boolean;
  generatingImage: boolean;
}

export default function GeneratedBlockSettings({
  block, onUpdateConfig, onGenerate, onGenerateImage, generating, generatingImage,
}: Props) {
  const config = block.config;

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

  // Additional data for specific block types
  const { data: leadMagnets } = useQuery({
    queryKey: ["lead_magnets_for_builder", config.offer_id],
    queryFn: async () => {
      if (!config.offer_id) return [];
      const { data } = await supabase
        .from("projects").select("id, selected_lead_magnet_id, lead_magnets(id, title)")
        .eq("offer_id", config.offer_id).eq("content_type", "lead_magnet");
      const lms: any[] = [];
      data?.forEach((p: any) => { if (p.lead_magnets) lms.push(p.lead_magnets); });
      return lms;
    },
    enabled: block.block_type === "lead_magnet" && !!config.offer_id,
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

  const { data: cases } = useQuery({
    queryKey: ["cases_for_builder"],
    queryFn: async () => {
      const { data } = await supabase.from("case_classifications").select("id, file_name, classification_json");
      return data ?? [];
    },
    enabled: block.block_type === "testimonial_content",
  });

  const setConfig = (key: string, value: any) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  const offerTypes = Object.entries(offerTypeLabels);

  return (
    <div className="space-y-4">
      {/* 1. Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Режим блока</Label>
        <RadioGroup
          value={config.mode || "text_only"}
          onValueChange={(v) => setConfig("mode", v)}
        >
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
        <Select value={config.program_id || ""} onValueChange={(v) => setConfig("program_id", v)}>
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
        <Select value={config.offer_type || ""} onValueChange={(v) => setConfig("offer_type", v)}>
          <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
          <SelectContent>
            {offerTypes.map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Offer */}
      <div className="space-y-1.5">
        <Label className="text-xs">Оффер</Label>
        <Select value={config.offer_id || ""} onValueChange={(v) => setConfig("offer_id", v)}>
          <SelectTrigger><SelectValue placeholder="Выберите оффер" /></SelectTrigger>
          <SelectContent>
            {offers?.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific fields */}
      {block.block_type === "lead_magnet" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Лид-магнит</Label>
          <Select value={config.lead_magnet_id || ""} onValueChange={(v) => setConfig("lead_magnet_id", v)}>
            <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
            <SelectContent>
              {leadMagnets?.map((lm: any) => (
                <SelectItem key={lm.id} value={lm.id}>{lm.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {block.block_type === "objection_handling" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Возражение</Label>
          <Select value={config.objection_id || ""} onValueChange={(v) => setConfig("objection_id", v)}>
            <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
            <SelectContent>
              {objections?.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.objection_text}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {block.block_type === "testimonial_content" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Кейс</Label>
          <Select value={config.case_id || ""} onValueChange={(v) => setConfig("case_id", v)}>
            <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
            <SelectContent>
              {cases?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.file_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Generate button */}
      <Button
        className="w-full gap-2"
        onClick={onGenerate}
        disabled={generating || !config.program_id || !config.offer_id}
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
    </div>
  );
}

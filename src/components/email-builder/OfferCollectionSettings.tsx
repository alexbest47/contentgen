import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ImageIcon } from "lucide-react";
import { type EmailBlock } from "./BlockCanvas";
import { OFFER_TYPES } from "@/lib/offerTypes";

interface Props {
  block: EmailBlock;
  onUpdateConfig: (config: Record<string, any>) => void;
  onGenerate: () => void;
  onGenerateImage: () => void;
  generating: boolean;
  generatingImage: boolean;
}

export default function OfferCollectionSettings({
  block, onUpdateConfig, onGenerate, onGenerateImage, generating, generatingImage,
}: Props) {
  const config = block.config;
  const slotCount = config.slot_count || 2;

  const setConfig = (key: string, value: any) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  const setSlot = (index: number, key: string, value: string) => {
    const slots = [...(config.slots || Array(slotCount).fill({}))];
    while (slots.length < slotCount) slots.push({});
    slots[index] = { ...slots[index], [key]: value };
    // Reset dependent fields
    if (key === "program_id") {
      slots[index] = { program_id: value };
    } else if (key === "offer_type") {
      slots[index] = { ...slots[index], offer_type: value, offer_id: "" };
    }
    onUpdateConfig({ ...config, slots });
  };

  const { data: programs } = useQuery({
    queryKey: ["paid_programs_list"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      {/* Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Режим блока</Label>
        <RadioGroup value={config.mode || "text_only"} onValueChange={(v) => setConfig("mode", v)}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="text_only" id={`oc-mode-text-${block.id}`} />
            <Label htmlFor={`oc-mode-text-${block.id}`} className="text-sm">Только текст</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="header_image" id={`oc-mode-header-${block.id}`} />
            <Label htmlFor={`oc-mode-header-${block.id}`} className="text-sm">Заголовок + текст</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Collection title */}
      <div className="space-y-1.5">
        <Label className="text-xs">Заголовок подборки</Label>
        <Input
          value={config.collection_title || ""}
          onChange={(e) => setConfig("collection_title", e.target.value)}
          placeholder="Подборка бесплатных мини-курсов"
        />
      </div>

      {/* Slot count */}
      <div className="space-y-2">
        <Label className="text-xs">Количество офферов</Label>
        <RadioGroup
          value={String(slotCount)}
          onValueChange={(v) => setConfig("slot_count", Number(v))}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id={`oc-count-2-${block.id}`} />
              <Label htmlFor={`oc-count-2-${block.id}`} className="text-sm">2</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="4" id={`oc-count-4-${block.id}`} />
              <Label htmlFor={`oc-count-4-${block.id}`} className="text-sm">4</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Slots */}
      {Array.from({ length: slotCount }).map((_, i) => {
        const slot = config.slots?.[i] || {};
        return (
          <SlotEditor
            key={i}
            index={i}
            slot={slot}
            programs={programs ?? []}
            onSetSlot={(key, value) => setSlot(i, key, value)}
          />
        );
      })}

      {/* Generate */}
      <Button className="w-full gap-2" onClick={onGenerate} disabled={generating}>
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {block.generated_html ? "Перегенерировать блок" : "Сгенерировать блок"}
      </Button>

      {(config.mode === "header_image") && block.generated_html && (
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

function SlotEditor({
  index,
  slot,
  programs,
  onSetSlot,
}: {
  index: number;
  slot: Record<string, any>;
  programs: { id: string; title: string }[];
  onSetSlot: (key: string, value: string) => void;
}) {
  const { data: offers } = useQuery({
    queryKey: ["offers_for_slot", slot.program_id, slot.offer_type],
    queryFn: async () => {
      let q = supabase.from("offers").select("id, title").eq("program_id", slot.program_id).eq("is_archived", false);
      if (slot.offer_type) q = q.eq("offer_type", slot.offer_type);
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!slot.program_id,
  });

  return (
    <div className="border rounded-md p-3 space-y-2">
      <Label className="text-xs font-semibold">Оффер {index + 1}</Label>
      <Select value={slot.program_id || ""} onValueChange={(v) => onSetSlot("program_id", v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Программа" />
        </SelectTrigger>
        <SelectContent>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {slot.program_id && (
        <Select value={slot.offer_type || ""} onValueChange={(v) => onSetSlot("offer_type", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Тип оффера" />
          </SelectTrigger>
          <SelectContent>
            {OFFER_TYPES.map((t) => (
              <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {slot.program_id && (
        <Select value={slot.offer_id || ""} onValueChange={(v) => onSetSlot("offer_id", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Оффер" />
          </SelectTrigger>
          <SelectContent>
            {offers?.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

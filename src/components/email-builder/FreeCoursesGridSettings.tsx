import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RefreshCw } from "lucide-react";
import { type EmailBlock } from "./BlockCanvas";

const GRID_OPTIONS = [
  { value: "2x1", label: "2×1", count: 2, description: "Два курса в одну строку" },
  { value: "2x2", label: "2×2", count: 4, description: "Четыре курса в две строки" },
  { value: "2x3", label: "2×3", count: 6, description: "Шесть курсов в три строки" },
];

interface Props {
  block: EmailBlock;
  colorSchemeId?: string | null;
  onUpdateConfig: (config: Record<string, any>) => void;
}

export default function FreeCoursesGridSettings({ block, colorSchemeId, onUpdateConfig }: Props) {
  const config = block.config;
  const gridType: string = config.grid_type || "";
  const selectedOfferIds: string[] = config.offer_ids || [];

  const { data: schemeColors } = useQuery({
    queryKey: ["color_scheme_colors", colorSchemeId],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("preview_colors").eq("id", colorSchemeId!).single();
      return data?.preview_colors || null;
    },
    enabled: !!colorSchemeId,
  });

  const headingColor = schemeColors?.[2] || "#1A1A2E";
  const accentColor = schemeColors?.[0] || "#7B2FBE";
  const placeholderBg = schemeColors?.[1] || "#F0EDF7";

  const { data: miniCourses } = useQuery({
    queryKey: ["mini_courses_for_grid"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title, description, image_url")
        .eq("offer_type", "mini_course")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const gridOption = GRID_OPTIONS.find((g) => g.value === gridType);
  const cellCount = gridOption?.count || 0;

  const setGridType = (value: string) => {
    const opt = GRID_OPTIONS.find((g) => g.value === value);
    const count = opt?.count || 0;
    const newIds = selectedOfferIds.slice(0, count);
    while (newIds.length < count) newIds.push("");
    onUpdateConfig({ ...config, grid_type: value, offer_ids: newIds });
  };

  const setOfferId = (index: number, value: string) => {
    const newIds = [...selectedOfferIds];
    newIds[index] = value;
    onUpdateConfig({ ...config, offer_ids: newIds });
  };

  const buildCellHtml = (offerId: string) => {
    const offer = miniCourses?.find((o) => o.id === offerId);
    if (!offer) return "";
    const imgSrc = offer.image_url || "";
    const imgHtml = imgSrc
      ? `<img src="${imgSrc}" width="100%" style="display:block;border-radius:8px;margin:0 0 12px 0;" alt="${offer.title}">`
      : `<div style="width:100%;padding-top:100%;background:${placeholderBg};border-radius:8px;margin:0 0 12px 0;"></div>`;
    return `${imgHtml}
    <p style="font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${headingColor};margin:0 0 6px 0;">${offer.title}</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#444444;margin:0 0 10px 0;line-height:1.5;">${offer.description || ""}</p>
    <a href="#" style="font-family:Arial,sans-serif;font-size:14px;color:${accentColor};text-decoration:none;">Пройти бесплатно →</a>`;
  };

  const bgColor = schemeColors?.[1] || "#F0EDF7";

  const buildHtml = () => {
    const rows: string[] = [];
    for (let i = 0; i < cellCount; i += 2) {
      const cell1 = buildCellHtml(selectedOfferIds[i] || "");
      const cell2 = i + 1 < cellCount ? buildCellHtml(selectedOfferIds[i + 1] || "") : "";
      rows.push(`<tr>
  <td width="48%" valign="top" style="padding-right:16px;">${cell1}</td>
  <td width="48%" valign="top" style="padding-left:16px;">${cell2}</td>
</tr>`);
    }

    const card = `<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;"><tr><td style="padding:24px 32px;">
<p style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:${headingColor};margin:0 0 8px 0;">Подборка бесплатных курсов</p>
<p style="font-family:Arial,sans-serif;font-size:15px;color:#444444;margin:0 0 24px 0;line-height:1.5;">Подготовили для вас подборку бесплатных мини-курсов на интересные темы.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
${rows.join("\n")}
</table>
</td></tr></table>`;

    return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};"><tr><td style="padding:16px 16px;">${card}</td></tr></table>`;
  };

  const handleUpdateBlock = () => {
    const html = buildHtml();
    onUpdateConfig({ ...config, grid_type: gridType, offer_ids: selectedOfferIds, _generated_html: html });
  };

  const allFilled = selectedOfferIds.length === cellCount && selectedOfferIds.every(Boolean);

  return (
    <div className="space-y-4">
      {/* Step 1: Grid selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Выберите сетку</Label>
        <RadioGroup value={gridType} onValueChange={setGridType}>
          {GRID_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value={opt.value} id={`grid-${opt.value}`} />
              <label htmlFor={`grid-${opt.value}`} className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Step 2: Fill cells */}
      {gridType && (
        <div className="space-y-3 border-t pt-4">
          <Label className="text-xs font-semibold">Наполнение сетки</Label>
          {Array.from({ length: cellCount }).map((_, i) => (
            <div key={i}>
              <Label className="text-xs mb-1 block">Ячейка {i + 1}</Label>
              <Select value={selectedOfferIds[i] || ""} onValueChange={(v) => setOfferId(i, v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать мини-курс" />
                </SelectTrigger>
                <SelectContent>
                  {miniCourses?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {gridType && (
        <Button
          className="w-full gap-1.5"
          onClick={handleUpdateBlock}
          disabled={!allFilled}
        >
          <RefreshCw className="h-4 w-4" /> Обновить блок
        </Button>
      )}
    </div>
  );
}

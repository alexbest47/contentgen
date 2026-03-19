import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EmailBlock } from "./BlockCanvas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  block: EmailBlock;
  colorSchemeId?: string | null;
  onUpdateConfig: (config: Record<string, any>) => void;
}

export default function UserBlockSettings({ block, colorSchemeId, onUpdateConfig }: Props) {
  const { data: accentColor } = useQuery({
    queryKey: ["color_scheme_accent", colorSchemeId],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("preview_colors").eq("id", colorSchemeId!).single();
      return data?.preview_colors?.[1] || null;
    },
    enabled: !!colorSchemeId,
  });

  const config = block.config;
  const setConfig = (key: string, value: any) => onUpdateConfig({ ...config, [key]: value });
  const defaultCtaColor = accentColor || "#6366f1";

  if (block.block_type === "text") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Текст (HTML)</Label>
          <Textarea
            value={config.html || ""}
            onChange={(e) => setConfig("html", e.target.value)}
            className="font-mono text-xs min-h-[150px]"
            placeholder="<p>Ваш текст...</p>"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Выравнивание</Label>
          <Select value={config.align || "left"} onValueChange={(v) => setConfig("align", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">По левому краю</SelectItem>
              <SelectItem value="center">По центру</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (block.block_type === "image") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">URL изображения</Label>
          <Input value={config.url || ""} onChange={(e) => setConfig("url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Alt-текст</Label>
          <Input value={config.alt || ""} onChange={(e) => setConfig("alt", e.target.value)} placeholder="Описание" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Выравнивание</Label>
          <Select value={config.align || "center"} onValueChange={(v) => setConfig("align", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="center">По центру</SelectItem>
              <SelectItem value="left">По левому краю</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (block.block_type === "cta") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Текст кнопки</Label>
          <Input value={config.text || ""} onChange={(e) => setConfig("text", e.target.value)} placeholder="Записаться" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">URL (href)</Label>
          <Input value={config.url || ""} onChange={(e) => setConfig("url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Цвет кнопки</Label>
          <Input type="color" value={config.color || "#6366f1"} onChange={(e) => setConfig("color", e.target.value)} />
        </div>
      </div>
    );
  }

  // divider
  return (
    <p className="text-sm text-muted-foreground">Разделитель не имеет настроек.</p>
  );
}

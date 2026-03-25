import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EmailBlock } from "./BlockCanvas";
import { ArrowUp, ArrowDown, Trash2, Type, ImageIcon, MousePointerClick, Upload, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadOfferImage } from "@/lib/uploadOfferImage";
import { toast } from "sonner";
import BannerPickerDialog from "@/components/banners/BannerPickerDialog";

interface CardChild {
  type: "text" | "image" | "cta";
  html?: string;
  align?: string;
  url?: string;
  alt?: string;
  text?: string;
  color?: string;
}

interface Props {
  block: EmailBlock;
  colorSchemeId?: string | null;
  onUpdateConfig: (config: Record<string, any>) => void;
  userId: string;
}

export default function CardBlockSettings({ block, colorSchemeId, onUpdateConfig, userId }: Props) {
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [bannerPickerIndex, setBannerPickerIndex] = useState<number | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);

  const { data: schemeColors } = useQuery({
    queryKey: ["color_scheme_colors", colorSchemeId],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("preview_colors").eq("id", colorSchemeId!).single();
      return data?.preview_colors || null;
    },
    enabled: !!colorSchemeId,
  });

  const children: CardChild[] = block.config.children || [];
  const defaultCtaColor = schemeColors?.[0] || "#6366f1";

  const updateChildren = (newChildren: CardChild[]) => {
    onUpdateConfig({ ...block.config, children: newChildren });
  };

  const addChild = (type: CardChild["type"]) => {
    const newChild: CardChild = type === "text"
      ? { type: "text", html: "<p>Текст</p>", align: "left" }
      : type === "image"
      ? { type: "image", url: "", alt: "" }
      : { type: "cta", text: "Записаться", url: "#", color: defaultCtaColor };
    updateChildren([...children, newChild]);
  };

  const updateChild = (index: number, updates: Partial<CardChild>) => {
    const updated = children.map((c, i) => i === index ? { ...c, ...updates } : c);
    updateChildren(updated);
  };

  const moveChild = (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= children.length) return;
    const next = [...children];
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    updateChildren(next);
  };

  const removeChild = (index: number) => {
    updateChildren(children.filter((_, i) => i !== index));
  };

  const handleUploadClick = (index: number) => {
    setUploadIndex(index);
    uploadRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadIndex === null) return;
    try {
      const publicUrl = await uploadOfferImage(file, userId);
      updateChild(uploadIndex, { url: publicUrl });
      toast.success("Изображение загружено");
    } catch (err: any) {
      toast.error(err.message || "Ошибка загрузки");
    }
    e.target.value = "";
    setUploadIndex(null);
  };

  const handleBannerPick = (imageUrl: string) => {
    if (bannerPickerIndex !== null) {
      updateChild(bannerPickerIndex, { url: imageUrl });
    }
    setBannerPickerOpen(false);
    setBannerPickerIndex(null);
  };

  return (
    <div className="space-y-4">
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Child elements list */}
      {children.map((child, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {child.type === "text" ? "Текст" : child.type === "image" ? "Изображение" : "Кнопка CTA"}
            </span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => moveChild(idx, "up")}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === children.length - 1} onClick={() => moveChild(idx, "down")}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeChild(idx)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>

          {child.type === "text" && (
            <div className="space-y-2">
              <Textarea
                value={child.html || ""}
                onChange={(e) => updateChild(idx, { html: e.target.value })}
                className="font-mono text-xs min-h-[80px]"
                placeholder="<p>Ваш текст...</p>"
              />
              <Select value={child.align || "left"} onValueChange={(v) => updateChild(idx, { align: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">По левому краю</SelectItem>
                  <SelectItem value="center">По центру</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {child.type === "image" && (
            <div className="space-y-2">
              {child.url && (
                <img src={child.url} alt={child.alt || ""} className="w-full rounded border" />
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">URL изображения</Label>
                <Input value={child.url || ""} onChange={(e) => updateChild(idx, { url: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 flex-1" onClick={() => handleUploadClick(idx)}>
                  <Upload className="h-3 w-3" /> Загрузить
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 flex-1" onClick={() => { setBannerPickerIndex(idx); setBannerPickerOpen(true); }}>
                  <FolderOpen className="h-3 w-3" /> Из библиотеки
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Alt-текст</Label>
                <Input value={child.alt || ""} onChange={(e) => updateChild(idx, { alt: e.target.value })} placeholder="Описание" className="h-8 text-xs" />
              </div>
            </div>
          )}

          {child.type === "cta" && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Текст кнопки</Label>
                <Input value={child.text || ""} onChange={(e) => updateChild(idx, { text: e.target.value })} placeholder="Записаться" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">URL (href)</Label>
                <Input value={child.url || ""} onChange={(e) => updateChild(idx, { url: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Цвет кнопки</Label>
                <Input type="color" value={child.color || defaultCtaColor} onChange={(e) => updateChild(idx, { color: e.target.value })} className="h-8" />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add child buttons */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">Добавить элемент в карточку:</p>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => addChild("text")}>
            <Type className="h-3 w-3" /> Текст
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => addChild("image")}>
            <ImageIcon className="h-3 w-3" /> Изображение
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => addChild("cta")}>
            <MousePointerClick className="h-3 w-3" /> CTA
          </Button>
        </div>
      </div>

      <BannerPickerDialog
        open={bannerPickerOpen}
        onOpenChange={setBannerPickerOpen}
        placeholderId={`card-child-${bannerPickerIndex}`}
        onSelect={handleBannerPick}
      />
    </div>
  );
}

import { useRef, useCallback, useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, GripVertical, Upload, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import type { LandingBlock } from "@/pages/LandingEditor";

interface FocusFieldRequest {
  blockId: string;
  field: string;
  index?: number;
  subfield?: string;
}

interface Props {
  block: LandingBlock | null;
  onUpdateBlock: (blockId: string, updates: Partial<LandingBlock>) => void;
  landingId: string;
  programTitle: string | null;
  focusFieldRequest?: FocusFieldRequest | null;
  onFocusFieldHandled?: () => void;
  onBlockContentGenerated?: (blockId: string, newOverrides: Record<string, any>) => void;
}

/** Sub-component for a single image in the universal image editor — shows dimensions */
function ImageCard({
  imgPath,
  currentUrl,
  displayUrl,
  onOverride,
  onUpload,
}: {
  imgPath: string;
  currentUrl: string;
  displayUrl: string;
  onOverride: (originalPath: string, newUrl: string) => void;
  onUpload: (file: File, originalPath: string) => void;
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const fileName = imgPath.split("/").pop() || imgPath;

  useEffect(() => {
    setDims(null);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = displayUrl;
  }, [displayUrl]);

  return (
    <div className="space-y-1 border rounded p-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground truncate block" title={imgPath}>
          {fileName}
        </Label>
        {dims && (
          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
            {dims.w}×{dims.h}px
          </span>
        )}
      </div>
      <img
        src={displayUrl}
        alt=""
        className="w-full h-16 object-contain rounded border bg-muted"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="flex gap-1">
        <Input
          value={currentUrl}
          onChange={(e) => onOverride(imgPath, e.target.value)}
          placeholder="Новый URL (или загрузите)"
          className="flex-1 h-8 text-xs"
        />
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onUpload(file, imgPath);
            };
            input.click();
          }}
          title="Загрузить изображение"
        >
          <Upload className="h-3 w-3" />
        </Button>
      </div>
      {dims && (
        <p className="text-[10px] text-muted-foreground">
          Рекомендуемый размер: {dims.w}×{dims.h}px
        </p>
      )}
      {currentUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={() => onOverride(imgPath, "")}
        >
          Сбросить к оригиналу
        </Button>
      )}
    </div>
  );
}

export default function LandingBlockSettingsPanel({
  block,
  onUpdateBlock,
  landingId,
  programTitle,
  focusFieldRequest,
  onFocusFieldHandled,
  onBlockContentGenerated,
}: Props) {
  // ALL hooks MUST be before any conditional return (Rules of Hooks)
  const { enqueue } = useTaskQueue();
  const [aiGenerating, setAiGenerating] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  // Handle focus-field request from inline preview click
  useEffect(() => {
    if (!focusFieldRequest || !block || focusFieldRequest.blockId !== block.id) return;

    const { field, index, subfield } = focusFieldRequest;

    // Build the DOM id for the target input/textarea
    let fieldId: string;
    if (index !== undefined && subfield) {
      // Repeater field: field[index].subfield
      fieldId = `field-${field}-${index}-${subfield}`;
    } else {
      fieldId = `field-${field}`;
    }

    // Highlight the field temporarily
    setHighlightedField(fieldId);
    setTimeout(() => setHighlightedField(null), 2000);

    // Find and focus the input/textarea
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
        // Flash highlight
        el.style.outline = "2px solid #7c3aed";
        el.style.outlineOffset = "2px";
        el.style.transition = "outline 0.3s ease";
        setTimeout(() => {
          el.style.outline = "";
          el.style.outlineOffset = "";
        }, 2000);
      }
    }, 100);

    onFocusFieldHandled?.();
  }, [focusFieldRequest, block?.id, onFocusFieldHandled]);
  const uploadImage = useCallback(async (file: File, fieldPath: string) => {
    if (!block) return;
    const ext = file.name.split(".").pop() || "png";
    const filePath = `${block.landing_id}/${block.id}/${fieldPath.replace(/\./g, "_")}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("landing-assets")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });
    if (error) {
      toast.error("Ошибка загрузки: " + error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(filePath);
    const overrides = block.content_overrides || {};
    const newOverrides = { ...overrides };
    const parts = fieldPath.split(".");
    if (parts.length === 1) {
      newOverrides[parts[0]] = urlData.publicUrl;
    } else {
      let obj = newOverrides;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]] || typeof obj[parts[i]] !== "object") obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = urlData.publicUrl;
    }
    onUpdateBlock(block.id, { content_overrides: newOverrides });
    toast.success("Изображение загружено");
  }, [block?.id, block?.landing_id, block?.content_overrides, onUpdateBlock]);

  if (!block) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground border-l">
        <div className="text-center px-4">
          <p className="text-lg mb-2">Настройки блока</p>
          <p className="text-sm">Выберите блок на холсте, чтобы редактировать его содержимое</p>
        </div>
      </div>
    );
  }

  const def = block.block_definition;
  const editableFields: any[] = def?.editable_fields || [];
  const overrides = block.content_overrides || {};
  const settings = block.settings || {};

  const updateContentField = (fieldPath: string, value: any) => {
    const newOverrides = { ...overrides };
    const parts = fieldPath.split(".");
    if (parts.length === 1) {
      newOverrides[parts[0]] = value;
    } else {
      let obj = newOverrides;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]] || typeof obj[parts[i]] !== "object") obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    }
    onUpdateBlock(block.id, { content_overrides: newOverrides });
  };

  const getContentValue = (fieldPath: string): any => {
    const parts = fieldPath.split(".");
    let val: any = overrides;
    for (const part of parts) {
      if (val == null) return "";
      val = val[part];
    }
    return val ?? "";
  };

  const updateSetting = (key: string, value: any) => {
    onUpdateBlock(block.id, { settings: { ...settings, [key]: value } });
  };

  const renderField = (field: any, prefix = "", repeaterIndex?: number) => {
    const path = prefix ? `${prefix}.${field.field}` : field.field;

    // Build a stable DOM id for focus-from-preview
    const fieldId = repeaterIndex !== undefined && prefix
      ? `field-${prefix.split(".")[0]}-${repeaterIndex}-${field.field}`
      : `field-${field.field}`;

    if (field.type === "text") {
      return (
        <div key={path} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          <Input
            id={fieldId}
            value={getContentValue(path) || ""}
            onChange={(e) => updateContentField(path, e.target.value)}
            placeholder={field.label}
          />
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={path} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          <Textarea
            id={fieldId}
            value={getContentValue(path) || ""}
            onChange={(e) => updateContentField(path, e.target.value)}
            placeholder={field.label}
            rows={3}
          />
        </div>
      );
    }

    if (field.type === "image") {
      const imgValue = getContentValue(path) || "";
      return (
        <div key={path} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          <div className="flex gap-1">
            <Input
              value={imgValue}
              onChange={(e) => updateContentField(path, e.target.value)}
              placeholder="URL изображения"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) uploadImage(file, path);
                };
                input.click();
              }}
              title="Загрузить изображение"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {imgValue && (
            <img
              src={imgValue}
              alt=""
              className="w-full h-20 object-cover rounded border mt-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>
      );
    }

    if (field.type === "repeater") {
      const items: any[] = getContentValue(path) || [];
      return (
        <div key={path} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">{field.label}</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                const newItem: Record<string, string> = {};
                (field.fields || []).forEach((f: any) => { newItem[f.field] = ""; });
                updateContentField(path, [...items, newItem]);
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Добавить
            </Button>
          </div>
          {items.map((item: any, itemIdx: number) => (
            <div key={itemIdx} className="border rounded p-2 space-y-1 relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GripVertical className="h-3 w-3" />
                  <span>#{itemIdx + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  onClick={() => {
                    const newItems = items.filter((_: any, i: number) => i !== itemIdx);
                    updateContentField(path, newItems);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {(field.fields || []).map((subField: any) => {
                const subPath = `${path}.${itemIdx}.${subField.field}`;
                const subFieldId = `field-${field.field}-${itemIdx}-${subField.field}`;
                if (subField.type === "text") {
                  return (
                    <div key={subField.field}>
                      <Label className="text-xs text-muted-foreground">{subField.label}</Label>
                      <Input
                        id={subFieldId}
                        value={item[subField.field] || ""}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: e.target.value };
                          updateContentField(path, newItems);
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  );
                }
                if (subField.type === "textarea") {
                  return (
                    <div key={subField.field}>
                      <Label className="text-xs text-muted-foreground">{subField.label}</Label>
                      <Textarea
                        id={subFieldId}
                        value={item[subField.field] || ""}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: e.target.value };
                          updateContentField(path, newItems);
                        }}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  );
                }
                if (subField.type === "image") {
                  return (
                    <div key={subField.field}>
                      <Label className="text-xs text-muted-foreground">{subField.label}</Label>
                      <div className="flex gap-1">
                        <Input
                          value={item[subField.field] || ""}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: e.target.value };
                            updateContentField(path, newItems);
                          }}
                          className="h-8 text-sm flex-1"
                          placeholder="URL изображения"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (!file) return;
                              const ext = file.name.split(".").pop() || "png";
                              const filePath = `${block.landing_id}/${block.id}/${subField.field}_${itemIdx}_${Date.now()}.${ext}`;
                              const { error } = await supabase.storage
                                .from("landing-assets")
                                .upload(filePath, file, { cacheControl: "3600", upsert: true });
                              if (error) { toast.error("Ошибка загрузки"); return; }
                              const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(filePath);
                              const newItems = [...items];
                              newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: urlData.publicUrl };
                              updateContentField(path, newItems);
                              toast.success("Изображение загружено");
                            };
                            input.click();
                          }}
                          title="Загрузить"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // ─── AI Generation ───────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!block || !landingId) return;

    if (!programTitle) {
      toast.error("Лендинг не привязан к программе. Привяжите программу, чтобы использовать AI-генерацию.");
      return;
    }

    setAiGenerating(true);
    try {
      const taskId = await enqueue({
        functionName: "generate-landing-block",
        payload: {
          landing_id: landingId,
          block_id: block.id,
        },
        displayTitle: `AI: ${def?.name || "блок"} → ${programTitle}`,
        lane: "claude",
        targetUrl: `/landings/${landingId}`,
      });

      if (!taskId) {
        setAiGenerating(false);
        return;
      }

      // Poll task_queue for completion
      const pollInterval = setInterval(async () => {
        const { data: task } = await supabase
          .from("task_queue")
          .select("status, result, error_message")
          .eq("id", taskId)
          .single();

        if (!task) return;

        if (task.status === "completed") {
          clearInterval(pollInterval);
          setAiGenerating(false);
          toast.success("Контент сгенерирован!", {
            description: `Блок "${def?.name}" обновлён`,
          });
          // Re-fetch the block to get updated content_overrides
          const { data: updatedBlock } = await supabase
            .from("landing_blocks")
            .select("content_overrides")
            .eq("id", block.id)
            .single();
          if (updatedBlock && onBlockContentGenerated) {
            onBlockContentGenerated(block.id, updatedBlock.content_overrides as Record<string, any>);
          }
        } else if (task.status === "error") {
          clearInterval(pollInterval);
          setAiGenerating(false);
          toast.error("Ошибка генерации", {
            description: task.error_message || "Неизвестная ошибка",
          });
        }
      }, 2000);

      // Safety timeout — stop polling after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setAiGenerating(false);
      }, 180_000);
    } catch (err: any) {
      setAiGenerating(false);
      toast.error("Ошибка: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{def?.name || "Настройки блока"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{def?.block_type}</p>
          </div>
          {editableFields.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700"
              disabled={aiGenerating}
              onClick={handleAiGenerate}
              title={
                programTitle
                  ? `Сгенерировать текст для "${programTitle}"`
                  : "Привяжите программу к лендингу"
              }
            >
              {aiGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {aiGenerating ? "Генерация..." : "AI"}
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Visibility toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Видимость блока</Label>
            <Switch
              checked={block.is_visible}
              onCheckedChange={(checked) => onUpdateBlock(block.id, { is_visible: checked })}
            />
          </div>

          <Separator />

          {/* Content fields */}
          {editableFields.length > 0 && (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Контент</h4>
              {editableFields.map((field) => renderField(field))}
            </>
          )}

          {/* Universal image editor — show ALL images from _all_images */}
          {(() => {
            const allImages: string[] =
              overrides._all_images ||
              def?.default_content?._all_images ||
              [];
            if (allImages.length === 0) return null;

            const imageOverrides: Record<string, string> = overrides._image_overrides || {};

            const handleImageOverride = (originalPath: string, newUrl: string) => {
              const newOverrides = { ...overrides };
              const newImgOv = { ...(newOverrides._image_overrides || {}), [originalPath]: newUrl };
              // Remove entry if set back to empty
              if (!newUrl) delete newImgOv[originalPath];
              newOverrides._image_overrides = newImgOv;
              onUpdateBlock(block.id, { content_overrides: newOverrides });
            };

            const handleImageUpload = async (file: File, originalPath: string) => {
              const ext = file.name.split(".").pop() || "png";
              const safeName = originalPath.replace(/[^a-zA-Z0-9]/g, "_").slice(-40);
              const filePath = `${block.landing_id}/${block.id}/img_${safeName}_${Date.now()}.${ext}`;
              const { error } = await supabase.storage
                .from("landing-assets")
                .upload(filePath, file, { cacheControl: "3600", upsert: true });
              if (error) {
                toast.error("Ошибка загрузки: " + error.message);
                return;
              }
              const { data: urlData } = supabase.storage.from("landing-assets").getPublicUrl(filePath);
              handleImageOverride(originalPath, urlData.publicUrl);
              toast.success("Изображение загружено");
            };

            const BASE_PATH = "/talentsy-template/";
            const baseUrl = window.location.origin + BASE_PATH;

            return (
              <>
                <Separator />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                  Изображения блока ({allImages.length})
                </h4>
                <div className="space-y-3">
                  {allImages.map((imgPath, imgIdx) => (
                    <ImageCard
                      key={imgIdx}
                      imgPath={imgPath}
                      currentUrl={imageOverrides[imgPath] || ""}
                      displayUrl={imageOverrides[imgPath] || baseUrl + imgPath}
                      onOverride={handleImageOverride}
                      onUpload={handleImageUpload}
                    />
                  ))}
                </div>
              </>
            );
          })()}

          <Separator />

          {/* Settings */}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Оформление</h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Цвет фона</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.background_color || "#ffffff"}
                  onChange={(e) => updateSetting("background_color", e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={settings.background_color || ""}
                  onChange={(e) => updateSetting("background_color", e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Цвет текста</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.text_color || "#000000"}
                  onChange={(e) => updateSetting("text_color", e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={settings.text_color || ""}
                  onChange={(e) => updateSetting("text_color", e.target.value)}
                  placeholder="#000000"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Акцентный цвет</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.accent_color || "#7835FF"}
                  onChange={(e) => updateSetting("accent_color", e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={settings.accent_color || ""}
                  onChange={(e) => updateSetting("accent_color", e.target.value)}
                  placeholder="#7835FF"
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom CSS */}
          <div className="space-y-1">
            <Label className="text-xs">Пользовательский CSS</Label>
            <Textarea
              value={block.custom_css || ""}
              onChange={(e) => onUpdateBlock(block.id, { custom_css: e.target.value })}
              placeholder=".block { ... }"
              rows={4}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

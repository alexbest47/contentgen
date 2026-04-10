import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, GripVertical, Upload, Image as ImageIcon, Sparkles, Loader2, Wand2, Scissors, Video, Move, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/landing-builder/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { useCssClassMap } from "@/hooks/useCssClassMap";
import { extractStyledValues } from "@/lib/extractStyledValues";
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

/**
 * Extract all unique image paths from an HTML template string.
 * Looks at <img src>, <source srcset>, and background-image CSS.
 * Returns array of relative paths like "img/psy-v3/hero.jpg".
 */
function extractImagesFromHtml(html: string): string[] {
  const paths = new Set<string>();
  // <img src="...">
  const imgSrcRe = /<img[^>]+src="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = imgSrcRe.exec(html)) !== null) {
    const src = m[1];
    if (src && !src.startsWith("data:") && !src.startsWith("http")) paths.add(src);
  }
  // <source srcset="...">
  const srcsetRe = /<source[^>]+srcset="([^"]+)"/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    const src = m[1];
    if (src && !src.startsWith("data:") && !src.startsWith("http")) paths.add(src);
  }
  // background-image: url(...)
  const bgRe = /url\(["']?([^"')]+)["']?\)/gi;
  while ((m = bgRe.exec(html)) !== null) {
    const src = m[1];
    if (src && !src.startsWith("data:") && !src.startsWith("http") && /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(src)) paths.add(src);
  }
  return Array.from(paths);
}

/**
 * Extract all video/iframe URLs from an HTML template.
 * Returns array of { tag, src } objects.
 */
function extractVideosFromHtml(html: string): string[] {
  const urls = new Set<string>();
  // <video> with <source src="..."> or <data-src src="...">
  const videoSrcRe = /<(?:source|data-src)[^>]+src="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = videoSrcRe.exec(html)) !== null) {
    if (m[1]) urls.add(m[1]);
  }
  // <video src="...">
  const videoDirectRe = /<video[^>]+src="([^"]+)"/gi;
  while ((m = videoDirectRe.exec(html)) !== null) {
    if (m[1]) urls.add(m[1]);
  }
  // <iframe src="...">
  const iframeRe = /<iframe[^>]+src="([^"]+)"/gi;
  while ((m = iframeRe.exec(html)) !== null) {
    if (m[1]) urls.add(m[1]);
  }
  return Array.from(urls);
}

/** Sub-component for a single image in the universal image editor — shows dimensions + AI generation */
function ImageCard({
  imgPath,
  currentUrl,
  displayUrl,
  onOverride,
  onUpload,
  landingId,
  blockId,
  blockBgColor,
  enqueue,
  onBlockContentGenerated,
}: {
  imgPath: string;
  currentUrl: string;
  displayUrl: string;
  onOverride: (originalPath: string, newUrl: string) => void;
  onUpload: (file: File, originalPath: string) => void;
  landingId: string;
  blockId: string;
  blockBgColor: string;
  enqueue: (options: { functionName: string; payload: Record<string, any>; displayTitle: string; lane: "claude" | "openrouter"; targetUrl?: string }) => Promise<string | null>;
  onBlockContentGenerated?: (blockId: string, newOverrides: Record<string, any>) => void;
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTab, setAiTab] = useState<"edit" | "generate">("edit");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const fileName = imgPath.split("/").pop() || imgPath;

  useEffect(() => {
    setDims(null);
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = displayUrl;
  }, [displayUrl]);

  // Convert an image URL to a base64 data URL via canvas (needed for localhost/private URLs)
  const imageUrlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context error")); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Не удалось загрузить изображение для конвертации"));
      img.src = url;
    });
  };

  // Build prompt hints shared between edit/generate modes
  const buildPromptHints = (withChromakey: boolean) => {
    const parts: string[] = [];
    if (dims) parts.push(`Размер: ${dims.w}x${dims.h} пикселей.`);
    if (withChromakey) {
      parts.push(`ВАЖНО: Размести объект на СПЛОШНОМ ЯРКО-ЗЕЛЁНОМ фоне (#00FF00). Весь фон должен быть однородным чистым зелёным (#00FF00) без градиентов, теней и вариаций. Зелёный фон будет удалён программно.`);
    } else {
      parts.push(`Фон блока: ${blockBgColor || "#ffffff"}. Не используй шахматный паттерн (клеточки) вместо прозрачности — используй цвет фона блока (${blockBgColor || "#ffffff"}).`);
    }
    return parts.join(" ");
  };

  // Rebuild prompt when removeBg checkbox changes
  const rebuildPromptForMode = (tab: "edit" | "generate", chromakey: boolean) => {
    const hints = buildPromptHints(chromakey);
    if (tab === "edit") {
      setAiPrompt(`Внеси изменения в текущее изображение. ${hints}\nОписание изменений: `);
    } else {
      setAiPrompt(`Сгенерируй изображение для лендинга онлайн-курса. ${hints}\nСтиль: современный, минималистичный, профессиональный.`);
    }
  };

  // Pre-fill prompt template when dialog opens — different text for edit vs generate
  const openAiDialog = () => {
    const hasImage = !!(currentUrl || displayUrl);
    const tab = hasImage ? "edit" : "generate";
    setAiTab(tab);
    setRemoveBg(false);
    rebuildPromptForMode(tab, false);
    setAiDialogOpen(true);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Введите промпт для генерации");
      return;
    }
    setAiGenerating(true);
    try {
      const payload: Record<string, any> = {
        landing_id: landingId,
        block_id: blockId,
        image_path: imgPath,
        prompt: aiPrompt,
        remove_bg: removeBg,
      };
      if (dims) {
        payload.width = dims.w;
        payload.height = dims.h;
      }
      // In edit mode, convert image to base64 data URL so OpenRouter can read it
      // (the displayUrl may be localhost which OpenRouter cannot access)
      if (aiTab === "edit" && displayUrl) {
        try {
          const base64Url = await imageUrlToBase64(displayUrl);
          payload.source_image_url = base64Url;
        } catch {
          // If conversion fails, try sending the URL as-is (works for public URLs)
          payload.source_image_url = displayUrl;
        }
      }

      const taskId = await enqueue({
        functionName: "generate-landing-image",
        payload,
        displayTitle: `AI изображение: ${fileName}`,
        lane: "openrouter",
        taskType: "landing",
        targetUrl: `/landings/${landingId}`,
      });

      if (!taskId) {
        setAiGenerating(false);
        return;
      }

      setAiDialogOpen(false);

      // Poll for completion
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
          const result = task.result as any;
          if (result?.image_url) {
            onOverride(imgPath, result.image_url);
            toast.success("Изображение сгенерировано!", { description: fileName });
          }
          // Also refresh block overrides
          const { data: updatedBlock } = await supabase
            .from("landing_blocks")
            .select("content_overrides")
            .eq("id", blockId)
            .single();
          if (updatedBlock && onBlockContentGenerated) {
            onBlockContentGenerated(blockId, updatedBlock.content_overrides as Record<string, any>);
          }
        } else if (task.status === "error") {
          clearInterval(pollInterval);
          setAiGenerating(false);
          toast.error("Ошибка генерации изображения", {
            description: task.error_message || "Неизвестная ошибка",
          });
        }
      }, 2000);

      // Safety timeout
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
    <div className="space-y-1 border rounded p-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground truncate block" title={imgPath}>
          {fileName}
        </Label>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {dims && (
            <span className="text-[10px] text-muted-foreground">
              {dims.w}×{dims.h}px
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
            onClick={openAiDialog}
            disabled={aiGenerating}
            title="AI генерация изображения"
          >
            {aiGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
          </Button>
        </div>
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

      {/* AI Image Generation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-500" />
              AI генерация изображения
            </DialogTitle>
          </DialogHeader>

          <Tabs value={aiTab} onValueChange={(v) => {
            const tab = v as "edit" | "generate";
            setAiTab(tab);
            rebuildPromptForMode(tab, removeBg);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" disabled={!displayUrl}>
                Редактировать текущее
              </TabsTrigger>
              <TabsTrigger value="generate">
                Сгенерировать новое
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-3 mt-3">
              {displayUrl && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Текущее изображение:</Label>
                  <img
                    src={displayUrl}
                    alt=""
                    className="w-full h-24 object-contain rounded border bg-muted"
                  />
                  {dims && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      {dims.w}×{dims.h}px
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Что изменить:</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="Опишите, как нужно изменить это изображение..."
                  className="text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-3 mt-3">
              {dims && (
                <p className="text-xs text-muted-foreground">
                  Размер: {dims.w}×{dims.h}px
                </p>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Промпт для генерации:</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="Опишите изображение, которое нужно сгенерировать..."
                  className="text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="remove-bg"
              checked={removeBg}
              onCheckedChange={(checked) => {
                const val = checked === true;
                setRemoveBg(val);
                rebuildPromptForMode(aiTab, val);
              }}
            />
            <label
              htmlFor="remove-bg"
              className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
            >
              <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
              Вырезать фон (chromakey)
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700"
            >
              {aiGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {aiGenerating ? "Генерация..." : "Сгенерировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Sub-component: arrow-key position controls for hero-block images */
function ImagePositionControl({
  imgPath,
  position,
  onChange,
}: {
  imgPath: string;
  position: { x: number; y: number };
  onChange: (imgPath: string, pos: { x: number; y: number }) => void;
}) {
  const STEP = 5; // px per click/keypress
  const move = (dx: number, dy: number) => {
    onChange(imgPath, { x: position.x + dx, y: position.y + dy });
  };

  // Keyboard handler for the container div
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":  e.preventDefault(); move(-STEP, 0); break;
      case "ArrowRight": e.preventDefault(); move(STEP, 0); break;
      case "ArrowUp":    e.preventDefault(); move(0, -STEP); break;
      case "ArrowDown":  e.preventDefault(); move(0, STEP); break;
    }
  };

  const hasOffset = position.x !== 0 || position.y !== 0;

  return (
    <div
      className="flex items-center gap-1 mt-1"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Move className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground shrink-0">Позиция:</span>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => move(-STEP, 0)} title="Влево">
        <ArrowLeft className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => move(STEP, 0)} title="Вправо">
        <ArrowRight className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => move(0, -STEP)} title="Вверх">
        <ArrowUp className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => move(0, STEP)} title="Вниз">
        <ArrowDown className="h-3 w-3" />
      </Button>
      {hasOffset && (
        <>
          <span className="text-[10px] text-muted-foreground ml-1">
            {position.x},{position.y}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onChange(imgPath, { x: 0, y: 0 })}
            title="Сбросить позицию"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

/** Sub-component: proportional scale control for images */
function ImageScaleControl({
  imgPath,
  scale,
  onChange,
}: {
  imgPath: string;
  scale: number;
  onChange: (imgPath: string, scale: number) => void;
}) {
  const STEP = 0.05; // 5% per click
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 3;
  const increase = () => onChange(imgPath, Math.min(MAX_SCALE, Math.round((scale + STEP) * 100) / 100));
  const decrease = () => onChange(imgPath, Math.max(MIN_SCALE, Math.round((scale - STEP) * 100) / 100));
  const isDefault = scale === 1;
  const pct = Math.round(scale * 100);

  return (
    <div className="flex items-center gap-1 mt-1">
      <ZoomIn className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground shrink-0">Размер:</span>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={decrease} title="Уменьшить">
        <ZoomOut className="h-3 w-3" />
      </Button>
      <span className="text-[10px] text-muted-foreground min-w-[32px] text-center">{pct}%</span>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={increase} title="Увеличить">
        <ZoomIn className="h-3 w-3" />
      </Button>
      {!isDefault && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onChange(imgPath, 1)}
          title="Сбросить размер"
        >
          <RotateCcw className="h-3 w-3" />
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

  // Ref for block ID to avoid stale closures in polling callbacks
  const blockIdRef = useRef(block?.id);
  blockIdRef.current = block?.id;

  // Cleanup polling on unmount (block switch triggers unmount due to key={block.id})
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);
  const cssClassMap = useCssClassMap();

  // Pre-compute styled values from the HTML template for this block.
  // These are used to display styled text in the editor when the user
  // hasn't made edits (content_overrides matches default_content).
  const styledValues = useMemo(() => {
    if (!block?.block_definition || !cssClassMap) return {};
    const def = block.block_definition;
    return extractStyledValues(
      def.html_template || "",
      def.default_content || {},
      def.editable_fields || [],
      cssClassMap,
    );
  }, [block?.block_definition, cssClassMap]);

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

  const defaults = def?.default_content || {};

  const getContentValue = (fieldPath: string): any => {
    const parts = fieldPath.split(".");
    // Try overrides first
    let val: any = overrides;
    for (const part of parts) {
      if (val == null) break;
      val = val[part];
    }
    // Fall back to default_content if not found in overrides
    if (val === undefined || val === null || val === "") {
      let dv: any = defaults;
      for (const part of parts) {
        if (dv == null) return "";
        dv = dv[part];
      }
      return dv ?? "";
    }
    return val;
  };

  /** Strip HTML tags from a string for comparison purposes */
  const stripHtmlTags = (s: string): string =>
    s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

  /**
   * Get the display value for a text field in the RichTextEditor.
   * If the user hasn't edited the field (value equals default_content),
   * returns the styled HTML extracted from the template. Otherwise
   * returns the user's own content_override value.
   */
  const getStyledContentValue = (fieldPath: string): string => {
    const currentVal = getContentValue(fieldPath);
    if (typeof currentVal !== "string") return currentVal ?? "";

    // Check if user hasn't edited — value matches plain-text default.
    // Compare stripped text since default_content may contain styled HTML
    // while content_overrides has the old plain text.
    const defaultVal = getNestedDefault(fieldPath);
    const styledHtml = styledValues[fieldPath];
    if (typeof defaultVal === "string") {
      const curPlain = stripHtmlTags(currentVal);
      const defPlain = stripHtmlTags(defaultVal);
      // If styled HTML from template extraction is available
      if (styledHtml && curPlain === defPlain) {
        return styledHtml;
      }
      // If default_content itself has styled HTML (DB-level styling)
      if (curPlain === defPlain && defaultVal !== currentVal && /<[^>]+style=/.test(defaultVal)) {
        return defaultVal;
      }
    }

    return currentVal;
  };

  /** Get default_content value by field path */
  const getNestedDefault = (fieldPath: string): any => {
    const parts = fieldPath.split(".");
    let val: any = def?.default_content || {};
    for (const part of parts) {
      if (val == null) return undefined;
      val = val[part];
    }
    return val;
  };

  /** Get display value for a repeater sub-field, using styled value if unedited */
  const getStyledRepeaterValue = (item: any, subFieldKey: string, styledPath: string): string => {
    const val = item[subFieldKey] || "";
    if (typeof val !== "string") return val ?? "";
    // Check if it matches the default — compare stripped text
    const defaultVal = getNestedDefault(styledPath);
    const styledHtml = styledValues[styledPath];
    if (typeof defaultVal === "string") {
      const curPlain = stripHtmlTags(val);
      const defPlain = stripHtmlTags(defaultVal);
      // If styled HTML from template extraction is available
      if (styledHtml && curPlain === defPlain) {
        return styledHtml;
      }
      // If default_content itself has styled HTML (DB-level styling)
      if (curPlain === defPlain && defaultVal !== val && /<[^>]+style=/.test(defaultVal)) {
        return defaultVal;
      }
    }
    return val;
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
          <RichTextEditor
            id={fieldId}
            value={getStyledContentValue(path) || ""}
            onChange={(html) => updateContentField(path, html)}
            placeholder={field.label}
            singleLine
          />
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={path} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          <RichTextEditor
            id={fieldId}
            value={getStyledContentValue(path) || ""}
            onChange={(html) => updateContentField(path, html)}
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
                // Use styled value for repeater sub-fields too
                const styledSubPath = `${field.field}.${itemIdx}.${subField.field}`;
                if (subField.type === "text") {
                  const displayVal = getStyledRepeaterValue(item, subField.field, styledSubPath);
                  return (
                    <div key={subField.field}>
                      <Label className="text-xs text-muted-foreground">{subField.label}</Label>
                      <RichTextEditor
                        id={subFieldId}
                        value={displayVal}
                        onChange={(html) => {
                          const newItems = [...items];
                          newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: html };
                          updateContentField(path, newItems);
                        }}
                        singleLine
                      />
                    </div>
                  );
                }
                if (subField.type === "textarea") {
                  const displayVal = getStyledRepeaterValue(item, subField.field, styledSubPath);
                  return (
                    <div key={subField.field}>
                      <Label className="text-xs text-muted-foreground">{subField.label}</Label>
                      <RichTextEditor
                        id={subFieldId}
                        value={displayVal}
                        onChange={(html) => {
                          const newItems = [...items];
                          newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: html };
                          updateContentField(path, newItems);
                        }}
                        rows={2}
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
                if (subField.type === "bullet_list") {
                  const bulletValue = item[subField.field] || "";
                  return (
                    <div key={subField.field}>
                      <Label className="text-xs text-muted-foreground">{subField.label}</Label>
                      <Textarea
                        value={bulletValue}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[itemIdx] = { ...newItems[itemIdx], [subField.field]: e.target.value };
                          updateContentField(path, newItems);
                        }}
                        rows={4}
                        className="text-xs"
                        placeholder="Один пункт на строку"
                      />
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
        taskType: "landing",
        targetUrl: `/landings/${landingId}`,
      });

      if (!taskId) {
        setAiGenerating(false);
        return;
      }

      // Store the block ID at enqueue time (not from closure)
      const generatingBlockId = block.id;
      const generatingBlockName = def?.name || "блок";

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
          pollIntervalRef.current = null;
          setAiGenerating(false);
          toast.success("Контент сгенерирован!", {
            description: `Блок "${generatingBlockName}" обновлён`,
          });
          // Re-fetch the block to get updated content_overrides
          const { data: updatedBlock } = await supabase
            .from("landing_blocks")
            .select("content_overrides")
            .eq("id", generatingBlockId)
            .single();
          if (updatedBlock && onBlockContentGenerated) {
            onBlockContentGenerated(generatingBlockId, updatedBlock.content_overrides as Record<string, any>);
          }
        } else if (task.status === "error") {
          clearInterval(pollInterval);
          pollIntervalRef.current = null;
          setAiGenerating(false);
          toast.error("Ошибка генерации", {
            description: task.error_message || "Неизвестная ошибка",
          });
        }
      }, 2000);
      pollIntervalRef.current = pollInterval;

      // Safety timeout — stop polling after 3 minutes
      const safetyTimeout = setTimeout(() => {
        clearInterval(pollInterval);
        pollIntervalRef.current = null;
        setAiGenerating(false);
      }, 180_000);
      pollTimeoutRef.current = safetyTimeout;
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

          {/* Universal image editor — show ALL images from _all_images + auto-extracted from HTML */}
          {(() => {
            // Merge: stored _all_images + auto-extracted from HTML template (deduplicated)
            const storedImages: string[] =
              overrides._all_images ||
              def?.default_content?._all_images ||
              [];
            const htmlImages = def?.html_template ? extractImagesFromHtml(def.html_template) : [];
            const seen = new Set<string>();
            const allImages: string[] = [];
            for (const img of [...storedImages, ...htmlImages]) {
              // Deduplicate by base name (ignore extension variants like .jpg/.webp)
              const base = img.replace(/\.(jpg|jpeg|png|webp|svg|gif)$/i, "");
              if (!seen.has(base)) {
                seen.add(base);
                allImages.push(img);
              }
            }
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

            // Image position adjustment (hero blocks only)
            const isHeroBlock = !!(
              def?.block_type?.toLowerCase().includes("hero") ||
              def?.category?.toLowerCase().includes("hero")
            );
            const imagePositions: Record<string, { x: number; y: number }> = overrides._image_positions || {};
            const imageScales: Record<string, number> = overrides._image_scales || {};

            const handleImagePositionChange = (imgPathKey: string, pos: { x: number; y: number }) => {
              const newOverrides = { ...overrides };
              const newPositions = { ...(newOverrides._image_positions || {}), [imgPathKey]: pos };
              // Remove entry if reset to 0,0
              if (pos.x === 0 && pos.y === 0) delete newPositions[imgPathKey];
              newOverrides._image_positions = Object.keys(newPositions).length > 0 ? newPositions : undefined;
              if (!newOverrides._image_positions) delete newOverrides._image_positions;
              onUpdateBlock(block.id, { content_overrides: newOverrides });
            };

            const handleImageScaleChange = (imgPathKey: string, scale: number) => {
              const newOverrides = { ...overrides };
              const newScales = { ...(newOverrides._image_scales || {}), [imgPathKey]: scale };
              if (scale === 1) delete newScales[imgPathKey];
              newOverrides._image_scales = Object.keys(newScales).length > 0 ? newScales : undefined;
              if (!newOverrides._image_scales) delete newOverrides._image_scales;
              onUpdateBlock(block.id, { content_overrides: newOverrides });
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
                    <div key={imgIdx}>
                      <ImageCard
                        imgPath={imgPath}
                        currentUrl={imageOverrides[imgPath] || ""}
                        displayUrl={imageOverrides[imgPath] || baseUrl + imgPath}
                        onOverride={handleImageOverride}
                        onUpload={handleImageUpload}
                        landingId={landingId}
                        blockId={block.id}
                        blockBgColor={settings.background_color || "#ffffff"}
                        enqueue={enqueue}
                        onBlockContentGenerated={onBlockContentGenerated}
                      />
                      {isHeroBlock && (
                        <ImagePositionControl
                          imgPath={imgPath}
                          position={imagePositions[imgPath] || { x: 0, y: 0 }}
                          onChange={handleImagePositionChange}
                        />
                      )}
                      <ImageScaleControl
                        imgPath={imgPath}
                        scale={imageScales[imgPath] || 1}
                        onChange={handleImageScaleChange}
                      />
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Universal video/iframe editor — auto-extracted from HTML template */}
          {(() => {
            const allVideos = def?.html_template ? extractVideosFromHtml(def.html_template) : [];
            if (allVideos.length === 0) return null;

            const videoOverrides: Record<string, string> = overrides._video_overrides || {};

            const handleVideoOverride = (originalUrl: string, newUrl: string) => {
              const newOverrides = { ...overrides };
              const newVidOv = { ...(newOverrides._video_overrides || {}), [originalUrl]: newUrl };
              if (!newUrl) delete newVidOv[originalUrl];
              newOverrides._video_overrides = newVidOv;
              onUpdateBlock(block.id, { content_overrides: newOverrides });
            };

            return (
              <>
                <Separator />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Video className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
                  Видео блока ({allVideos.length})
                </h4>
                <div className="space-y-3">
                  {allVideos.map((videoUrl, vidIdx) => {
                    const shortName = videoUrl.split("/").pop()?.substring(0, 40) || videoUrl;
                    const isIframe = videoUrl.includes("kinescope") || videoUrl.includes("youtube") || videoUrl.includes("vimeo");
                    return (
                      <div key={vidIdx} className="space-y-1 p-2 bg-muted/50 rounded-md">
                        <p className="text-xs font-mono text-muted-foreground truncate" title={videoUrl}>
                          {isIframe ? "iframe" : "video"}: {shortName}
                        </p>
                        <Input
                          value={videoOverrides[videoUrl] || ""}
                          onChange={(e) => handleVideoOverride(videoUrl, e.target.value)}
                          placeholder={videoUrl}
                          className="h-7 text-xs"
                        />
                        {videoOverrides[videoUrl] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleVideoOverride(videoUrl, "")}
                          >
                            Сбросить к оригиналу
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          <Separator />

          {/* Settings */}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Оформление</h4>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">ID секции (якорь)</Label>
              <Input
                value={settings.section_id || ""}
                onChange={(e) => updateSetting("section_id", e.target.value)}
                placeholder="Например: tariff"
                className="flex-1 h-8 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Используйте в ссылках формат <span className="font-mono">#id</span> для скролла к секции.
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Фон секции</Label>
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
              <Label className="text-xs">Фон карточек</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.card_color || "#f5f5f5"}
                  onChange={(e) => updateSetting("card_color", e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={settings.card_color || ""}
                  onChange={(e) => updateSetting("card_color", e.target.value)}
                  placeholder="#f5f5f5"
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

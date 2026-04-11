import { useRef, useEffect, useState, useCallback } from "react";
import { Settings, ArrowUp, ArrowDown, Trash2, ImageIcon, Loader2, RefreshCcw, Upload, FolderOpen, BookmarkPlus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { blockTypeLabels, isGeneratedBlock, isTemplateLocked, type EmailBlockType } from "./BlockLibrary";
import { Lock } from "lucide-react";
import type { ImagePlaceholder } from "./LetterGenerationPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlaceholderRect {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface EmailBlock {
  id: string;
  block_type: EmailBlockType;
  sort_order: number;
  config: Record<string, any>;
  generated_html: string;
  banner_image_prompt: string;
  banner_image_url: string;
}

interface Props {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  headerHtml: string;
  footerHtml: string;
  colorSchemeId?: string | null;
  onSelectBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: "up" | "down") => void;
  onDeleteBlock: (id: string) => void;
  onGenerateImage?: (id: string) => void;
  generatingImageBlockId?: string | null;
  // Full-letter mode
  generatedHtml?: string;
  imagePlaceholders?: ImagePlaceholder[];
  onGeneratePlaceholderImage?: (placeholderId: string) => void;
  generatingPlaceholderIds?: Set<string>;
  onUpdateGeneratedHtml?: (html: string) => void;
  onUploadPlaceholderImage?: (placeholderId: string, file: File) => void;
  onPickFromLibrary?: (placeholderId: string) => void;
  onSavePlaceholderToLibrary?: (placeholderId: string) => void;
  onRefinePlaceholderImage?: (placeholderId: string) => void;
  generatingLetter?: boolean;
}

/** Restore placeholder markers from rendered HTML back to {{id}} format */
function restorePlaceholderMarkers(
  html: string,
  placeholders: ImagePlaceholder[],
) {
  let result = html;
  for (const ph of placeholders) {
    // Replace <img src="real_url" ...> back to <img src="{{id}}" ...> for generated images
    if (ph.image_url) {
      const escapedUrl = ph.image_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`(<img[^>]*src\\s*=\\s*["'])${escapedUrl}(["'][^>]*/?>)`, 'g'),
        `$1{{${ph.id}}}$2`
      );
      // Also handle standalone <img> that were injected for standalone markers
      result = result.replace(
        new RegExp(`<img[^>]*src\\s*=\\s*["']${escapedUrl}["'][^>]*/?>`, 'g'),
        `{{${ph.id}}}`
      );
    }
    // Replace background-image: url(real_url) back to background-image: url({{id}})
    if (ph.image_url) {
      const escapedUrl = ph.image_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`background-image:\\s*url\\(\\s*${escapedUrl}\\s*\\)`, 'g'),
        `background-image: url({{${ph.id}}})`
      );
    }
    // Replace fallback styles (unfilled placeholders) back to background-image: url({{id}})
    // Handles both: "background-image: none; background-color: transparent" and bare "background-image: none"
    const escapedId = ph.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // First pass: tagged elements (with data-placeholder-id)
    result = result.replace(
      new RegExp(`(data-placeholder-id\\s*=\\s*["']${escapedId}["'][^>]*?)background-image:\\s*none(?:;\\s*background-color:\\s*(?:#e5e7eb|transparent))?`, 'g'),
      `$1background-image: url({{${ph.id}}})`
    );
    // Remove injected data-placeholder-* attributes for this placeholder
    result = result.replace(
      new RegExp(`\\s*data-placeholder-id\\s*=\\s*["']${escapedId}["']`, 'g'),
      ''
    );
    result = result.replace(
      /\s*data-placeholder-(?:filled|unfilled|bg)\s*=\s*["']true["']/g,
      ''
    );

    // Replace <div data-placeholder-id="id">...</div> back to {{id}} or <img src="{{id}}">
    const divRegex = new RegExp(
      `<div[^>]*data-placeholder-id\\s*=\\s*["']${ph.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>.*?</div>`,
      'gs'
    );
    result = result.replace(divRegex, `{{${ph.id}}}`);
  }
  return result;
}

/** Replace {{placeholder_id}} markers with real <img> or styled placeholders in-string */
function preprocessHtmlWithPlaceholders(
  html: string,
  placeholders: ImagePlaceholder[],
) {
  const phMap = new Map<string, ImagePlaceholder>();
  for (const ph of placeholders) phMap.set(ph.id, ph);

  // Build reverse map: type name → placeholder id (e.g. "tool_diagram" → "image_placeholder_3")
  const typeToId = new Map<string, string>();
  for (const ph of placeholders) {
    if (ph.type) typeToId.set(ph.type.toLowerCase(), ph.id);
  }

  let result = html;

  // FALLBACK: Claude sometimes generates <div ...>type_name — WxH</div> instead of {{image_placeholder_N}}.
  // Detect these and convert them to proper <img src="{{id}}"> markers before the main regexes run.
  if (typeToId.size > 0) {
    result = result.replace(
      /<div[^>]*>\s*([a-z_]+(?:_[a-z_]+)*)\s*(?:—|–|-)\s*(\d+)\s*[x×]\s*(\d+)\s*<\/div>/gi,
      (_match, typeName, w, h) => {
        const id = typeToId.get(typeName.toLowerCase());
        if (!id) return _match;
        return `<img src="{{${id}}}" width="${w}" height="${h}" style="display:block;width:100%;height:auto;border-radius:16px;" />`;
      }
    );
  }

  // Replace img src="{{id}}" patterns
  result = result.replace(
    /(<img[^>]*src\s*=\s*["'])\{\{([^}]+)\}\}(["'][^>]*\/?>)/g,
    (_match, before, id, after) => {
      const ph = phMap.get(id);
      if (!ph) return _match;
      if (ph.image_url) {
        return `${before}${ph.image_url}${after}`;
      }
      return `<div data-placeholder-id="${id}" style="display:block;width:100%;min-height:200px;background:#f0f0f0;border:2px dashed #ccc;border-radius:8px;text-align:center;padding:40px 20px;color:#999;font-size:14px;">${ph.type || "Изображение"} — ${ph.size || "нажмите сгенерировать"}</div>`;
    }
  );

  // Replace background-image: url({{id}}) patterns — only FIRST occurrence per ID gets controls
  const bgSeenIds = new Set<string>();
  const bgRegex = /(<[a-zA-Z][^>]*?)(\s*style\s*=\s*["'][^"']*?)background-image:\s*url\(\s*\{\{(image_placeholder_\w+)\}\}\s*\)([^"']*["'][^>]*?>)/g;
  result = result.replace(bgRegex,
    (_match, tagStart, styleBefore, id, styleAfter) => {
      const ph = phMap.get(id);
      if (!ph) return _match;
      const isFirst = !bgSeenIds.has(id);
      bgSeenIds.add(id);
      if (isFirst) {
        if (ph.image_url) {
          return `${tagStart} data-placeholder-id="${id}" data-placeholder-filled="true"${styleBefore}background-image: url(${ph.image_url})${styleAfter}`;
        }
        // Unfilled first occurrence: mark for overlay but keep transparent (no gray bg)
        return `${tagStart} data-placeholder-id="${id}" data-placeholder-unfilled="true" data-placeholder-bg="true"${styleBefore}background-image: none; background-color: transparent${styleAfter}`;
      } else {
        if (ph.image_url) {
          return `${tagStart}${styleBefore}background-image: url(${ph.image_url})${styleAfter}`;
        }
        return _match; // keep original {{id}} marker — browser shows empty bg for invalid URL
      }
    }
  );

  // Replace standalone {{id}} patterns (any placeholder ID, not just image_placeholder_*)
  result = result.replace(
    /\{\{([^}]+)\}\}/g,
    (_match, id) => {
      const ph = phMap.get(id);
      if (!ph) return _match;
      if (ph.image_url) {
        return `<img src="${ph.image_url}" style="max-width:100%;border-radius:6px;" />`;
      }
      return `<div data-placeholder-id="${id}" style="display:block;width:100%;min-height:200px;background:#f0f0f0;border:2px dashed #ccc;border-radius:8px;text-align:center;padding:40px 20px;color:#999;font-size:14px;">${ph.type || "Изображение"} — ${ph.size || "нажмите сгенерировать"}</div>`;
    }
  );

  // Inject CSS reset to ensure email tables render correctly inside contentEditable
  const emailCssReset = `<style>
    table { table-layout: auto !important; border-collapse: collapse; max-width: 100% !important; }
    td, th { word-break: normal !important; overflow-wrap: normal !important; }
    img { max-width: 100%; height: auto; }
  </style>`;

  return emailCssReset + result;
}

const USER_BLOCK_TYPES = ["text", "image", "cta", "divider", "card", "paid_programs_collection", "free_courses_grid", "diagnostics_grid"];

export default function BlockCanvas({
  blocks, selectedBlockId, headerHtml, footerHtml, colorSchemeId,
  onSelectBlock, onMoveBlock, onDeleteBlock,
  onGenerateImage, generatingImageBlockId,
  generatedHtml, imagePlaceholders,
  onGeneratePlaceholderImage, generatingPlaceholderIds,
  onUpdateGeneratedHtml, onUploadPlaceholderImage,
  onPickFromLibrary, onSavePlaceholderToLibrary,
  onRefinePlaceholderImage,
  generatingLetter,
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ el: HTMLAnchorElement; href: string; top: number; left: number } | null>(null);
  const { data: accentColor } = useQuery({
    queryKey: ["color_scheme_accent", colorSchemeId],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("preview_colors").eq("id", colorSchemeId!).single();
      return data?.preview_colors?.[1] || null;
    },
    enabled: !!colorSchemeId,
  });
  const isFullLetterMode = !!generatedHtml;
  const contentRef = useRef<HTMLDivElement>(null);
  const [placeholderRects, setPlaceholderRects] = useState<PlaceholderRect[]>([]);

  // In full letter mode, only show user blocks
  const visibleBlocks = isFullLetterMode
    ? blocks.filter(b => USER_BLOCK_TYPES.includes(b.block_type))
    : blocks;

  // Build placeholder lists
  const allPlaceholders = imagePlaceholders || [];
  const unfilledPlaceholders = allPlaceholders.filter(ph => !ph.image_url);
  const filledPlaceholders = allPlaceholders.filter(ph => !!ph.image_url);

  // Preprocess HTML for unified rendering
  const processedHtml = isFullLetterMode && generatedHtml
    ? preprocessHtmlWithPlaceholders(generatedHtml, imagePlaceholders || [])
    : "";

  // Measure placeholder positions after render
  const measurePlaceholders = useCallback(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;
    const containerRect = container.getBoundingClientRect();
    const rects: PlaceholderRect[] = [];

    // Unfilled: div[data-placeholder-id]
    const els = container.querySelectorAll<HTMLElement>("[data-placeholder-id]");
    els.forEach(el => {
      const id = el.getAttribute("data-placeholder-id");
      if (!id) return;
      // For background-image placeholders, measure the nearest <table> ancestor (full banner)
      const isBgPlaceholder = el.hasAttribute("data-placeholder-bg");
      let measureEl: HTMLElement = el;
      if (isBgPlaceholder && el.hasAttribute("data-placeholder-unfilled")) {
        const tableAncestor = el.closest("table");
        if (tableAncestor && container.contains(tableAncestor)) {
          measureEl = tableAncestor;
        }
      }
      const elRect = measureEl.getBoundingClientRect();
      rects.push({
        id,
        top: elRect.top - containerRect.top + container.scrollTop,
        left: elRect.left - containerRect.left + container.scrollLeft,
        width: elRect.width,
        height: elRect.height,
      });
    });

    // Filled: find <img> whose src matches a filled placeholder URL
    if (filledPlaceholders.length > 0) {
      const imgs = container.querySelectorAll<HTMLImageElement>("img");
      imgs.forEach(img => {
        const matchedPh = filledPlaceholders.find(ph => ph.image_url && img.src.includes(ph.image_url));
        if (matchedPh) {
          const elRect = img.getBoundingClientRect();
          rects.push({
            id: matchedPh.id,
            top: elRect.top - containerRect.top + container.scrollTop,
            left: elRect.left - containerRect.left + container.scrollLeft,
            width: elRect.width,
            height: elRect.height,
          });
        }
      });
    }

    // Filled: find elements with data-placeholder-filled (background-image placeholders)
    const filledBgEls = container.querySelectorAll<HTMLElement>("[data-placeholder-filled]");
    filledBgEls.forEach(el => {
      const id = el.getAttribute("data-placeholder-id");
      if (!id) return;
      // Skip if already added by the unfilled selector above
      if (rects.some(r => r.id === id)) return;
      const elRect = el.getBoundingClientRect();
      rects.push({
        id,
        top: elRect.top - containerRect.top + container.scrollTop,
        left: elRect.left - containerRect.left + container.scrollLeft,
        width: elRect.width,
        height: elRect.height,
      });
    });

    setPlaceholderRects(rects);
  }, [filledPlaceholders]);

  // Force-update contentEditable innerHTML when processedHtml changes (React won't do it)
  useEffect(() => {
    if (!isFullLetterMode || !contentRef.current || !processedHtml) return;
    contentRef.current.innerHTML = processedHtml;
  }, [isFullLetterMode, processedHtml]);

  // Measure placeholder positions after DOM update
  useEffect(() => {
    if (!isFullLetterMode) return;
    requestAnimationFrame(measurePlaceholders);
  }, [isFullLetterMode, processedHtml, measurePlaceholders]);

  // Re-measure on window resize
  useEffect(() => {
    if (!isFullLetterMode) return;
    window.addEventListener("resize", measurePlaceholders);
    return () => window.removeEventListener("resize", measurePlaceholders);
  }, [isFullLetterMode, measurePlaceholders]);

  const handleUploadClick = (placeholderId: string) => {
    setUploadTargetId(placeholderId);
    uploadInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetId && onUploadPlaceholderImage) {
      onUploadPlaceholderImage(uploadTargetId, file);
    }
    e.target.value = "";
    setUploadTargetId(null);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 600 }}>
      {/* Hidden file input for image upload */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      {headerHtml && (
        <div
          className="border-b border-dashed border-muted-foreground/30 pb-2 mb-2 opacity-60 pointer-events-none"
          dangerouslySetInnerHTML={{ __html: headerHtml }}
        />
      )}

      {/* Full letter mode — single editable container with overlay buttons */}
      {isFullLetterMode && (
        <div className="relative">
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none focus:ring-2 focus:ring-primary/20 rounded"
            style={{ maxWidth: "100%", overflow: "hidden" }}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
            onClick={(e) => {
              // Detect click on <a> elements for link editing
              const target = e.target as HTMLElement;
              const anchor = target.closest("a") as HTMLAnchorElement | null;
              if (anchor && contentRef.current?.contains(anchor)) {
                e.preventDefault();
                const rect = anchor.getBoundingClientRect();
                const containerRect = contentRef.current!.getBoundingClientRect();
                setEditingLink({
                  el: anchor,
                  href: anchor.getAttribute("href") || "",
                  top: rect.bottom - containerRect.top + contentRef.current!.scrollTop + 4,
                  left: rect.left - containerRect.left,
                });
              } else {
                setEditingLink(null);
              }
            }}
            onBlur={(e) => {
              // Don't trigger re-render if clicking inside link popup or placeholder buttons
              const related = e.relatedTarget as HTMLElement | null;
              if (related?.closest("[data-link-popup]")) return;
              if (related?.closest("[data-placeholder-buttons]")) return;
              let html = e.currentTarget.innerHTML;
              if (imagePlaceholders?.length) {
                html = restorePlaceholderMarkers(html, imagePlaceholders);
              }
              onUpdateGeneratedHtml?.(html);
            }}
          />

          {/* Link editing popup */}
          {editingLink && (
            <div
              data-link-popup
              className="absolute z-30 bg-background border border-border rounded-md shadow-lg p-2 flex items-center gap-1.5"
              style={{ top: editingLink.top, left: editingLink.left, maxWidth: 360 }}
            >
              <Input
                className="h-7 text-xs flex-1"
                value={editingLink.href}
                placeholder="https://..."
                onChange={(e) => setEditingLink({ ...editingLink, href: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    editingLink.el.href = editingLink.href;
                    setEditingLink(null);
                  }
                }}
              />
              <Button
                size="sm"
                className="h-7 text-xs px-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editingLink.el.href = editingLink.href;
                  setEditingLink(null);
                }}
              >
                OK
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 text-destructive"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  // Remove the link, keep text
                  const parent = editingLink.el.parentNode;
                  if (parent) {
                    while (editingLink.el.firstChild) {
                      parent.insertBefore(editingLink.el.firstChild, editingLink.el);
                    }
                    parent.removeChild(editingLink.el);
                  }
                  setEditingLink(null);
                }}
              >
                ✕
              </Button>
            </div>
          )}

          {/* Floating buttons for ALL placeholders (right side) */}
          {placeholderRects.map(rect => {
            const ph = (imagePlaceholders || []).find(p => p.id === rect.id);
            if (!ph) return null;
            const isFilled = !!ph.image_url;
            const isGenerating = generatingPlaceholderIds?.has(ph.id) ?? false;
            return (
              <div
                key={`ph-buttons-${rect.id}`}
                data-placeholder-buttons
                className="absolute flex flex-col gap-1 pointer-events-auto z-10"
                style={{
                  top: rect.top + 4,
                  left: rect.left + rect.width + 8,
                }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shadow-md bg-background/90 backdrop-blur-sm"
                  disabled={isGenerating}
                  title={isFilled ? "Перегенерировать" : "Сгенерировать"}
                  onClick={() => onGeneratePlaceholderImage?.(ph.id)}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isFilled ? (
                    <RefreshCcw className="h-3.5 w-3.5" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shadow-md bg-background/90 backdrop-blur-sm"
                  title="Загрузить своё"
                  onClick={() => handleUploadClick(ph.id)}
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
                {onPickFromLibrary && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shadow-md bg-background/90 backdrop-blur-sm"
                    title="Из библиотеки"
                    onClick={() => onPickFromLibrary(ph.id)}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                )}
                {isFilled && onSavePlaceholderToLibrary && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shadow-md bg-background/90 backdrop-blur-sm"
                    title="Сохранить в библиотеку"
                    onClick={() => onSavePlaceholderToLibrary(ph.id)}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  </Button>
                )}
                {isFilled && onRefinePlaceholderImage && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shadow-md bg-background/90 backdrop-blur-sm"
                    title="Правка изображения"
                    disabled={isGenerating}
                    onClick={() => onRefinePlaceholderImage(ph.id)}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Blocks (all in block mode, user-only in full letter mode) */}
      {!isFullLetterMode && visibleBlocks.length === 0 ? (
        generatingLetter ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Генерация письма…</p>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Добавьте блоки из библиотеки слева или сгенерируйте письмо целиком
          </div>
        )
      ) : visibleBlocks.length > 0 ? (
        <div className={isFullLetterMode ? "" : "space-y-2"}>
          {visibleBlocks.map((block, idx) => {
            const isTextImage = isGeneratedBlock(block.block_type) && (block.config.mode === "header_image" || block.config.mode === "schema_image");
            const needsImagePlaceholder = isTextImage && !block.banner_image_url && block.generated_html;
            const isGeneratingImage = generatingImageBlockId === block.id;
            const locked = isTemplateLocked(block.block_type);
            const hasTemplateLabel = !!block.config?.label && !block.generated_html;

            return (
              <div
                key={block.id}
                className={`group relative transition-colors ${
                  isFullLetterMode
                    ? ""
                    : `border rounded-lg ${
                      locked || hasTemplateLabel
                        ? "border-muted-foreground/20 cursor-default"
                        : `cursor-pointer ${
                            selectedBlockId === block.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/40"
                          }`
                    }`
                }`}
                onClick={() => !locked && !hasTemplateLabel && onSelectBlock(block.id)}
              >
                {/* Hover controls — hidden for template-label-only blocks */}
                {!hasTemplateLabel && (
                  <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-background border rounded-md shadow-sm px-1 py-0.5 z-10">
                    {!locked && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}>
                        <Settings className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, "up"); }}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === visibleBlocks.length - 1} onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, "down"); }}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                )}

                {/* Block content */}
                <div className={isFullLetterMode ? "py-1" : "p-4"}>
                  {needsImagePlaceholder && (
                    <div className="mb-3 bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center gap-3">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Изображение не сгенерировано</p>
                      {onGenerateImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isGeneratingImage || !block.banner_image_prompt}
                          onClick={(e) => { e.stopPropagation(); onGenerateImage(block.id); }}
                          className="gap-1.5"
                        >
                          {isGeneratingImage ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Генерация…</>
                          ) : (
                            <><ImageIcon className="h-3.5 w-3.5" /> Сгенерировать изображение</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {block.banner_image_url && (
                    <div className="mb-3">
                      <img src={block.banner_image_url} alt="" style={{ maxWidth: "100%", borderRadius: "6px" }} />
                    </div>
                  )}

                  {block.generated_html ? (
                    <div dangerouslySetInnerHTML={{ __html: block.generated_html }} />
                  ) : block.block_type === "card" ? (
                    <div style={{ backgroundColor: accentColor || "#F0EDF7", padding: "16px 16px" }}>
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px 32px", maxWidth: "100%" }}>
                        {(block.config.children || []).map((child: any, ci: number) => (
                          <div key={ci}>
                            {child.type === "text" && child.html && (
                              <div style={{ textAlign: child.align || "left" }} dangerouslySetInnerHTML={{ __html: child.html }} />
                            )}
                            {child.type === "image" && child.url && (
                              <div style={{ textAlign: "center", padding: "8px 0" }}>
                                <img src={child.url} alt={child.alt || ""} style={{ maxWidth: "100%", borderRadius: "6px" }} />
                              </div>
                            )}
                            {child.type === "cta" && child.text && (
                              <div style={{ textAlign: "center", padding: "12px 0" }}>
                                <a href={child.url || "#"} style={{ display: "inline-block", padding: "12px 32px", backgroundColor: child.color || accentColor || "#6366f1", color: "#ffffff", borderRadius: "6px", textDecoration: "none", fontWeight: 600 }}>
                                  {child.text}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!block.config.children || block.config.children.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">Пустая карточка — добавьте элементы в настройках</p>
                        )}
                      </div>
                    </div>
                  ) : block.block_type === "divider" ? (
                    <hr style={{ border: "none", borderTop: `1px solid ${accentColor || "hsl(var(--border))"}`, margin: "24px 0" }} />
                  ) : block.block_type === "text" && block.config.html ? (
                    <div dangerouslySetInnerHTML={{ __html: block.config.html }} />
                  ) : block.block_type === "cta" && block.config.text ? (
                    <div className="text-center py-2">
                      <a
                        href={block.config.url || "#"}
                        style={{
                          display: "inline-block",
                          padding: "12px 32px",
                          backgroundColor: block.config.color || accentColor || "hsl(var(--primary))",
                          color: "#ffffff",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        {block.config.text}
                      </a>
                    </div>
                  ) : block.block_type === "image" && (block.config.url || block.config.src) ? (
                    <div style={{ textAlign: block.config.align || "center" }}>
                      <img
                        src={block.config.url || block.config.src}
                        alt={block.config.alt || ""}
                        style={{ maxWidth: "100%", width: "600px" }}
                      />
                    </div>
                  ) : hasTemplateLabel ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                        {block.config.label}
                      </span>
                      <span className="text-xs text-muted-foreground/60">— будет сгенерировано</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                      {locked ? (
                        <>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                            {blockTypeLabels[block.block_type]}
                          </span>
                          <span className="text-xs text-muted-foreground/60">— определяется промптом</span>
                        </>
                      ) : (
                        <>
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                            {blockTypeLabels[block.block_type]}
                          </span>
                          {isGeneratedBlock(block.block_type) && (
                            <span className="text-xs">— настройте и сгенерируйте в правой панели</span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Footer */}
      {footerHtml && (
        <div
          className="border-t border-dashed border-muted-foreground/30 pt-2 mt-2 opacity-60 pointer-events-none"
          dangerouslySetInnerHTML={{ __html: footerHtml }}
        />
      )}
    </div>
  );
}

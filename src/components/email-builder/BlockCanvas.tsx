import { Settings, ArrowUp, ArrowDown, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockTypeLabels, isGeneratedBlock, isTemplateLocked, type EmailBlockType } from "./BlockLibrary";
import { Lock } from "lucide-react";
import type { ImagePlaceholder } from "./LetterGenerationPanel";

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
  onSelectBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: "up" | "down") => void;
  onDeleteBlock: (id: string) => void;
  onGenerateImage?: (id: string) => void;
  generatingImageBlockId?: string | null;
  // Full-letter mode
  generatedHtml?: string;
  imagePlaceholders?: ImagePlaceholder[];
  onGeneratePlaceholderImage?: (placeholderId: string) => void;
  generatingPlaceholderId?: string | null;
}

function renderHtmlWithPlaceholders(
  html: string,
  placeholders: ImagePlaceholder[],
  onGenerate?: (id: string) => void,
  generatingId?: string | null,
) {
  // Build a map of placeholder_id -> ImagePlaceholder for quick lookup
  const phMap = new Map<string, ImagePlaceholder>();
  for (const ph of placeholders) {
    phMap.set(ph.id, ph);
  }

  // Split HTML by {{image_placeholder_N}} markers inside img src attributes
  // Pattern matches <img ...src="{{placeholder_id}}"...> or standalone {{placeholder_id}}
  const markerRegex = /(<img[^>]*src\s*=\s*["'])\{\{([^}]+)\}\}(["'][^>]*\/?>)|\{\{(image_placeholder_\w+)\}\}/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = 0;
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(html)) !== null) {
    const placeholderId = match[2] || match[4];
    const ph = phMap.get(placeholderId);
    if (!ph) continue;

    // Add HTML before the marker
    if (match.index > lastIndex) {
      parts.push(
        <div key={`html-${idx}`} dangerouslySetInnerHTML={{ __html: html.substring(lastIndex, match.index) }} />
      );
    }

    // Add placeholder or image
    if (ph.image_url) {
      parts.push(
        <div key={`img-${ph.id}`} className="my-3">
          <img src={ph.image_url} alt="" style={{ maxWidth: "100%", borderRadius: "6px" }} />
          {onGenerate && (
            <div className="mt-1 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                disabled={generatingId === ph.id}
                onClick={(e) => { e.stopPropagation(); onGenerate(ph.id); }}
              >
                {generatingId === ph.id ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Генерация…</>
                ) : (
                  <><ImageIcon className="h-3 w-3" /> Перегенерировать</>
                )}
              </Button>
            </div>
          )}
        </div>
      );
    } else {
      parts.push(
        <div
          key={`ph-${ph.id}`}
          className="my-3 bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center gap-2"
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{ph.type} — {ph.size}</p>
          {onGenerate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={generatingId === ph.id}
              onClick={(e) => { e.stopPropagation(); onGenerate(ph.id); }}
            >
              {generatingId === ph.id ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Генерация…</>
              ) : (
                <><ImageIcon className="h-3.5 w-3.5" /> Сгенерировать изображение</>
              )}
            </Button>
          )}
        </div>
      );
    }

    lastIndex = match.index + match[0].length;
    idx++;
  }

  // Add remaining HTML
  if (lastIndex < html.length) {
    parts.push(<div key={`html-end`} dangerouslySetInnerHTML={{ __html: html.substring(lastIndex) }} />);
  }

  return parts;
}

export default function BlockCanvas({
  blocks, selectedBlockId, headerHtml, footerHtml,
  onSelectBlock, onMoveBlock, onDeleteBlock,
  onGenerateImage, generatingImageBlockId,
  generatedHtml, imagePlaceholders,
  onGeneratePlaceholderImage, generatingPlaceholderId,
}: Props) {
  const isFullLetterMode = !!generatedHtml;

  return (
    <div className="mx-auto" style={{ maxWidth: 600 }}>
      {/* Header */}
      {headerHtml && (
        <div
          className="border-b border-dashed border-muted-foreground/30 pb-2 mb-2 opacity-60 pointer-events-none"
          dangerouslySetInnerHTML={{ __html: headerHtml }}
        />
      )}

      {/* Full letter mode */}
      {isFullLetterMode ? (
        <div className="p-4">
          {imagePlaceholders && imagePlaceholders.length > 0 ? (
            renderHtmlWithPlaceholders(
              generatedHtml!,
              imagePlaceholders,
              onGeneratePlaceholderImage,
              generatingPlaceholderId,
            )
          ) : (
            <div dangerouslySetInnerHTML={{ __html: generatedHtml! }} />
          )}
        </div>
      ) : (
        <>
          {/* Block mode */}
          {blocks.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              Добавьте блоки из библиотеки слева или сгенерируйте письмо целиком
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((block, idx) => {
                const isTextImage = isGeneratedBlock(block.block_type) && (block.config.mode === "header_image" || block.config.mode === "schema_image");
                const needsImagePlaceholder = isTextImage && !block.banner_image_url && block.generated_html;
                const isGeneratingImage = generatingImageBlockId === block.id;
                const locked = isTemplateLocked(block.block_type);

                return (
                  <div
                    key={block.id}
                    className={`group relative border rounded-lg transition-colors ${
                      locked
                        ? "border-muted-foreground/20 cursor-default"
                        : `cursor-pointer ${
                            selectedBlockId === block.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/40"
                          }`
                    }`}
                    onClick={() => !locked && onSelectBlock(block.id)}
                  >
                    {/* Hover controls */}
                    <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-background border rounded-md shadow-sm px-1 py-0.5 z-10">
                      {!locked && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}>
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, "up"); }}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === blocks.length - 1} onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, "down"); }}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>

                    {/* Block content */}
                    <div className="p-4">
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
                      ) : block.block_type === "divider" ? (
                        <hr style={{ border: "none", borderTop: "1px solid hsl(var(--border))", margin: "24px 0" }} />
                      ) : block.block_type === "text" && block.config.html ? (
                        <div dangerouslySetInnerHTML={{ __html: block.config.html }} />
                      ) : block.block_type === "cta" && block.config.text ? (
                        <div className="text-center py-2">
                          <a
                            href={block.config.url || "#"}
                            style={{
                              display: "inline-block",
                              padding: "12px 32px",
                              backgroundColor: block.config.color || "hsl(var(--primary))",
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
          )}
        </>
      )}

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

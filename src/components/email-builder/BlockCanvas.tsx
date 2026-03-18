import { Settings, ArrowUp, ArrowDown, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blockTypeLabels, isGeneratedBlock, type EmailBlockType } from "./BlockLibrary";

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
}

export default function BlockCanvas({
  blocks, selectedBlockId, headerHtml, footerHtml,
  onSelectBlock, onMoveBlock, onDeleteBlock,
  onGenerateImage, generatingImageBlockId,
}: Props) {
  return (
    <div className="mx-auto" style={{ maxWidth: 600 }}>
      {/* Header */}
      {headerHtml && (
        <div
          className="border-b border-dashed border-muted-foreground/30 pb-2 mb-2 opacity-60 pointer-events-none"
          dangerouslySetInnerHTML={{ __html: headerHtml }}
        />
      )}

      {/* Blocks */}
      {blocks.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          Добавьте блоки из библиотеки слева
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block, idx) => {
            const isTextImage = isGeneratedBlock(block.block_type) && (block.config.mode === "header_image" || block.config.mode === "schema_image");
            const needsImagePlaceholder = isTextImage && !block.banner_image_url && block.generated_html;
            const isGeneratingImage = generatingImageBlockId === block.id;

            return (
              <div
                key={block.id}
                className={`group relative border rounded-lg transition-colors cursor-pointer ${
                  selectedBlockId === block.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => onSelectBlock(block.id)}
              >
                {/* Hover controls */}
                <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-background border rounded-md shadow-sm px-1 py-0.5 z-10">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}>
                    <Settings className="h-3 w-3" />
                  </Button>
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
                  {/* Image placeholder ABOVE text for text_image mode */}
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

                  {/* Banner image (when generated) - shown above text */}
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
                      <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                        {blockTypeLabels[block.block_type]}
                      </span>
                      {isGeneratedBlock(block.block_type) && (
                        <span className="text-xs">— настройте и сгенерируйте в правой панели</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

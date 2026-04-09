import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Eye, EyeOff, Copy, Trash2, GripVertical } from "lucide-react";
import type { LandingBlock } from "@/pages/LandingEditor";

interface Props {
  blocks: LandingBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onMoveBlock: (id: string, direction: "up" | "down") => void;
  onToggleVisibility: (id: string) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
}

/** Extract a short text summary from content_overrides for display on the canvas card */
function getBlockSummary(block: LandingBlock): string[] {
  const overrides = block.content_overrides || {};
  const lines: string[] = [];
  for (const [key, val] of Object.entries(overrides)) {
    if (key === "_all_images" || key === "_image_overrides" || key === "_video_overrides") continue;
    if (typeof val === "string" && val.length > 0) {
      const preview = val.length > 80 ? val.slice(0, 80) + "..." : val;
      lines.push(preview);
    }
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      // Repeater — show count and first item preview
      const firstItem = val[0];
      const firstText = Object.values(firstItem).find(
        (v) => typeof v === "string" && v.length > 0 && !String(v).startsWith("img/")
      ) as string | undefined;
      const itemPreview = firstText
        ? (firstText.length > 50 ? firstText.slice(0, 50) + "..." : firstText)
        : "";
      lines.push(`${val.length} элемент(ов)${itemPreview ? ": " + itemPreview : ""}`);
    }
    if (lines.length >= 3) break;
  }
  return lines;
}

export default function LandingBlockCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onToggleVisibility,
  onRemoveBlock,
  onDuplicateBlock,
}: Props) {
  if (!blocks.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Нет блоков</p>
          <p className="text-sm">Добавьте блоки из библиотеки слева</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {blocks.map((block, idx) => {
          const isSelected = block.id === selectedBlockId;
          const def = block.block_definition;
          return (
            <div
              key={block.id}
              className={`
                relative border rounded-lg transition-all cursor-pointer
                ${isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}
                ${!block.is_visible ? "opacity-50" : ""}
              `}
              onClick={() => onSelectBlock(block.id)}
            >
              {/* Block header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-t-lg border-b">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm font-medium">{def?.name || "Блок"}</span>
                  <Badge variant="outline" className="text-xs">
                    {def?.category}
                  </Badge>
                  {!block.is_visible && (
                    <Badge variant="secondary" className="text-xs">Скрыт</Badge>
                  )}
                </div>
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === 0}
                    onClick={() => onMoveBlock(block.id, "up")}
                    title="Вверх"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === blocks.length - 1}
                    onClick={() => onMoveBlock(block.id, "down")}
                    title="Вниз"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onToggleVisibility(block.id)}
                    title={block.is_visible ? "Скрыть" : "Показать"}
                  >
                    {block.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDuplicateBlock(block.id)}
                    title="Дублировать"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Удалить блок?")) onRemoveBlock(block.id);
                    }}
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Block content summary */}
              <div className="px-3 py-2 min-h-[40px]">
                <p className="text-xs font-mono text-muted-foreground">{def?.block_type}</p>
                {(() => {
                  const summary = getBlockSummary(block);
                  const fieldCount = Object.keys(block.content_overrides || {}).filter(k => !k.startsWith("_")).length;
                  return (
                    <>
                      {summary.length > 0 ? (
                        <div className="mt-1 space-y-0.5">
                          {summary.map((line, i) => (
                            <p key={i} className="text-xs text-foreground/70 truncate">{line}</p>
                          ))}
                        </div>
                      ) : def?.description ? (
                        <p className="mt-1 text-xs italic text-muted-foreground">{def.description}</p>
                      ) : null}
                      {fieldCount > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {fieldCount} поле(й) настроено
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

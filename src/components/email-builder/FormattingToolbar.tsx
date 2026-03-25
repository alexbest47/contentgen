import { useState } from "react";
import { Bold, Italic, Underline, AArrowUp, AArrowDown, Highlighter, Link } from "lucide-react";

const HIGHLIGHT_COLORS = [
  // Жёлтые / оранжевые
  "#FFFF00", "#FFEE58", "#FFD700", "#FFAB40", "#FFA500", "#FF8A65",
  // Красные / розовые
  "#FF6347", "#EF5350", "#FF69B4", "#F06292", "#E91E63", "#AD1457",
  // Фиолетовые / синие
  "#DA70D6", "#BA55D3", "#7B68EE", "#7C4DFF", "#536DFE", "#448AFF",
  // Голубые / зелёные
  "#00BFFF", "#00CED1", "#26C6DA", "#00FA9A", "#69F0AE", "#98FB98",
];

export default function FormattingToolbar() {
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
  };

  const changeFontSize = (direction: "up" | "down") => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const current = document.queryCommandValue("fontSize");
    const currentLevel = current ? parseInt(current, 10) : 3;
    const next = direction === "up"
      ? Math.min(currentLevel + 1, 7)
      : Math.max(currentLevel - 1, 1);
    exec("fontSize", String(next));
  };

  const [showColors, setShowColors] = useState(false);

  const prevent = (e: React.MouseEvent) => e.preventDefault();

  const insertLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const url = window.prompt("Введите URL ссылки:", "https://");
    if (!url) return;
    if (sel.toString().length === 0) {
      // No selection — insert link with URL as text
      const a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      a.style.color = "#1a73e8";
      a.style.textDecoration = "underline";
      const range = sel.getRangeAt(0);
      range.insertNode(a);
      range.selectNodeContents(a);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      exec("createLink", url);
    }
  };

  return (
    <div className="border border-border rounded-md bg-background p-2 mt-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Форматирование</p>
      <div className="flex flex-wrap gap-0.5">
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Жирный"
          onMouseDown={prevent}
          onClick={() => exec("bold")}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Курсив"
          onMouseDown={prevent}
          onClick={() => exec("italic")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Подчёркивание"
          onMouseDown={prevent}
          onClick={() => exec("underline")}
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Увеличить шрифт"
          onMouseDown={prevent}
          onClick={() => changeFontSize("up")}
        >
          <AArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Уменьшить шрифт"
          onMouseDown={prevent}
          onClick={() => changeFontSize("down")}
        >
          <AArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Вставить ссылку"
          onMouseDown={prevent}
          onClick={insertLink}
        >
          <Link className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Выделить цветом"
            onMouseDown={prevent}
            onClick={() => setShowColors(!showColors)}
          >
            <Highlighter className="h-4 w-4" />
          </button>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 grid grid-cols-4 gap-1 bg-background border border-border rounded-md p-1.5 shadow-lg z-30 w-[120px]">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onMouseDown={prevent}
                  onClick={() => {
                    exec("hiliteColor", color);
                    setShowColors(false);
                  }}
                />
              ))}
              <button
                type="button"
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform flex items-center justify-center text-xs text-muted-foreground col-span-4"
                title="Убрать выделение"
                onMouseDown={prevent}
                onClick={() => {
                  exec("hiliteColor", "transparent");
                  setShowColors(false);
                }}
              >
                ✕ Убрать
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

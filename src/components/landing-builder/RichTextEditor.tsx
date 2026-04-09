import { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Palette,
  Highlighter,
  RemoveFormatting,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** single-line mode (no line breaks) */
  singleLine?: boolean;
}

// Sanitize pasted HTML: keep only allowed tags
function sanitizeHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(walk).join("");
    if (tag === "b" || tag === "strong") return `<b>${children}</b>`;
    if (tag === "i" || tag === "em") return `<i>${children}</i>`;
    if (tag === "u") return `<u>${children}</u>`;
    if (tag === "br") return `<br/>`;
    if (tag === "span") {
      const style = el.getAttribute("style");
      if (style) return `<span style="${style}">${children}</span>`;
      const cls = el.getAttribute("class");
      if (cls) return `<span class="${cls}">${children}</span>`;
      return children;
    }
    if (["div", "p", "h1", "h2", "h3", "h4", "li"].includes(tag)) {
      return `${children}<br/>`;
    }
    return children;
  };
  return walk(div).replace(/(<br\/>)+$/, "").replace(/(<br\/>){3,}/g, "<br/><br/>");
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 64, 72];

const PRESET_COLORS = [
  "#000000", "#374151", "#6b7280", "#9ca3af", "#d1d5db",
  "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#7c3aed", "#14b8a6",
];

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  singleLine,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value → editor (only when truly external)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    const html = editorRef.current.innerHTML;
    const cleaned = html
      .replace(/&nbsp;/g, " ")
      .replace(/<div><br><\/div>/g, "<br/>")
      .replace(/<div>/g, "<br/>")
      .replace(/<\/div>/g, "");
    onChange(cleaned);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const clean = html ? sanitizeHtml(html) : text;
    document.execCommand("insertHTML", false, clean);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (singleLine && e.key === "Enter") {
      e.preventDefault();
    }
  }, [singleLine]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  }, [emitChange]);

  const applyFontSize = useCallback((size: number) => {
    // execCommand fontSize uses 1-7 scale, useless for exact px
    // Instead, use formatBlock trick or direct span insertion
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    // Use execCommand to wrap, then fix the font size
    document.execCommand("fontSize", false, "7");
    // Find all font[size="7"] in editor and replace with span[style]
    const fonts = editorRef.current?.querySelectorAll('font[size="7"]');
    fonts?.forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.innerHTML = font.innerHTML;
      font.parentNode?.replaceChild(span, font);
    });
    emitChange();
  }, [emitChange]);

  const clearFormatting = useCallback(() => {
    exec("removeFormat");
  }, [exec]);

  const minHeight = singleLine ? 32 : rows * 24;

  return (
    <div className="space-y-0">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1 border border-b-0 rounded-t-md bg-muted/50 flex-wrap">
        <ToolbarBtn
          icon={<Bold className="h-3 w-3" />}
          title="Жирный (Ctrl+B)"
          onClick={() => exec("bold")}
        />
        <ToolbarBtn
          icon={<Italic className="h-3 w-3" />}
          title="Курсив (Ctrl+I)"
          onClick={() => exec("italic")}
        />
        <ToolbarBtn
          icon={<Underline className="h-3 w-3" />}
          title="Подчёркивание (Ctrl+U)"
          onClick={() => exec("underline")}
        />

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Font size dropdown */}
        <FontSizeDropdown onSelect={applyFontSize} />

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Text color */}
        <ColorPickerPopover
          icon={<Palette className="h-3 w-3" />}
          title="Цвет текста"
          onSelect={(c) => exec("foreColor", c)}
        />

        {/* Highlight */}
        <ColorPickerPopover
          icon={<Highlighter className="h-3 w-3" />}
          title="Выделение цветом"
          onSelect={(c) => exec("hiliteColor", c)}
        />

        <div className="w-px h-4 bg-border mx-0.5" />

        <ToolbarBtn
          icon={<RemoveFormatting className="h-3 w-3" />}
          title="Убрать форматирование"
          onClick={clearFormatting}
        />
      </div>

      {/* Editable area */}
      <div
        id={id}
        ref={editorRef}
        contentEditable
        className={cn(
          "border rounded-b-md p-2 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 overflow-y-auto bg-background",
          !value && "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
          className,
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={emitChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        tabIndex={0}
      />
    </div>
  );
}

// ─── Toolbar Button ─────────────────────────────────────

function ToolbarBtn({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="p-1 rounded hover:bg-accent transition-colors"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {icon}
    </button>
  );
}

// ─── Font Size Dropdown (Popover-based) ──────────────────

function FontSizeDropdown({ onSelect }: { onSelect: (size: number) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-accent transition-colors text-xs"
          title="Размер шрифта"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="font-medium">Аа</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-32 p-1 max-h-64 overflow-y-auto"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className="w-full text-left px-2 py-1 rounded hover:bg-accent transition-colors flex items-center justify-between"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(size);
              setOpen(false);
            }}
          >
            <span style={{ fontSize: Math.min(size, 24) }}>{size}</span>
            <span className="text-xs text-muted-foreground ml-2">{size}px</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─── Color Picker (Popover-based) ────────────────────────

function ColorPickerPopover({
  icon,
  title,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  onSelect: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent transition-colors"
          title={title}
          onMouseDown={(e) => e.preventDefault()}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ background: c }}
              title={c}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(c);
                setOpen(false);
              }}
            />
          ))}
        </div>
        <div className="border-t pt-2 mt-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            Другой:
            <input
              type="color"
              className="w-8 h-6 rounded cursor-pointer border-0"
              onChange={(e) => {
                onSelect(e.target.value);
                setOpen(false);
              }}
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}

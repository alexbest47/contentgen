import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Slide {
  slide_number: number;
  type: string;
  headline: string;
  subheadline?: string;
  body?: string;
  visual_note?: string;
  cta_text?: string;
}

const typeLabels: Record<string, string> = {
  cover: "Обложка",
  content: "Контент",
  cta: "CTA",
};

const typeBadgeClass: Record<string, string> = {
  cover: "bg-primary/15 text-primary border-primary/25",
  content: "bg-secondary text-secondary-foreground",
  cta: "bg-accent text-accent-foreground",
};

export default function SlideStructureView({ content }: { content: string }) {
  let slides: Slide[];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error();
    slides = parsed;
  } catch {
    return (
      <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
        {content}
      </div>
    );
  }

  const copy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Скопировано в буфер обмена");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Структура слайдов</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2">
        {slides.map((s) => (
          <div key={s.slide_number} className="border rounded-md p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeBadgeClass[s.type] || ""}`}>
                {s.slide_number}. {typeLabels[s.type] || s.type}
              </Badge>
            </div>
            <p className="text-xs font-medium">{s.headline}</p>
            {(s.subheadline || s.body) && (
              <p className="text-xs text-muted-foreground">{s.subheadline || s.body}</p>
            )}
            {s.visual_note && (
              <p className="text-[11px] italic text-muted-foreground/70">🎨 {s.visual_note}</p>
            )}
            {s.cta_text && (
              <p className="text-xs font-medium text-primary">→ {s.cta_text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

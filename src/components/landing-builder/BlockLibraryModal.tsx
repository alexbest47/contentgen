import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";
import { useInlinedCSS } from "@/hooks/useLandingPreviewHtml";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectBlock: (blockDefinitionId: string) => void;
}

const BASE_PATH = "/talentsy-template/";
const ASSET_BASE_URL = (import.meta.env.VITE_LANDING_ASSET_BASE_URL as string | undefined)?.trim()
  || `${window.location.origin}${BASE_PATH}`;

/** Build a full HTML document for a single block thumbnail preview */
function buildThumbnailHtml(html: string, inlinedCSS: string): string {
  const baseUrl = ASSET_BASE_URL.endsWith("/") ? ASSET_BASE_URL : `${ASSET_BASE_URL}/`;
  // Absolutify paths
  const absHtml = html
    .replace(/(src|srcset|href)=["'](?!https?:\/\/|\/\/|#|data:|mailto:|tel:)([^"']+)["']/g, (_m, attr, path) => {
      return `${attr}="${baseUrl}${path}"`;
    })
    .replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(.*?)['"]?\s*\)/g, (_m, path) => {
      return `url(${baseUrl}${path})`;
    });

  return `<!doctype html>
<html lang="ru-RU" class="nomarginwp">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1200" />
${inlinedCSS}
<style>
  body { margin: 0; padding: 0; overflow: hidden; pointer-events: none; }
  img:is([sizes=auto i],[sizes^="auto," i]){contain-intrinsic-size:3000px 1500px}
  /* Hide videos/iframes in thumbnails */
  video, iframe { display: none !important; }
  /* Fix: Talentsy buttons are rounded on the live site */
  a.button, button.button, .button.button-purple, .button {
    border-radius: 16px !important;
  }
</style>
</head>
<body class="wp-singular page-template wp-theme-talentsy program-light program-gray program-for action-start program-page">
<div class="wrapper">
<main class="page page_hg8ap7v1d">
${absHtml}
</main>
</div>
</body>
</html>`;
}

/** Tiny iframe thumbnail of a block */
function BlockThumbnail({ html, inlinedCSS }: { html: string; inlinedCSS: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(120);

  const srcDoc = useMemo(
    () => buildThumbnailHtml(html, inlinedCSS),
    [html, inlinedCSS],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          // Get the actual content height, cap at reasonable value for thumbnail
          const h = doc.body.scrollHeight;
          // Scale: iframe renders at 1200px width, displayed at ~280px = scale ~0.233
          // So thumbnail height = h * 0.233, capped
          const scaledH = Math.min(Math.max(h * 0.233, 60), 200);
          setIframeHeight(scaledH);
        }
      } catch {
        // Cross-origin, ignore
      }
    };
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [srcDoc]);

  return (
    <div
      className="relative overflow-hidden rounded border border-border/50 bg-gray-50 shrink-0"
      style={{ width: 280, height: iframeHeight }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title="preview"
        sandbox="allow-same-origin"
        style={{
          width: 1200,
          height: iframeHeight / 0.233,
          transform: "scale(0.233)",
          transformOrigin: "top left",
          border: "none",
          pointerEvents: "none",
        }}
        tabIndex={-1}
      />
    </div>
  );
}

export default function BlockLibraryModal({ open, onClose, onSelectBlock }: Props) {
  const inlinedCSS = useInlinedCSS();

  const { data: definitions, isLoading } = useQuery({
    queryKey: ["landing_block_definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_block_definitions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  // Group by category
  const grouped = (definitions || []).reduce<Record<string, any[]>>((acc, def) => {
    const cat = def.category || "Прочее";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(def);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  const handleSelect = (defId: string) => {
    onSelectBlock(defId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Добавить блок</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
          {isLoading || !inlinedCSS ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {grouped[category].map((def: any) => (
                      <button
                        key={def.id}
                        className="flex gap-4 w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 text-left transition-colors cursor-pointer"
                        onClick={() => handleSelect(def.id)}
                      >
                        {/* Mini-preview */}
                        {def.html_template && (
                          <BlockThumbnail
                            html={def.html_template}
                            inlinedCSS={inlinedCSS}
                          />
                        )}
                        {/* Text info */}
                        <div className="flex flex-col gap-1 min-w-0 py-1">
                          <span className="font-semibold text-sm leading-tight">
                            {def.name}
                          </span>
                          {def.description && (
                            <span className="text-xs text-muted-foreground leading-relaxed">
                              {def.description}
                            </span>
                          )}
                          <Badge variant="outline" className="w-fit text-[10px] mt-auto">
                            {def.block_type}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { useRef, useEffect, useCallback } from "react";
import { buildPreviewHtml, useInlinedCSS, useBlockDefsMap } from "@/hooks/useLandingPreviewHtml";
import { Loader2 } from "lucide-react";
import type { LandingBlock } from "@/pages/LandingEditor";

interface Props {
  blocks: LandingBlock[];
  landingName: string;
  onSelectBlock: (blockId: string) => void;
  onFocusField: (blockId: string, field: string, index?: number, subfield?: string) => void;
}

export default function LandingInlinePreview({
  blocks,
  landingName,
  onSelectBlock,
  onFocusField,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inlinedCSS = useInlinedCSS();
  const blockDefsMap = useBlockDefsMap();

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "editable-click") {
        const { blockId, field, index, subfield } = e.data;
        if (blockId && field) {
          onSelectBlock(blockId);
          // Small delay to let the panel render before focusing
          setTimeout(() => {
            onFocusField(
              blockId,
              field,
              index != null ? parseInt(index, 10) : undefined,
              subfield || undefined,
            );
          }, 50);
        }
      } else if (e.data.type === "block-click") {
        if (e.data.blockId) {
          onSelectBlock(e.data.blockId);
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelectBlock, onFocusField]);

  // Rebuild iframe HTML when blocks change
  useEffect(() => {
    if (!iframeRef.current || inlinedCSS === null) return;

    const { fullHtml } = buildPreviewHtml(
      blocks,
      inlinedCSS,
      landingName,
      blockDefsMap || undefined,
      true, // markEditable
    );

    iframeRef.current.srcdoc = fullHtml;
  }, [blocks, inlinedCSS, landingName, blockDefsMap]);

  if (inlinedCSS === null) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Landing Editor Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

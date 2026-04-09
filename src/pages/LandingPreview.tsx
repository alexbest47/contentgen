import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { exportLandingAsZip } from "@/utils/exportLandingZip";
import { toast } from "sonner";
import { buildPreviewHtml, useInlinedCSS, useBlockDefsMap } from "@/hooks/useLandingPreviewHtml";

// Legacy utility functions kept for backwards compatibility with exportLandingAsZip
// Main rendering logic is now in useLandingPreviewHtml hook

const CSS_FILES = [
  "css/fix.css",
  "css/fix-filippov.css",
  "css/landing.min.css",
  "css/style-hg8ap7v1d.css",
  "css/main.css",
];

const BASE_PATH = "/talentsy-template/";

/** Fetch all template CSS files and return inlined <style> blocks */
async function fetchInlinedCSS(): Promise<string> {
  const baseUrl = window.location.origin + BASE_PATH;
  const results = await Promise.all(
    CSS_FILES.map(async (file) => {
      try {
        const resp = await fetch(baseUrl + file);
        if (!resp.ok) return `/* Failed to load ${file}: ${resp.status} */`;
        let css = await resp.text();
        // Fix relative url() references inside CSS (e.g. url(../img/...)) → absolute
        css = css.replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(\.\.\/|)(.*?)['"]?\s*\)/g, (_match, _dots, path) => {
          // Resolve relative to CSS file location (css/ folder)
          const resolved = _dots ? path : "css/" + path;
          return `url(${baseUrl}${resolved})`;
        });
        return css;
      } catch {
        return `/* Error loading ${file} */`;
      }
    })
  );
  return results.map((css) => `<style>${css}</style>`).join("\n");
}

/** Replace relative src/srcset/href paths in block HTML with absolute ones */
function absolutifyPaths(html: string, baseUrl: string): string {
  // src="img/..." → src="<baseUrl>img/..."
  return html
    .replace(/(src|srcset|href)=["'](?!https?:\/\/|\/\/|#|data:|mailto:|tel:)([^"']+)["']/g, (_m, attr, path) => {
      return `${attr}="${baseUrl}${path}"`;
    })
    .replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(.*?)['"]?\s*\)/g, (_m, path) => {
      return `url(${baseUrl}${path})`;
    });
}

/**
 * Apply content_overrides to block HTML by replacing default_content values
 * with the user-overridden values directly in the HTML string.
 * This approach works even when text is split across multiple DOM nodes
 * (e.g. by <br>, <span>, <b> tags).
 */
function applyContentOverrides(
  html: string,
  overrides: Record<string, any>,
  defaults: Record<string, any>,
  editableFields: any[]
): string {
  if (!overrides || !defaults || !editableFields?.length) return html;

  // Collect all replacements { old, new, type }
  const replacements: { old: string; new: string; type: "text" | "image" | "url" }[] = [];

  // Helper: detect if a field represents a URL (by name or value pattern)
  const isUrlField = (fieldName: string, value?: string): boolean => {
    if (/url$/i.test(fieldName) || /^url/i.test(fieldName) || /href/i.test(fieldName)) return true;
    if (typeof value === "string" && /^(#|https?:\/\/|\/\/)/.test(value)) return true;
    return false;
  };

  for (const field of editableFields) {
    const key = field.field;
    const overrideVal = getNestedValue(overrides, key);
    const defaultVal = getNestedValue(defaults, key);

    if (overrideVal === undefined || overrideVal === null) continue;

    if (field.type === "repeater" && Array.isArray(overrideVal) && Array.isArray(defaultVal)) {
      const subFields: any[] = field.fields || [];
      const len = Math.min(overrideVal.length, defaultVal.length);
      for (let i = 0; i < len; i++) {
        const overrideItem = overrideVal[i] || {};
        const defaultItem = defaultVal[i] || {};
        for (const sf of subFields) {
          const ov = overrideItem[sf.field];
          const dv = defaultItem[sf.field];
          if (typeof ov === "string" && typeof dv === "string" && ov !== dv && dv) {
            const fieldType = sf.type === "image" ? "image" as const
              : isUrlField(sf.field, dv) ? "url" as const
              : "text" as const;
            replacements.push({ old: dv, new: ov, type: fieldType });
          }
        }
      }
    } else if (typeof overrideVal === "string" && typeof defaultVal === "string") {
      if (overrideVal === defaultVal) continue;
      if (!defaultVal) continue;
      const fieldType = field.type === "image" ? "image" as const
        : isUrlField(key, defaultVal) ? "url" as const
        : "text" as const;
      replacements.push({ old: defaultVal, new: overrideVal, type: fieldType });
    }
  }

  // Apply replacements — longest first to avoid partial matches
  replacements.sort((a, b) => b.old.length - a.old.length);

  for (const r of replacements) {
    if (r.type === "image") {
      html = replaceImageInHtml(html, r.old, r.new);
    } else if (r.type === "url") {
      // URL fields: replace in href/src/action attributes (not just text nodes)
      html = replaceUrlInHtml(html, r.old, r.new);
    } else {
      html = replaceTextInHtml(html, r.old.trim(), r.new.trim());
    }
  }

  // Hide extra repeater items that were deleted by the user
  // When override array has fewer items than default, hide the surplus HTML elements
  for (const field of editableFields) {
    if (field.type !== "repeater") continue;
    const overrideArr = getNestedValue(overrides, field.field);
    const defaultArr = getNestedValue(defaults, field.field);
    if (!Array.isArray(overrideArr) || !Array.isArray(defaultArr)) continue;
    if (overrideArr.length >= defaultArr.length) continue;

    const subFields: any[] = field.fields || [];
    // For each extra default item, find its text in HTML and hide the container
    for (let i = overrideArr.length; i < defaultArr.length; i++) {
      const item = defaultArr[i];
      // Get the longest text value as a marker to identify this item in HTML
      let markerText = "";
      for (const sf of subFields) {
        const val = item[sf.field];
        if (typeof val === "string" && val.length > markerText.length) {
          markerText = val;
        }
      }
      if (!markerText) continue;
      html = hideElementContaining(html, markerText);
    }
  }

  // Apply universal image overrides (_image_overrides map)
  // Also replace alternative format variants (jpg↔webp↔png) so <picture> <source> tags get updated too
  const imageOverrides: Record<string, string> = overrides._image_overrides || {};
  const IMG_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];
  for (const [oldPath, newUrl] of Object.entries(imageOverrides)) {
    if (typeof newUrl === "string" && newUrl) {
      html = html.split(oldPath).join(newUrl);
      // Also replace sibling format variants (e.g. if overriding .jpg, also replace .webp version)
      const extMatch = oldPath.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i);
      if (extMatch) {
        const basePath = oldPath.slice(0, -extMatch[0].length);
        for (const ext of IMG_EXTS) {
          const variant = basePath + ext;
          if (variant !== oldPath && html.includes(variant)) {
            html = html.split(variant).join(newUrl);
          }
        }
      }
    }
  }

  // Apply video/iframe URL overrides
  const videoOverrides: Record<string, string> = overrides._video_overrides || {};
  for (const [oldUrl, newUrl] of Object.entries(videoOverrides)) {
    if (typeof newUrl === "string" && newUrl) {
      html = html.split(oldUrl).join(newUrl);
    }
  }

  return html;
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const parts = path.split(".");
  let val: any = obj;
  for (const part of parts) {
    if (val == null) return undefined;
    val = val[part];
  }
  return val;
}

/**
 * Replace text content in raw HTML string.
 * Builds a regex that allows HTML tags between characters of the search text,
 * so "hello world" matches "hello<br> world" or "hello</span> world".
 * Also handles text split at hyphens, e.g. "психолог-<br/>консультант".
 */
function replaceTextInHtml(html: string, oldText: string, newText: string): string {
  if (!oldText) return html;

  // SAFE replacement: only replace text OUTSIDE of HTML tags (i.e. in text nodes).
  // Split HTML into text segments and tag segments. Even indices = text, odd = tags.
  // This prevents replacing inside class names, src attributes, URLs, etc.
  const safeReplace = (h: string, search: string, replace: string): string => {
    const parts = h.split(/(<[^>]*>)/);
    let replaced = false;
    for (let i = 0; i < parts.length; i++) {
      // Even indices are text content, odd indices are HTML tags
      if (i % 2 === 0 && parts[i].includes(search)) {
        parts[i] = parts[i].split(search).join(replace);
        replaced = true;
      }
    }
    return replaced ? parts.join("") : h;
  };

  // First try safe direct replacement in text nodes
  if (html.includes(oldText)) {
    const result = safeReplace(html, oldText, newText);
    if (result !== html) return result;
  }

  // Also try matching with &nbsp; decoded to space in text nodes
  const htmlDecoded = html.replace(/&nbsp;/g, " ");
  if (htmlDecoded.includes(oldText)) {
    // Replace &nbsp; with space in text nodes only, then do the replacement
    const parts = html.split(/(<[^>]*>)/);
    let replaced = false;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        const decoded = parts[i].replace(/&nbsp;/g, " ");
        if (decoded.includes(oldText)) {
          parts[i] = decoded.split(oldText).join(newText);
          replaced = true;
        }
      }
    }
    if (replaced) return parts.join("");
  }

  // If not found in text nodes directly, try matching with HTML tags between words.
  // Split into atomic tokens: split on whitespace, then further split each word
  // on hyphens (keeping hyphen attached to left part) so that
  // "психолог-консультант" → ["психолог-", "консультант"]
  const tokens = oldText
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      const parts = word.split(/(?<=-)/).filter(Boolean);
      return parts.length > 1 ? parts : [word];
    });

  if (tokens.length <= 1) return html; // Single token not found directly — nothing to do

  // Build pattern: token1 (optional tags/whitespace/HTML entities) token2 ...
  // Include &nbsp; and other HTML entities as allowed separators
  const TAG_OR_SPACE = "(?:\\s|<[^>]*>|&[a-zA-Z]+;|&#\\d+;)*";
  const pattern = tokens.map((t) => escapeRegExp(t)).join(TAG_OR_SPACE);

  try {
    const regex = new RegExp(pattern, "s"); // 's' flag: dot matches newlines
    const match = html.match(regex);
    if (match) {
      return html.replace(regex, newText);
    }
  } catch {
    // Regex too complex or invalid — skip
  }

  return html;
}

/** Replace URL values in href/src/action attributes */
function replaceUrlInHtml(html: string, oldUrl: string, newUrl: string): string {
  if (!oldUrl) return html;
  // Replace in attribute values only (href="...", src="...", action="...")
  // Use regex to find the old URL inside attribute values
  const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attrRegex = new RegExp(
    `((?:href|src|action)\\s*=\\s*["'])${escaped}(["'])`,
    "gi"
  );
  const result = html.replace(attrRegex, `$1${newUrl}$2`);
  if (result !== html) return result;
  // Fallback: simple global replacement for exact URL matches
  return html.split(oldUrl).join(newUrl);
}

/** Replace image src/srcset paths in raw HTML */
function replaceImageInHtml(html: string, oldSrc: string, newSrc: string): string {
  if (!oldSrc) return html;
  // Replace in src="..." and srcset="..."
  return html.split(oldSrc).join(newSrc);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find an HTML element containing the given marker text and inject display:none.
 * Walks backward from the text position to find the nearest <div> or <li> opening tag.
 */
function hideElementContaining(html: string, markerText: string): string {
  const trimmed = markerText.trim();
  let textPos = html.indexOf(trimmed);
  if (textPos === -1) return html;

  // Find all <div ...> and <li ...> opening tags before the marker text
  const before = html.slice(0, textPos);
  const openTags: { index: number; tag: string; tagName: string }[] = [];
  const openRe = /<(div|li)\b[^>]*>/gi;
  let m;
  while ((m = openRe.exec(before)) !== null) {
    openTags.push({ index: m.index, tag: m[0], tagName: m[1].toLowerCase() });
  }

  // Try from the nearest tag backward — find one whose close tag is AFTER the marker
  for (let t = openTags.length - 1; t >= 0; t--) {
    const { index: tagStart, tag: tagFull, tagName } = openTags[t];
    const closeTag = `</${tagName}>`;

    // Count nesting to find the matching close tag
    let depth = 1;
    let cursor = tagStart + tagFull.length;
    const innerOpenRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi");

    while (depth > 0 && cursor < html.length) {
      const nextClose = html.indexOf(closeTag, cursor);
      if (nextClose === -1) break;

      // Count any additional opens between cursor and nextClose
      innerOpenRe.lastIndex = cursor;
      while ((m = innerOpenRe.exec(html)) !== null && m.index < nextClose) {
        depth++;
      }

      depth--; // for the close tag we found
      cursor = nextClose + closeTag.length;
    }

    // cursor is now right after the matching close tag
    if (depth === 0 && cursor > textPos) {
      // This element contains our marker text — inject display:none
      let modified: string;
      if (tagFull.includes('style="')) {
        modified = tagFull.replace(/style="/, 'style="display:none !important; ');
      } else {
        modified = tagFull.replace(/>$/, ' style="display:none !important">');
      }
      return html.slice(0, tagStart) + modified + html.slice(tagStart + tagFull.length);
    }
  }

  return html;
}

export default function LandingPreview() {
  const { landingId } = useParams<{ landingId: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [exporting, setExporting] = useState(false);
  const rawBlockHtmlsRef = useRef<string[]>([]);

  const inlinedCSS = useInlinedCSS();
  const blockDefsMap = useBlockDefsMap();

  const { data: landing } = useQuery({
    queryKey: ["landing", landingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landings")
        .select("*")
        .eq("id", landingId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!landingId,
  });

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["landing_blocks_preview", landingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_blocks")
        .select("*, landing_block_definitions(id, block_type, name, category, html_template, editable_fields, default_settings, default_content)")
        .eq("landing_id", landingId!)
        .order("sort_order");
      if (error) throw error;
      return (data as any[]).map((b) => ({
        ...b,
        block_definition: b.landing_block_definitions,
      }));
    },
    enabled: !!landingId,
  });

  // Build the full HTML document using shared buildPreviewHtml
  useEffect(() => {
    if (!blocks || inlinedCSS === null || !iframeRef.current) return;

    const { fullHtml, rawBlockHtmls } = buildPreviewHtml(
      blocks,
      inlinedCSS,
      landing?.name || "Предпросмотр лендинга",
      blockDefsMap || undefined,
      false, // no editable markers in standalone preview
    );

    rawBlockHtmlsRef.current = rawBlockHtmls;
    iframeRef.current.srcdoc = fullHtml;
  }, [blocks, inlinedCSS, landing, blockDefsMap]);

  if (isLoading || inlinedCSS === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/landings/${landingId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Предпросмотр: {landing?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={async () => {
              if (rawBlockHtmlsRef.current.length === 0) {
                toast.error("Нет блоков для экспорта");
                return;
              }
              setExporting(true);
              try {
                await exportLandingAsZip(
                  rawBlockHtmlsRef.current,
                  landing?.name || "landing"
                );
                toast.success("ZIP-архив скачан");
              } catch (err: any) {
                toast.error("Ошибка экспорта: " + err.message);
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            Скачать ZIP
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/landings/${landingId}`)}>
            Вернуться в конструктор
          </Button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="flex-1 w-full border-0"
        title="Landing Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

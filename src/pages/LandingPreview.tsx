import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { exportLandingAsZip } from "@/utils/exportLandingZip";
import { toast } from "sonner";

const CSS_FILES = [
  "css/fix.css",
  "css/fix-filippov.css",
  "css/landing.min.css",
  "css/style-hg8ap7v1d.css",
  "css/main.css",
];

const BASE_PATH = "/talentsy-template/";

async function fetchInlinedCSS(): Promise<string> {
  const baseUrl = window.location.origin + BASE_PATH;
  const results = await Promise.all(
    CSS_FILES.map(async (file) => {
      try {
        const resp = await fetch(baseUrl + file);
        if (!resp.ok) return `/* Failed to load ${file}: ${resp.status} */`;
        let css = await resp.text();
        css = css.replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(\.\.\/(|))(.*?)['"]?\s*\)/g, (_match, _dots, _empty, path) => {
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

function absolutifyPaths(html: string, baseUrl: string): string {
  return html
    .replace(/(src|srcset|href)=["'](?!https?:\/\/|\/\/|#|data:|mailto:|tel:)([^"']+)["']/g, (_m, attr, path) => {
      return `${attr}="${baseUrl}${path}"`;
    })
    .replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(.*?)['"]?\s*\)/g, (_m, path) => {
      return `url(${baseUrl}${path})`;
    });
}

function applyContentOverrides(
  html: string,
  overrides: Record<string, any>,
  defaults: Record<string, any>,
  editableFields: any[]
): string {
  if (!overrides || !defaults || !editableFields?.length) return html;

  const replacements: { old: string; new: string; type: "text" | "image" | "url" }[] = [];

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

  replacements.sort((a, b) => b.old.length - a.old.length);

  for (const r of replacements) {
    if (r.type === "image") {
      html = replaceImageInHtml(html, r.old, r.new);
    } else if (r.type === "url") {
      html = replaceUrlInHtml(html, r.old, r.new);
    } else {
      html = replaceTextInHtml(html, r.old.trim(), r.new.trim());
    }
  }

  for (const field of editableFields) {
    if (field.type !== "repeater") continue;
    const overrideArr = getNestedValue(overrides, field.field);
    const defaultArr = getNestedValue(defaults, field.field);
    if (!Array.isArray(overrideArr) || !Array.isArray(defaultArr)) continue;
    if (overrideArr.length >= defaultArr.length) continue;

    const subFields: any[] = field.fields || [];
    for (let i = overrideArr.length; i < defaultArr.length; i++) {
      const item = defaultArr[i];
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

  const imageOverrides: Record<string, string> = overrides._image_overrides || {};
  for (const [oldPath, newUrl] of Object.entries(imageOverrides)) {
    if (typeof newUrl === "string" && newUrl) {
      html = html.split(oldPath).join(newUrl);
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

function replaceTextInHtml(html: string, oldText: string, newText: string): string {
  if (!oldText) return html;

  const safeReplace = (h: string, search: string, replace: string): string => {
    const parts = h.split(/(<[^>]*>)/);
    let replaced = false;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0 && parts[i].includes(search)) {
        parts[i] = parts[i].split(search).join(replace);
        replaced = true;
      }
    }
    return replaced ? parts.join("") : h;
  };

  if (html.includes(oldText)) {
    const result = safeReplace(html, oldText, newText);
    if (result !== html) return result;
  }

  const htmlDecoded = html.replace(/&nbsp;/g, " ");
  if (htmlDecoded.includes(oldText)) {
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

  const tokens = oldText
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      const parts = word.split(/(?<=-)/).filter(Boolean);
      return parts.length > 1 ? parts : [word];
    });

  if (tokens.length <= 1) return html;

  const TAG_OR_SPACE = "(?:\\s|<[^>]*>|&[a-zA-Z]+;|&#\\d+;)*";
  const pattern = tokens.map((t) => escapeRegExp(t)).join(TAG_OR_SPACE);

  try {
    const regex = new RegExp(pattern, "s");
    const match = html.match(regex);
    if (match) {
      return html.replace(regex, newText);
    }
  } catch {
    // Regex too complex or invalid
  }

  return html;
}

function replaceUrlInHtml(html: string, oldUrl: string, newUrl: string): string {
  if (!oldUrl) return html;
  const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attrRegex = new RegExp(
    `((?:href|src|action)\\s*=\\s*["'])${escaped}(["'])`,
    "gi"
  );
  const result = html.replace(attrRegex, `$1${newUrl}$2`);
  if (result !== html) return result;
  return html.split(oldUrl).join(newUrl);
}

function replaceImageInHtml(html: string, oldSrc: string, newSrc: string): string {
  if (!oldSrc) return html;
  return html.split(oldSrc).join(newSrc);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hideElementContaining(html: string, markerText: string): string {
  const trimmed = markerText.trim();
  let textPos = html.indexOf(trimmed);
  if (textPos === -1) return html;

  const before = html.slice(0, textPos);
  const openTags: { index: number; tag: string; tagName: string }[] = [];
  const openRe = /<(div|li)\b[^>]*>/gi;
  let m;
  while ((m = openRe.exec(before)) !== null) {
    openTags.push({ index: m.index, tag: m[0], tagName: m[1].toLowerCase() });
  }

  for (let t = openTags.length - 1; t >= 0; t--) {
    const { index: tagStart, tag: tagFull, tagName } = openTags[t];
    const closeTag = `</${tagName}>`;

    let depth = 1;
    let cursor = tagStart + tagFull.length;
    const innerOpenRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi");

    while (depth > 0 && cursor < html.length) {
      const nextClose = html.indexOf(closeTag, cursor);
      if (nextClose === -1) break;

      innerOpenRe.lastIndex = cursor;
      while ((m = innerOpenRe.exec(html)) !== null && m.index < nextClose) {
        depth++;
      }

      depth--;
      cursor = nextClose + closeTag.length;
    }

    if (depth === 0 && cursor > textPos) {
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
  const [inlinedCSS, setInlinedCSS] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const rawBlockHtmlsRef = useRef<string[]>([]);

  useEffect(() => {
    fetchInlinedCSS().then(setInlinedCSS);
  }, []);

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

  const { data: blockDefsMap } = useQuery({
    queryKey: ["block_definitions_defaults"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_block_definitions")
        .select("id, block_type, name, category, html_template, editable_fields, default_settings, default_content");
      if (error) throw error;
      const map: Record<string, any> = {};
      for (const d of data || []) map[d.id] = d;
      return map;
    },
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
      return data as any[];
    },
    enabled: !!landingId,
  });

  useEffect(() => {
    if (!blocks || inlinedCSS === null || !iframeRef.current) return;

    const baseUrl = window.location.origin + BASE_PATH;

    const visibleBlocks = blocks.filter((b: any) => b.is_visible);
    const rawHtmls: string[] = [];
    const blockHtmls = visibleBlocks.map((b: any) => {
      const joinedDef = b.landing_block_definitions;
      const defId = joinedDef?.id || b.block_definition_id;
      const fallbackDef = blockDefsMap?.[defId];
      const def = {
        ...joinedDef,
        default_content: joinedDef?.default_content || fallbackDef?.default_content || {},
        editable_fields: joinedDef?.editable_fields || fallbackDef?.editable_fields || [],
        html_template: joinedDef?.html_template || fallbackDef?.html_template || "",
      };
      let html = def.html_template;

      const overrides = b.content_overrides || {};
      const defaults = def.default_content || {};
      const editableFields = def.editable_fields || [];

      html = applyContentOverrides(html, overrides, defaults, editableFields);

      if (b.custom_css) {
        html = `<style>${b.custom_css}</style>${html}`;
      }

      rawHtmls.push(html);
      html = absolutifyPaths(html, baseUrl);

      const blockName = def.name || joinedDef?.name || def.block_type || "Блок";
      const blockType = def.block_type || joinedDef?.block_type || "";
      return `<div class="__preview-block__" data-block-id="${b.id}">
        <div class="__preview-block-label__">${blockName}<span class="__preview-block-type__">${blockType}</span></div>
        ${html}
      </div>`;
    });
    rawBlockHtmlsRef.current = rawHtmls;

    const fullHtml = `<!doctype html>
<html lang="ru-RU" class="nomarginwp">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${landing?.name || "Предпросмотр лендинга"}</title>
  ${inlinedCSS}
  <style>
    img:is([sizes=auto i],[sizes^="auto," i]){contain-intrinsic-size:3000px 1500px}
    body { margin: 0; padding: 0; }
    .__preview-block__ { position: relative; border-top: 2px dashed #c4b5fd; }
    .__preview-block__:first-child { border-top: none; }
    .__preview-block-label__ {
      position: absolute; top: 0; left: 0; z-index: 9999;
      background: #7c3aed; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px; font-weight: 600; line-height: 1;
      padding: 4px 10px 4px 8px; border-radius: 0 0 6px 0;
      opacity: 0.85; pointer-events: none; white-space: nowrap;
    }
    .__preview-block-type__ { margin-left: 6px; opacity: 0.6; font-weight: 400; font-size: 10px; }
    .__preview-block__:hover { outline: 2px solid #7c3aed40; }
    .__preview-block__:hover .__preview-block-label__ { opacity: 1; }
  </style>
</head>
<body class="wp-singular page-template wp-theme-talentsy program-light program-gray program-for action-start program-page">
<div class="wrapper">
<main class="page page_hg8ap7v1d">
${blockHtmls.join("\n\n")}
</main>
</div>
<script src="${baseUrl}js/jquery-3.6.4.min.js"><\/script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    var scripts = [
      '${baseUrl}js/swiper-bundle.min.js',
      '${baseUrl}js/landing.min.js'
    ];
    scripts.forEach(function(src) {
      var s = document.createElement('script');
      s.src = src;
      document.body.appendChild(s);
    });
  });
<\/script>
</body>
</html>`;

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

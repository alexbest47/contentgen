import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LandingBlock } from "@/pages/LandingEditor";

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
        css = css.replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(\.\.\/|)(.*?)['"]?\s*\)/g, (_match, _dots, path) => {
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
  return html
    .replace(/(src|srcset|href)=["'](?!https?:\/\/|\/\/|#|data:|mailto:|tel:)([^"']+)["']/g, (_m, attr, path) => {
      return `${attr}="${baseUrl}${path}"`;
    })
    .replace(/url\(\s*['"]?(?!data:|https?:|\/\/)(.*?)['"]?\s*\)/g, (_m, path) => {
      return `url(${baseUrl}${path})`;
    });
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace text content in raw HTML string.
 * Returns { html, replaced } — if replaced is true, the text was found and replaced.
 */
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
    // Regex too complex or invalid — skip
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

/**
 * Apply content_overrides to block HTML.
 * When `markEditable` is true, wraps replaced text in <span data-editable-*> for click-to-edit.
 */
export function applyContentOverrides(
  html: string,
  overrides: Record<string, any>,
  defaults: Record<string, any>,
  editableFields: any[],
  blockId?: string,
  markEditable?: boolean,
): string {
  if (!overrides || !defaults || !editableFields?.length) return html;

  const replacements: { old: string; new: string; type: "text" | "image" | "url"; field: string; index?: number; subfield?: string }[] = [];

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
            replacements.push({ old: dv, new: ov, type: fieldType, field: key, index: i, subfield: sf.field });
          }
        }
      }
    } else if (typeof overrideVal === "string" && typeof defaultVal === "string") {
      if (overrideVal === defaultVal) continue;
      if (!defaultVal) continue;
      const fieldType = field.type === "image" ? "image" as const
        : isUrlField(key, defaultVal) ? "url" as const
        : "text" as const;
      replacements.push({ old: defaultVal, new: overrideVal, type: fieldType, field: key });
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

  // Hide extra repeater items
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

  // Apply universal image overrides
  const imageOverrides: Record<string, string> = overrides._image_overrides || {};
  for (const [oldPath, newUrl] of Object.entries(imageOverrides)) {
    if (typeof newUrl === "string" && newUrl) {
      html = html.split(oldPath).join(newUrl);
    }
  }

  // Now add data-editable attributes to text nodes that match current content
  // This enables click-to-edit: click on text in preview → focus on field in panel
  if (markEditable && blockId) {
    html = addEditableMarkers(html, overrides, editableFields, blockId);
  }

  return html;
}

/**
 * Walk through editable fields and wrap their current text values in
 * <span data-editable-block="..." data-editable-field="..." ...> markers.
 * These are invisible to the user but let the iframe click handler identify which field was clicked.
 */
function addEditableMarkers(
  html: string,
  overrides: Record<string, any>,
  editableFields: any[],
  blockId: string,
): string {
  for (const field of editableFields) {
    const key = field.field;
    const val = getNestedValue(overrides, key);

    if (field.type === "repeater" && Array.isArray(val)) {
      const subFields: any[] = field.fields || [];
      for (let i = 0; i < val.length; i++) {
        const item = val[i] || {};
        for (const sf of subFields) {
          if (sf.type === "image" || sf.type === "url") continue;
          const text = item[sf.field];
          if (typeof text !== "string" || text.length < 2) continue;
          html = wrapTextWithMarker(html, text, blockId, key, i, sf.field, sf.label || sf.field);
        }
      }
    } else if (field.type === "text" || field.type === "textarea") {
      if (typeof val !== "string" || val.length < 2) continue;
      html = wrapTextWithMarker(html, val, blockId, key, undefined, undefined, field.label || key);
    }
  }
  return html;
}

/**
 * Find text in HTML text nodes and wrap the PARENT element with data-editable-* attributes.
 * We don't wrap text in <span> — instead we find the nearest element containing this text
 * and add data-attributes to it.
 */
function wrapTextWithMarker(
  html: string,
  text: string,
  blockId: string,
  field: string,
  index?: number,
  subfield?: string,
  label?: string,
): string {
  // Find the text in the HTML (in text nodes only)
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return html;

  // Find position of this text in HTML text nodes
  const parts = html.split(/(<[^>]*>)/);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 !== 0) continue; // skip HTML tags
    if (!parts[i].includes(trimmed) && !parts[i].includes(trimmed.slice(0, 30))) continue;

    // Found text node containing our value. Walk backward to find the nearest opening tag.
    for (let j = i - 1; j >= 0; j--) {
      if (j % 2 !== 1) continue; // look at tag segments only
      const tag = parts[j];
      if (tag.startsWith("</")) continue; // skip closing tags
      if (tag.startsWith("<") && !tag.startsWith("<!") && !tag.startsWith("<br")) {
        // This is an opening tag — add data-editable attributes
        if (tag.includes("data-editable-field")) break; // already marked

        const attrs = ` data-editable-field="${field}"` +
          ` data-editable-block="${blockId}"` +
          (index !== undefined ? ` data-editable-index="${index}"` : "") +
          (subfield ? ` data-editable-subfield="${subfield}"` : "") +
          (label ? ` data-editable-label="${label}"` : "");

        parts[j] = tag.replace(/>$/, `${attrs}>`);
        return parts.join("");
      }
    }
    break; // only process first occurrence
  }

  return html;
}

/**
 * Build the full HTML document for iframe preview.
 * Used by both LandingEditor (live preview) and LandingPreview page.
 */
export function buildPreviewHtml(
  blocks: LandingBlock[],
  inlinedCSS: string,
  landingName: string,
  blockDefsMap?: Record<string, any>,
  markEditable?: boolean,
): { fullHtml: string; rawBlockHtmls: string[] } {
  const baseUrl = window.location.origin + BASE_PATH;
  const visibleBlocks = blocks.filter((b) => b.is_visible);
  const rawHtmls: string[] = [];

  const blockHtmls = visibleBlocks.map((b) => {
    const joinedDef = b.block_definition;
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

    html = applyContentOverrides(html, overrides, defaults, editableFields, b.id, markEditable);

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

  const editableScript = markEditable ? `
  <script>
    // Click-to-edit: when user clicks on an editable element, send postMessage to parent
    document.addEventListener('click', function(e) {
      var el = e.target;
      // Walk up to find element with data-editable-field
      while (el && el !== document.body) {
        if (el.getAttribute && el.getAttribute('data-editable-field')) {
          e.preventDefault();
          e.stopPropagation();
          window.parent.postMessage({
            type: 'editable-click',
            blockId: el.getAttribute('data-editable-block'),
            field: el.getAttribute('data-editable-field'),
            index: el.getAttribute('data-editable-index'),
            subfield: el.getAttribute('data-editable-subfield'),
            label: el.getAttribute('data-editable-label'),
          }, '*');
          return;
        }
        el = el.parentElement;
      }
      // If clicked inside a __preview-block__ but not on an editable element,
      // still select the block
      el = e.target;
      while (el && el !== document.body) {
        if (el.classList && el.classList.contains('__preview-block__')) {
          e.preventDefault();
          e.stopPropagation();
          window.parent.postMessage({
            type: 'block-click',
            blockId: el.getAttribute('data-block-id'),
          }, '*');
          return;
        }
        el = el.parentElement;
      }
    }, true);

    // Hover effects for editable elements
    var currentHover = null;
    document.addEventListener('mouseover', function(e) {
      var el = e.target;
      while (el && el !== document.body) {
        if (el.getAttribute && el.getAttribute('data-editable-field')) {
          if (currentHover && currentHover !== el) {
            currentHover.classList.remove('__editable-hover__');
          }
          el.classList.add('__editable-hover__');
          currentHover = el;
          return;
        }
        el = el.parentElement;
      }
      if (currentHover) {
        currentHover.classList.remove('__editable-hover__');
        currentHover = null;
      }
    });
  <\/script>` : "";

  const editableStyles = markEditable ? `
    /* Editable element hover styles */
    [data-editable-field] {
      cursor: pointer !important;
      transition: outline 0.15s ease, background 0.15s ease;
      border-radius: 2px;
    }
    [data-editable-field].__editable-hover__ {
      outline: 2px dashed #7c3aed !important;
      outline-offset: 2px;
      background: rgba(124, 58, 237, 0.04) !important;
    }
    [data-editable-field].__editable-hover__::after {
      content: attr(data-editable-label);
      position: absolute;
      top: -20px;
      left: 0;
      background: #7c3aed;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
      z-index: 10000;
      pointer-events: none;
      line-height: 1.4;
    }
  ` : "";

  const fullHtml = `<!doctype html>
<html lang="ru-RU" class="nomarginwp">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${landingName || "Предпросмотр лендинга"}</title>
  ${inlinedCSS}
  <style>
    img:is([sizes=auto i],[sizes^="auto," i]){contain-intrinsic-size:3000px 1500px}
    body { margin: 0; padding: 0; }

    .__preview-block__ {
      position: relative;
      border-top: 2px dashed #c4b5fd;
    }
    .__preview-block__:first-child {
      border-top: none;
    }
    .__preview-block-label__ {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      background: #7c3aed;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      padding: 4px 10px 4px 8px;
      border-radius: 0 0 6px 0;
      opacity: 0.85;
      pointer-events: none;
      white-space: nowrap;
    }
    .__preview-block-type__ {
      margin-left: 6px;
      opacity: 0.6;
      font-weight: 400;
      font-size: 10px;
    }
    .__preview-block__:hover {
      outline: 2px solid #7c3aed40;
    }
    .__preview-block__:hover .__preview-block-label__ {
      opacity: 1;
    }
    ${editableStyles}
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
${editableScript}
</body>
</html>`;

  return { fullHtml, rawBlockHtmls: rawHtmls };
}

/**
 * Hook to fetch and cache the inlined CSS for landing preview.
 */
export function useInlinedCSS() {
  const [inlinedCSS, setInlinedCSS] = useState<string | null>(null);
  useEffect(() => {
    fetchInlinedCSS().then(setInlinedCSS);
  }, []);
  return inlinedCSS;
}

/**
 * Hook to fetch block definitions map for fallback.
 */
export function useBlockDefsMap() {
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
  return blockDefsMap;
}

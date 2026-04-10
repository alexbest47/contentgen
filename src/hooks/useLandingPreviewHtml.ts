import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LandingBlock } from "@/pages/LandingEditor";
import { WP_HEADER_LIGHT_HTML, WP_FOOTER_LIGHT_HTML, WP_BREADCRUMBS_HTML, WP_AGREED_HTML } from "@/lib/wpTemplateParts";

const CSS_FILES = [
  "css/fix.css",
  "css/fix-filippov.css",
  "css/landing.min.css",
  "css/style-hg8ap7v1d.css",
  "css/main.css",
];

const BASE_PATH = "/talentsy-template/";
const ASSET_BASE_URL = (import.meta.env.VITE_LANDING_ASSET_BASE_URL as string | undefined)?.trim()
  || `${window.location.origin}${BASE_PATH}`;

/** Placeholder SVG for empty images (generic person avatar silhouette) */
export const PLACEHOLDER_IMAGE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e5e7eb'/%3E%3Ccircle cx='150' cy='120' r='50' fill='%239ca3af'/%3E%3Cellipse cx='150' cy='260' rx='80' ry='60' fill='%239ca3af'/%3E%3C/svg%3E`;

/** Fetch all template CSS files and return inlined <style> blocks */
async function fetchInlinedCSS(): Promise<string> {
  const baseUrl = ASSET_BASE_URL.endsWith("/") ? ASSET_BASE_URL : `${ASSET_BASE_URL}/`;
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

/** Strip HTML tags from a string, returning plain text */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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
      // Split word/punctuation boundaries so tags between word and punctuation can be matched
      // "опорой," → ["опорой", ","], "психолог-консультант" → ["психолог-", "консультант"]
      const result: string[] = [];
      let pos = 0;
      while (pos < word.length) {
        const wordMatch = word.slice(pos).match(/^[\wа-яёА-ЯЁ][\wа-яёА-ЯЁ\-]*/);
        if (wordMatch) {
          const hParts = wordMatch[0].split(/(?<=-)/).filter(Boolean);
          result.push(...hParts);
          pos += wordMatch[0].length;
        } else {
          const punctMatch = word.slice(pos).match(/^[^\wа-яёА-ЯЁ]/);
          if (punctMatch) {
            result.push(punctMatch[0]);
            pos += punctMatch[0].length;
          } else {
            pos++;
          }
        }
      }
      return result.filter(Boolean);
    });

  if (tokens.length <= 1) return html;

  const TAG_OR_SPACE = "(?:\\s|<[^>]*>|&[a-zA-Z]+;|&#\\d+;)*";
  const pattern = tokens.map((t) => escapeRegExp(t)).join(TAG_OR_SPACE);

  try {
    const regex = new RegExp(pattern, "s");
    const match = html.match(regex);
    if (match) {
      const matchedStr = match[0];
      const matchIdx = match.index!;

      // Split matched region into tag segments (odd) and text segments (even)
      const segments = matchedStr.split(/(<[^>]*>)/);

      // Check if any HTML tags were captured in the match
      const hasTags = segments.some((s, i) => i % 2 === 1);

      if (!hasTags) {
        // No HTML tags in match — simple replacement is safe
        return html.slice(0, matchIdx) + newText + html.slice(matchIdx + matchedStr.length);
      }

      // Tags present — preserve them, only replace text nodes.
      // Identify text-bearing segments (non-empty text nodes)
      const textSlots: number[] = [];
      for (let i = 0; i < segments.length; i++) {
        if (i % 2 === 0 && segments[i].replace(/\s+/g, "").length > 0) {
          textSlots.push(i);
        }
      }

      if (textSlots.length === 0) {
        // Somehow no text slots — fall back to simple replacement
        return html.slice(0, matchIdx) + newText + html.slice(matchIdx + matchedStr.length);
      }

      // Put all new text in the first text slot, clear content in others.
      // This avoids word-boundary misalignment with tag positions
      // (e.g. <b>bold</b> tags wrapping wrong words and eating spaces).
      // Empty tags like <b></b> or trailing <br/> are harmless.
      const firstIdx = textSlots[0];
      const leadingWs = segments[firstIdx].match(/^(\s+)/)?.[1] || "";
      segments[firstIdx] = leadingWs + newText;
      for (let s = 1; s < textSlots.length; s++) {
        segments[textSlots[s]] = "";
      }

      const replacement = segments.join("");
      return html.slice(0, matchIdx) + replacement + html.slice(matchIdx + matchedStr.length);
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
  // When newSrc is empty (e.g. after AI clears teacher photos), use placeholder
  const replacement = newSrc || PLACEHOLDER_IMAGE;
  return html.split(oldSrc).join(replacement);
}

/**
 * Replace form template markers with preview-safe values.
 * This keeps visual parity in constructor preview without binding runtime integrations.
 */
function applyPreviewFormPlaceholders(html: string): string {
  const previewPromoBlock = `<div class="promo-container course-block__item course-block__item_promo">
               <button type="button" class="promo-button icon" style="--icon: url('img/main-page/icon/icon-arrow-down.svg')">
                  У меня есть промокод
                </button>

                <div class="course-block__item-hidden">
                  <div class="course-block__item-hidden-el mb-10">
                    <input type="text" class="input input-light jsPmoField" placeholder="Промокод" name="jsPmoHiddenFormField">
                    <button type="button" class="button-promo-b jsPPRequest">Применить</button>
                  </div>
                  <div class="jsPmoError"></div>
                </div>
              </div>`;
  return html
    .replace(/\{\{FORM_TAG_ATTRS\}\}/g, 'data-target="axFormRequest"')
    .replace(/\{\{FORM_CLASS_EXTRA\}\}/g, "ajaxForm")
    .replace(/\{\{FIELD_NAME_NAME\}\}/g, "Name")
    .replace(/\{\{FIELD_PHONE_NAME\}\}/g, "Phone")
    .replace(/\{\{FIELD_EMAIL_NAME\}\}/g, "Email")
    .replace(/\{\{FORM_AGREED_BLOCK\}\}/g, WP_AGREED_HTML)
    .replace(/\{\{FORM_HIDDENS\}\}/g, "")
    .replace(/\{\{PROMO_BLOCK\}\}/g, previewPromoBlock)
    .replace(/\{\{DISCOUNT_UNTIL\}\}/g, "03.04.2026");
}

/**
 * Ensure first <section> in block HTML has the provided id.
 * If section already has id, replace it; if no id, append it.
 */
function applySectionIdToRootSection(html: string, sectionId?: string): string {
  const id = (sectionId || "").trim();
  if (!id) return html;

  const sectionOpenTagRe = /<section\b[^>]*>/i;
  const match = html.match(sectionOpenTagRe);
  if (!match) return html;
  const originalTag = match[0];

  let updatedTag: string;
  if (/\bid\s*=\s*["'][^"']*["']/i.test(originalTag)) {
    updatedTag = originalTag.replace(/\bid\s*=\s*["'][^"']*["']/i, `id="${id}"`);
  } else {
    updatedTag = originalTag.replace(/^<section\b/i, `<section id="${id}"`);
  }

  return html.replace(originalTag, updatedTag);
}

/**
 * Replace a bullet list (<ul> or <ol>) in HTML by finding it via the first default item text,
 * then replacing its innerHTML with new <li> elements.
 * Used for "bullet_list" field type where content is \n-separated items.
 */
function replaceListInHtml(html: string, defaultItems: string[], newItems: string[]): string {
  if (!defaultItems.length) return html;

  // Find the first default item text in the HTML (it should be inside a <li>)
  const firstItem = stripHtml(defaultItems[0]).trim();
  if (!firstItem) return html;

  const pos = html.indexOf(firstItem);
  if (pos === -1) return html;

  // Find the enclosing <ul> or <ol>
  const ulPos = Math.max(
    html.lastIndexOf("<ul", pos),
    html.lastIndexOf("<ol", pos),
  );
  if (ulPos === -1) return html;

  // Determine the tag name (ul or ol)
  const tagName = html.substring(ulPos + 1, ulPos + 3); // "ul" or "ol"
  const closingTag = `</${tagName}>`;

  // Find the end of the opening tag
  const openTagEnd = html.indexOf(">", ulPos);
  if (openTagEnd === -1) return html;

  // Find the matching closing tag (handle nesting)
  let depth = 1;
  let searchPos = openTagEnd + 1;
  let closePos = -1;
  const openPattern = `<${tagName}`;
  while (depth > 0 && searchPos < html.length) {
    const nextOpen = html.indexOf(openPattern, searchPos);
    const nextClose = html.indexOf(closingTag, searchPos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      searchPos = nextOpen + 3;
    } else {
      depth--;
      if (depth === 0) {
        closePos = nextClose;
      }
      searchPos = nextClose + closingTag.length;
    }
  }
  if (closePos === -1) return html;

  // Preserve the opening tag with its attributes
  const openTag = html.substring(ulPos, openTagEnd + 1);

  // Build new list content
  const newListItems = newItems
    .filter((item) => item.trim())
    .map((item) => `<li>${item.trim()}</li>`)
    .join("\n");
  const newListHtml = `${openTag}\n${newListItems}\n${closingTag}`;

  return html.slice(0, ulPos) + newListHtml + html.slice(closePos + closingTag.length);
}

function hideElementContaining(html: string, markerText: string): string {
  // Strip HTML from marker in case default_content contains styled HTML
  const trimmed = stripHtml(markerText);
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

  const replacements: { old: string; new: string; type: "text" | "image" | "url" | "bullet_list"; field: string; index?: number; subfield?: string }[] = [];

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
              : sf.type === "bullet_list" ? "bullet_list" as const
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
    } else if (r.type === "bullet_list") {
      // Bullet list: \n-separated items → replace the enclosing <ul>/<ol> content
      const defaultItems = r.old.split("\n").map((s) => s.trim()).filter(Boolean);
      const newItems = r.new.split("\n").map((s) => s.trim()).filter(Boolean);
      if (defaultItems.length) {
        html = replaceListInHtml(html, defaultItems, newItems);
      }
    } else {
      // Strip HTML tags from both old and new values for text replacement.
      // The old (default) text is searched as plain text in the HTML template.
      // The new (override) text is injected as-is (may contain HTML formatting from rich editor).
      const oldPlain = stripHtml(r.old);
      const newVal = r.new.trim();
      if (oldPlain) {
        html = replaceTextInHtml(html, oldPlain, newVal);
      }
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

  // Apply image position offsets and scale: inject <style> block with CSS attribute selectors
  const imagePositions: Record<string, { x: number; y: number }> = overrides._image_positions || {};
  const imageScales: Record<string, number> = overrides._image_scales || {};
  // Collect all image paths that have either position or scale overrides
  const allTransformPaths = new Set([...Object.keys(imagePositions), ...Object.keys(imageScales)]);
  const transformRules: string[] = [];
  for (const imgPath of allTransformPaths) {
    const pos = imagePositions[imgPath] || { x: 0, y: 0 };
    const scale = imageScales[imgPath] || 1;
    if (pos.x === 0 && pos.y === 0 && scale === 1) continue;
    const resolvedUrl = imageOverrides[imgPath] || imgPath;
    const fileName = (resolvedUrl.split("/").pop() || imgPath.split("/").pop() || "").replace(/["\\]/g, "");
    if (!fileName) continue;
    const parts: string[] = [];
    if (pos.x !== 0 || pos.y !== 0) parts.push(`translate(${pos.x}px, ${pos.y}px)`);
    if (scale !== 1) parts.push(`scale(${scale})`);
    transformRules.push(
      `img[src*="${fileName}"] { transform: ${parts.join(" ")} !important; }`
    );
  }
  if (transformRules.length > 0) {
    html += `\n<style>\n${transformRules.join("\n")}\n</style>`;
  }

  // Apply video/iframe URL overrides
  const videoOverrides: Record<string, string> = overrides._video_overrides || {};
  for (const [oldUrl, newUrl] of Object.entries(videoOverrides)) {
    if (typeof newUrl === "string" && newUrl) {
      html = html.split(oldUrl).join(newUrl);
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
          const raw = item[sf.field];
          if (typeof raw !== "string" || raw.length < 2) continue;
          // Strip HTML tags so we search for plain text in rendered HTML
          const text = stripHtml(raw);
          if (text.length < 2) continue;
          html = wrapTextWithMarker(html, text, blockId, key, i, sf.field, sf.label || sf.field);
        }
      }
    } else if (field.type === "text" || field.type === "textarea") {
      if (typeof val !== "string" || val.length < 2) continue;
      const text = stripHtml(val);
      if (text.length < 2) continue;
      html = wrapTextWithMarker(html, text, blockId, key, undefined, undefined, field.label || key);
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
/**
 * Generate a darker shade of a hex color (for hover states, dark variants).
 */
function darkenHex(hex: string, amount: number = 0.2): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.max(0, Math.round(r * (1 - amount)));
  const ng = Math.max(0, Math.round(g * (1 - amount)));
  const nb = Math.max(0, Math.round(b * (1 - amount)));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

/**
 * Generate a lighter shade of a hex color (for gradients, lighter variants).
 */
function lightenHex(hex: string, amount: number = 0.3): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

/**
 * Build full accent palette from a single accent color.
 */
function buildAccentPalette(accentColor: string) {
  return {
    primary: accentColor,                    // main accent (#7835FF equivalent)
    dark: darkenHex(accentColor, 0.15),      // dark variant (#5443AF / #6957CE equivalent)
    hoverDark: darkenHex(accentColor, 0.2),  // hover state (#6525e0 equivalent)
    light: lightenHex(accentColor, 0.35),    // light for gradients (#B1A4FF equivalent)
    muted: lightenHex(accentColor, 0.15),    // muted variant (#865ad0 equivalent)
    veryLight: lightenHex(accentColor, 0.85), // background tint (#EAE5FF equivalent)
  };
}

/**
 * Original purple palette hex values used in templates (case-insensitive).
 * Maps each original hex to a function that picks the right replacement from palette.
 */
function getHexReplacementMap(palette: ReturnType<typeof buildAccentPalette>): [RegExp, string][] {
  return [
    [/#7835FF/gi, palette.primary],       // Primary bright purple (buttons, text, borders)
    [/#6957CE/gi, palette.dark],          // CSS variable --color-purple
    [/#5443AF/gi, palette.hoverDark],     // CSS variable --color-purple-dark
    [/#B1A4FF/gi, palette.light],         // Gradient light end
    [/#865ad0/gi, palette.muted],         // Template-specific muted purple
    [/#8147FF/gi, palette.primary],       // Bright variant (pseudo-elements)
    [/#AE1AE8/gi, palette.primary],       // Deep magenta-purple (sections)
    [/#EAE5FF/gi, palette.veryLight],     // Very light purple backgrounds
    [/#6525e0/gi, palette.hoverDark],     // Hover-dark (CTA hovers in migrations)
  ];
}

/**
 * Replace all purple hex values in an HTML string with accent palette equivalents.
 */
function replaceHexInHtml(html: string, palette: ReturnType<typeof buildAccentPalette>): string {
  const replacements = getHexReplacementMap(palette);
  let result = html;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Build accent color CSS overrides that replace all purple theme colors.
 * Covers CSS variables, classes, pseudo-elements, form elements, and section backgrounds.
 */
function buildAccentColorCSS(accentColor: string): string {
  const p = buildAccentPalette(accentColor);
  return `
    /* === Global accent color overrides === */
    :root {
      --color-purple: ${p.primary} !important;
      --color-purple-dark: ${p.dark} !important;
      --color-purple-gradient: linear-gradient(315deg, ${p.primary} 16.02%, ${p.light} 87.11%) !important;
    }

    /* Text colors */
    .color-purple { color: ${p.primary} !important; }
    .color-purple-2 { color: ${p.primary} !important; }
    .color-purple-hg8ap7v1d { color: ${p.primary} !important; }
    .text-purple { color: ${p.primary} !important; }

    /* Buttons */
    .button-purple { background: ${p.primary} !important; }
    .button-purple:hover { background: ${p.hoverDark} !important; }
    .button-white-b:hover { background: ${p.primary} !important; }
    .button-black:hover { background: ${p.primary} !important; }
    .button_border_black:hover { background: ${p.primary} !important; border-color: ${p.primary} !important; }
    .button_black:hover { background: ${p.primary} !important; }
    .button_white:hover { background: ${p.primary} !important; }

    /* Form elements */
    .input:hover, .input:focus { border-color: ${p.primary} !important; }
    .course-input:hover, .course-input:focus { border-color: ${p.primary} !important; }
    .form-agreed__check input:checked + .check-icon { border-color: ${p.primary} !important; background: ${p.primary} !important; }

    /* Pseudo-elements (::before backgrounds) */
    .clue-icon_hg8ap7v1d:before { background: ${p.primary} !important; }
    .education-list:before { background: ${p.primary} !important; }
    .list-check li:before { background: ${p.primary} !important; }
    .check-item:before { background: ${p.primary} !important; }
    .start-mba__advantages-item:before { background: ${p.primary} !important; }
    .diploma-item__element:before { background: ${p.primary} !important; }

    /* Section/block backgrounds */
    .banner-right-price_hg8ap7v1d { background-color: ${p.muted} !important; }
    .main-action_happiness { background: ${p.primary} !important; }
    .main-action_happiness .main-action-container { background: ${p.primary} !important; }
    .crisis-b-prank { background: ${p.primary} !important; }
    .box-container__tag_purple { background: ${p.primary} !important; }

    /* Light purple backgrounds */
    .step-mba__online { background: ${p.veryLight} !important; }
    .choosing-us__item_plan { background: ${p.veryLight} !important; }
    .why-childrens-item_pink { background: ${p.veryLight} !important; }
    .stages-item_purple { background: ${p.veryLight} !important; }
    .box-container__column_pic { background: ${p.veryLight} !important; }
    .help-block { background: ${p.veryLight} !important; }
    .general-block_pink { background-color: ${p.veryLight} !important; }

    /* Misc elements */
    .diploma-deduction__percent { border-color: ${p.primary} !important; color: ${p.primary} !important; }
    .review-link:hover { color: ${p.primary} !important; }
    .review-link:hover:before { background: ${p.primary} !important; }
    .switcher-icon span { background: ${p.primary} !important; }
    .live-section.active .live-section__switcher { background: ${p.primary} !important; }
    .course-block__vk:hover { background: ${p.primary} !important; }
    .footer-agreed a:hover { color: ${p.primary} !important; }
    .earnings-item .noUi-connect { background: ${p.primary} !important; }
    .earnings-item .noUi-handle { background: ${p.primary} !important; }
  `;
}

export function buildPreviewHtml(
  blocks: LandingBlock[],
  inlinedCSS: string,
  landingName: string,
  blockDefsMap?: Record<string, any>,
  markEditable?: boolean,
  wpOptions?: { breadcrumbSlug?: string; breadcrumbTitle?: string },
  accentColor?: string | null,
): { fullHtml: string; rawBlockHtmls: string[] } {
  const baseUrl = ASSET_BASE_URL.endsWith("/") ? ASSET_BASE_URL : `${ASSET_BASE_URL}/`;
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
    html = applySectionIdToRootSection(html, (b.settings || {}).section_id);

    // Replace purple hex values directly in block HTML (catches inline styles, <style> blocks, etc.)
    if (accentColor) {
      const palette = buildAccentPalette(accentColor);
      html = replaceHexInHtml(html, palette);
    }

    if (b.custom_css) {
      html = `<style>${b.custom_css}</style>${html}`;
    }

    // Apply background color settings
    const blockSettings = b.settings || {};
    const settingsStyles: string[] = [];
    if (blockSettings.background_color) {
      settingsStyles.push(`[data-block-id="${b.id}"] { background-color: ${blockSettings.background_color} !important; }`);
      settingsStyles.push(`[data-block-id="${b.id}"] > *:not(.__preview-block-label__):not(.__block-actions__) { background-color: ${blockSettings.background_color}; }`);
    }
    if (blockSettings.card_color) {
      settingsStyles.push(`[data-block-id="${b.id}"] .program-card, [data-block-id="${b.id}"] .info-card, [data-block-id="${b.id}"] .review-card, [data-block-id="${b.id}"] .card, [data-block-id="${b.id}"] [class*="card"], [data-block-id="${b.id}"] [class*="item"] { background-color: ${blockSettings.card_color} !important; }`);
    }
    if (settingsStyles.length > 0) {
      html = `<style>${settingsStyles.join("\n")}</style>${html}`;
    }

    rawHtmls.push(html);
    html = applyPreviewFormPlaceholders(html);
    html = absolutifyPaths(html, baseUrl);

    const blockName = def.name || joinedDef?.name || def.block_type || "Блок";
    const blockType = def.block_type || joinedDef?.block_type || "";
    const blockActions = markEditable ? `<div class="__block-actions__">
        <button class="__block-action-btn__" data-action="move-up" data-block-id="${b.id}" title="Переместить вверх">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2L2 7h8L6 2z" fill="currentColor"/></svg>
        </button>
        <button class="__block-action-btn__" data-action="move-down" data-block-id="${b.id}" title="Переместить вниз">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 10L2 5h8L6 10z" fill="currentColor"/></svg>
        </button>
        <button class="__block-action-btn__" data-action="duplicate" data-block-id="${b.id}" title="Дублировать">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8.5 3.5V2a1 1 0 00-1-1H2a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
        </button>
        <button class="__block-action-btn__ __block-action-btn--danger__" data-action="delete" data-block-id="${b.id}" title="Удалить">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M9 3v7a1 1 0 01-1 1H4a1 1 0 01-1-1V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>
        </button>
      </div>` : "";
    return `<div class="__preview-block__" data-block-id="${b.id}">
      <div class="__preview-block-label__">${blockName}<span class="__preview-block-type__">${blockType}</span>${blockActions}</div>
      ${html}
    </div>`;
  });

  // Insert "+" add-block buttons between blocks (and at the top/bottom)
  if (markEditable) {
    const addBtn = (insertIndex: number) =>
      `<div class="__add-block-gap__">
        <div class="__add-block-line__"></div>
        <button class="__add-block-btn__" data-insert-index="${insertIndex}" title="Добавить блок">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>`;

    const withButtons: string[] = [];
    withButtons.push(addBtn(0));
    for (let i = 0; i < blockHtmls.length; i++) {
      withButtons.push(blockHtmls[i]);
      withButtons.push(addBtn(i + 1));
    }
    blockHtmls.length = 0;
    blockHtmls.push(...withButtons);
  }

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

    // Add-block button click handler
    document.addEventListener('click', function(e) {
      var btn = e.target.closest && e.target.closest('.__add-block-btn__');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'add-block-click',
          insertIndex: parseInt(btn.getAttribute('data-insert-index'), 10),
        }, '*');
        return;
      }
    }, true);

    // Block action buttons (move up/down, duplicate, delete)
    document.addEventListener('click', function(e) {
      var btn = e.target.closest && e.target.closest('.__block-action-btn__');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        var action = btn.getAttribute('data-action');
        var blockId = btn.getAttribute('data-block-id');
        if (action && blockId) {
          window.parent.postMessage({
            type: 'block-action',
            action: action,
            blockId: blockId,
          }, '*');
        }
        return;
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

  // Build breadcrumbs HTML with actual values
  const breadcrumbSlug = wpOptions?.breadcrumbSlug || "psychology";
  const breadcrumbTitle = wpOptions?.breadcrumbTitle || "Курсы психологии";
  const breadcrumbsHtml = WP_BREADCRUMBS_HTML
    .replace(/\{\{BREADCRUMB_SLUG\}\}/g, breadcrumbSlug)
    .replace(/\{\{BREADCRUMB_TITLE\}\}/g, breadcrumbTitle)
    .replace(/\{\{LANDING_TITLE\}\}/g, landingName || "Лендинг");

  // Use real WP header for preview (it already includes all CSS/JS from talentsy.ru)
  // We still inject our editable styles and preview-specific CSS after the header's </head>
  const previewStyles = `<style>
    img:is([sizes=auto i],[sizes^="auto," i]){contain-intrinsic-size:3000px 1500px}
    body { margin: 0; padding: 0; }

    /* Fix: Talentsy buttons are rounded on the live site but some cascade
       in the preview flattens them. Force the brand radius. */
    a.button, button.button, .button.button-purple, .button {
      border-radius: 16px !important;
    }

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
      pointer-events: auto;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
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
    .__block-actions__ {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: 8px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .__preview-block__:hover .__block-actions__ {
      opacity: 1;
    }
    .__block-action-btn__ {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 4px;
      background: rgba(255,255,255,0.2);
      color: #fff;
      cursor: pointer;
      padding: 0;
      transition: background 0.15s;
    }
    .__block-action-btn__:hover {
      background: rgba(255,255,255,0.4);
    }
    .__block-action-btn--danger__:hover {
      background: #ef4444;
    }
    ${editableStyles}

    /* Add-block "+" buttons between blocks */
    .__add-block-gap__ {
      position: relative;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .__add-block-gap__:hover {
      opacity: 1;
    }
    .__add-block-line__ {
      position: absolute;
      top: 50%;
      left: 5%;
      right: 5%;
      height: 2px;
      background: #7c3aed;
      border-radius: 1px;
      pointer-events: none;
    }
    .__add-block-btn__ {
      position: relative;
      z-index: 1;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #7c3aed;
      background: #fff;
      color: #7c3aed;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, transform 0.15s;
      padding: 0;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
    }
    .__add-block-btn__:hover {
      background: #7c3aed;
      color: #fff;
      transform: scale(1.15);
    }
  </style>`;

  // Build accent color overrides if custom accent is set
  const accentCSS = accentColor ? `<style>${buildAccentColorCSS(accentColor)}</style>` : "";
  // Also replace hex colors inside the inlined CSS itself (catches pseudo-elements, complex selectors, etc.)
  const processedCSS = accentColor ? replaceHexInHtml(inlinedCSS, buildAccentPalette(accentColor)) : inlinedCSS;

  // Insert preview styles before </head> in the WP header
  const headerWithStyles = WP_HEADER_LIGHT_HTML.replace('</head>', `${processedCSS}\n${previewStyles}\n${accentCSS}\n</head>`);

  // Inject editableScript before </body> to avoid placing it after </html>
  const footerWithScript = WP_FOOTER_LIGHT_HTML.replace('</body>', `${editableScript}\n</body>`);

  const fullHtml = `${headerWithStyles}
${breadcrumbsHtml}
<main class="page page_hg8ap7v1d">
${blockHtmls.join("\n\n")}
</main>
${footerWithScript}`;

  // Prepend accent color CSS to rawBlockHtmls for export
  if (accentColor && rawHtmls.length > 0) {
    rawHtmls[0] = `<style>${buildAccentColorCSS(accentColor)}</style>\n${rawHtmls[0]}`;
  }

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

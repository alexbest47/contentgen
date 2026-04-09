/**
 * Extract styled HTML from block HTML templates so the RichTextEditor
 * can display text with the same formatting as the landing preview.
 *
 * For each editable text field, finds where its plain-text value appears
 * in the HTML template, extracts the surrounding inline styles/tags,
 * and returns an HTML string suitable for contentEditable display.
 */

// ─── CSS class → inline style mapping ──────────────────────────────────

/** Known classes from the Talentsy template CSS → inline style */
const KNOWN_CLASS_STYLES: Record<string, string> = {
  // Color classes
  "color-gray": "color:#393939",
  "color-gray-2": "color:#B1B1B1",
  "color-gray-3": "color:#7F7F7F",
  "color-gray-4": "color:#BDBDBD",
  "color-white": "color:white",
  "color-black-50": "color:rgba(0,0,0,0.5)",
  "color-white-70": "color:rgba(255,255,255,0.7)",
  "color-white-50": "color:rgba(255,255,255,0.5)",
  "color-purple": "color:#7835FF",
  "color-purple-2": "color:#7835FF",
  "color-purple-hg8ap7v1d": "color:#865ad0",
  "color-green": "color:#39B500",
  "color-red": "color:#B50018",
  // Text-* color classes
  "text-orange": "color:#FC5F27",
  "text-black-50": "color:rgba(0,0,0,0.5)",
  "text-black-65": "color:rgba(0,0,0,0.65)",
  "text-white-70": "color:rgba(255,255,255,0.7)",
  "text-white-50": "color:rgba(255,255,255,0.5)",
  // Span-grey
  "span-grey": "color:#5F5F5F",
  // Font-weight classes (skip fw-500 — it's "medium" and looks like regular text)
  "fw-600": "font-weight:600",
  "fw-700": "font-weight:700",
  "font-bold": "font-weight:600",
};

/**
 * Parse CSS text and extract class→style mappings for color/font-related properties.
 * Augments the known mapping with dynamically-parsed rules.
 */
export function buildClassStyleMap(cssText: string): Record<string, string> {
  const map: Record<string, string> = { ...KNOWN_CLASS_STYLES };

  function extractStyles(body: string): string | null {
    const styles: string[] = [];
    const colorMatch = body.match(/(?:^|;)\s*color\s*:\s*([^;!}]+)/i);
    if (colorMatch && !colorMatch[1].includes("var(")) {
      styles.push(`color:${colorMatch[1].trim()}`);
    }
    const bgMatch = body.match(/(?:^|;)\s*background-color\s*:\s*([^;!}]+)/i);
    if (bgMatch && !bgMatch[1].includes("var(")) {
      styles.push(`background-color:${bgMatch[1].trim()}`);
    }
    const fwMatch = body.match(/(?:^|;)\s*font-weight\s*:\s*([^;!}]+)/i);
    if (fwMatch) {
      const fwVal = fwMatch[1].trim();
      // Only extract bold-like weights (600+); skip 500 (medium) and below — they look normal
      const fwNum = parseInt(fwVal, 10);
      if (fwVal === "bold" || fwVal === "bolder" || (fwNum >= 600)) {
        styles.push(`font-weight:${fwVal}`);
      }
    }
    return styles.length > 0 ? styles.join(";") : null;
  }

  // Pre-process: expand comma-separated selectors into individual rules.
  // ".a, .b { color: red }" → ".a { color: red }\n.b { color: red }"
  const expanded = cssText.replace(
    /([^{}]+)\{([^}]{1,500})\}/g,
    (full, selectorGroup: string, body: string) => {
      if (!selectorGroup.includes(",")) return full;
      return selectorGroup
        .split(",")
        .map((sel: string) => `${sel.trim()} {${body}}`)
        .join("\n");
    },
  );

  // Split by '}' and match only SIMPLE selectors: .classname { body }
  // Compound selectors like ".parent .child { }" won't match because
  // ^\s*\.([\w-]+)\s*\{ requires the class to be immediately followed by '{'
  const ruleChunks = expanded.split("}");
  const simpleRuleRe = /^\s*\.([\w-]+)\s*\{([\s\S]*)$/;
  for (const chunk of ruleChunks) {
    const m = chunk.match(simpleRuleRe);
    if (!m) continue;
    const className = m[1];
    if (map[className]) continue; // known mapping takes priority
    const styleStr = extractStyles(m[2]);
    if (styleStr) {
      map[className] = styleStr;
    }
  }

  return map;
}

// ─── Helper utilities ───────────────────────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Core extraction ────────────────────────────────────────────────────

const INLINE_TAGS = new Set(["span", "b", "strong", "i", "em", "u", "font", "mark", "a", "sup", "sub"]);

/**
 * Find unclosed inline tags in a chunk of HTML that precedes a text match.
 * Returns an array of opening tag strings (e.g. `<span class="color-purple">`).
 */
function findUnclosedInlineTags(htmlBefore: string): string[] {
  const stack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z]\w*)([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(htmlBefore)) !== null) {
    const fullTag = m[0];
    const tagName = m[1].toLowerCase();
    if (!INLINE_TAGS.has(tagName)) continue;
    if (fullTag.startsWith("</")) {
      for (let i = stack.length - 1; i >= 0; i--) {
        const openName = stack[i].match(/<(\w+)/)?.[1]?.toLowerCase();
        if (openName === tagName) {
          stack.splice(i, 1);
          break;
        }
      }
    } else if (!fullTag.endsWith("/>")) {
      stack.push(fullTag);
    }
  }
  return stack;
}

/**
 * Convert CSS classes in an HTML tag string to inline styles.
 */
function convertTagToInline(tag: string, classStyleMap: Record<string, string>): string {
  const classMatch = tag.match(/class="([^"]*)"/);
  if (!classMatch) return tag;

  const classes = classMatch[1].split(/\s+/).filter(Boolean);
  const inlineStyles: string[] = [];

  for (const cls of classes) {
    if (classStyleMap[cls]) {
      inlineStyles.push(classStyleMap[cls]);
    }
  }

  if (inlineStyles.length === 0) {
    // No visual classes — remove class attr
    const cleaned = tag.replace(/\s*class="[^"]*"/, "");
    return cleaned;
  }

  // Replace class with style (or merge with existing style)
  let result = tag.replace(/\s*class="[^"]*"/, "");
  const existingStyle = result.match(/style="([^"]*)"/);
  if (existingStyle) {
    result = result.replace(
      /style="([^"]*)"/,
      `style="${existingStyle[1]};${inlineStyles.join(";")}"`,
    );
  } else {
    result = result.replace(/>$/, ` style="${inlineStyles.join(";")}">`);
  }

  return result;
}

/**
 * Convert all CSS classes to inline styles throughout an HTML fragment.
 */
function convertFragmentToInline(html: string, classStyleMap: Record<string, string>): string {
  return html.replace(/<([a-zA-Z]\w*)([^>]*)>/g, (fullTag, tagName) => {
    if (!INLINE_TAGS.has(tagName.toLowerCase())) return fullTag;
    return convertTagToInline(fullTag, classStyleMap);
  });
}

/**
 * Remove empty/useless span wrappers that have no attributes.
 */
function cleanupEmptySpans(html: string): string {
  let prev = "";
  let current = html;
  while (prev !== current) {
    prev = current;
    current = current.replace(/<span\s*>(.*?)<\/span>/gs, "$1");
  }
  return current;
}

/**
 * Tokenize text for regex matching. Splits on whitespace AND separates
 * trailing/leading punctuation from words so that tags between a word
 * and its punctuation (like `опорой</b>,`) can be matched.
 */
function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      // Split word from trailing/leading punctuation, keep hyphens attached
      // "опорой," → ["опорой", ","]
      // "психолог-консультант" → ["психолог-", "консультант"]
      // "профессии" → ["профессии"]
      // "(Ясно," → ["(", "Ясно", ","]
      const parts = word.match(/[\wа-яёА-ЯЁ][\wа-яёА-ЯЁ\-]*/g);
      const puncts = word.match(/[^\wа-яёА-ЯЁ\-]+/g);
      if (!parts) return puncts || [word];

      // Rebuild in order by walking through original word
      const result: string[] = [];
      let pos = 0;
      while (pos < word.length) {
        // Try to match a word-char run
        const wordMatch = word.slice(pos).match(/^[\wа-яёА-ЯЁ][\wа-яёА-ЯЁ\-]*/);
        if (wordMatch) {
          // Split on hyphens keeping hyphen attached to preceding part
          const hParts = wordMatch[0].split(/(?<=-)/).filter(Boolean);
          result.push(...hParts);
          pos += wordMatch[0].length;
        } else {
          // Punctuation run
          const punctMatch = word.slice(pos).match(/^[^\wа-яёА-ЯЁ]/);
          if (punctMatch) {
            result.push(punctMatch[0]);
            pos += punctMatch[0].length;
          } else {
            pos++; // safety
          }
        }
      }
      return result.filter(Boolean);
    });
}

/**
 * Given an HTML template and a plain text string, find where the text
 * appears in the template and extract the full styled HTML fragment.
 *
 * Returns null if no styling is applied or text not found.
 */
export function extractStyledFragment(
  htmlTemplate: string,
  plainText: string,
  classStyleMap: Record<string, string>,
): string | null {
  const stripped = stripHtml(plainText);
  if (!stripped || stripped.length < 2) return null;

  const tokens = tokenize(stripped);
  if (tokens.length === 0) return null;

  // Build tokenized regex (same approach as replaceTextInHtml)
  const TAG_OR_SPACE = "(?:\\s|<[^>]*>|&[a-zA-Z]+;|&#\\d+;)*";
  const pattern = tokens.map((t) => escapeRegExp(t)).join(TAG_OR_SPACE);

  let match: RegExpMatchArray | null;
  try {
    const regex = new RegExp(pattern, "s");
    match = htmlTemplate.match(regex);
  } catch {
    return null;
  }

  if (!match) return null;

  const matchedHtml = match[0];
  const matchStart = match.index!;
  const matchEnd = matchStart + matchedHtml.length;

  // Find unclosed inline tags that wrap the matched region
  const before = htmlTemplate.slice(0, matchStart);
  const unclosedTags = findUnclosedInlineTags(before);

  // Check if there's any styling at all (inline tags inside match OR wrapping tags)
  const hasInternalTags = /<[^>]+>/.test(matchedHtml);
  const hasWrappingTags = unclosedTags.length > 0;

  // Also check the direct parent element (even block-level like <div>, <p>, <h2>, etc.)
  // for styling classes. This handles cases like <div class="text-black-50 fw-600">text</div>
  if (!hasInternalTags && !hasWrappingTags) {
    const parentTagMatch = before.match(/<([a-zA-Z]\w*)([^>]*)>\s*$/);
    if (parentTagMatch) {
      const parentAttrs = parentTagMatch[2];
      const parentClassMatch = parentAttrs.match(/class="([^"]*)"/);
      if (parentClassMatch) {
        const parentClasses = parentClassMatch[1].split(/\s+/).filter(Boolean);
        const parentStyles: string[] = [];
        for (const cls of parentClasses) {
          if (classStyleMap[cls]) parentStyles.push(classStyleMap[cls]);
        }
        if (parentStyles.length > 0) {
          const filteredStyles = parentStyles
            .join(";")
            .split(";")
            .filter((s) => {
              const trimmed = s.trim().toLowerCase();
              if (!trimmed.startsWith("color:")) return true;
              const colorVal = trimmed.slice(6).trim();
              if (
                colorVal === "white" ||
                colorVal === "#fff" ||
                colorVal === "#ffffff" ||
                /^rgba\(\s*255\s*,\s*255\s*,\s*255/.test(colorVal)
              )
                return false;
              return true;
            })
            .join(";");
          if (filteredStyles) {
            return `<span style="${filteredStyles}">${stripped}</span>`;
          }
          return null; // Only white colors — skip styling
        }
      }
    }
    return null; // No styling — plain text only
  }

  // Build the full fragment with wrappers
  let fragment = matchedHtml;

  // Prepend wrapping open tags (in original order)
  let prefix = "";
  let suffix = "";
  for (const tag of unclosedTags) {
    prefix += convertTagToInline(tag, classStyleMap);
  }
  // Append corresponding closing tags (reverse order)
  for (let i = unclosedTags.length - 1; i >= 0; i--) {
    const tagName = unclosedTags[i].match(/<(\w+)/)?.[1] || "span";
    suffix += `</${tagName}>`;
  }

  // Convert classes inside the fragment itself
  fragment = convertFragmentToInline(fragment, classStyleMap);

  // Clean up
  let result = prefix + fragment + suffix;
  result = cleanupEmptySpans(result);
  result = rebalanceInlineTags(result);

  // Remove <br> and <br/> tags — they don't belong in single-line editor values
  result = result.replace(/<br\s*\/?>/gi, " ");
  // Collapse multiple spaces
  result = result.replace(/\s{2,}/g, " ");

  // Strip white/near-white color values — they'd be invisible on the editor's light background.
  // Keep other styles (font-weight, etc.) even if color is removed.
  result = result.replace(/style="([^"]*)"/g, (_m, styles: string) => {
    const filtered = styles
      .split(";")
      .filter((s) => {
        const trimmed = s.trim().toLowerCase();
        if (!trimmed.startsWith("color:")) return true;
        const colorVal = trimmed.slice(6).trim();
        // Skip white-ish colors
        if (
          colorVal === "white" ||
          colorVal === "#fff" ||
          colorVal === "#ffffff" ||
          /^rgba\(\s*255\s*,\s*255\s*,\s*255/.test(colorVal)
        ) {
          return false;
        }
        return true;
      })
      .join(";");
    return filtered ? `style="${filtered}"` : "";
  });

  // If the result is identical to the plain text, no styling was found
  if (
    stripHtml(result).trim() === stripped &&
    !/<[^/][^>]*style=/.test(result) &&
    !/(<b>|<strong>|<i>|<em>|<u>)/.test(result)
  ) {
    return null;
  }

  return result;
}

/**
 * Rebalance inline tags: ensure every open tag has a matching close tag
 * and remove orphaned closing tags.
 */
function rebalanceInlineTags(html: string): string {
  const parts = html.split(/(<\/?[a-zA-Z]\w*[^>]*>)/);
  const openStack: string[] = [];

  const result: string[] = [];
  for (const part of parts) {
    const openMatch = part.match(/^<([a-zA-Z]\w*)[\s>]/);
    const closeMatch = part.match(/^<\/([a-zA-Z]\w*)>/);

    if (closeMatch) {
      const tagName = closeMatch[1].toLowerCase();
      if (INLINE_TAGS.has(tagName)) {
        const idx = openStack.lastIndexOf(tagName);
        if (idx >= 0) {
          openStack.splice(idx, 1);
          result.push(part);
        }
        // else: orphaned closing tag — skip it
      } else {
        result.push(part);
      }
    } else if (openMatch) {
      const tagName = openMatch[1].toLowerCase();
      if (INLINE_TAGS.has(tagName) && !part.endsWith("/>")) {
        openStack.push(tagName);
      }
      result.push(part);
    } else {
      result.push(part);
    }
  }

  // Close any unclosed tags
  let closingSuffix = "";
  for (let i = openStack.length - 1; i >= 0; i--) {
    closingSuffix += `</${openStack[i]}>`;
  }

  return result.join("") + closingSuffix;
}

// ─── Main exported function ─────────────────────────────────────────────

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
 * For a given block definition, extract styled HTML for all editable text fields.
 *
 * Returns a map of `fieldPath → styledHtml` for fields where the template
 * has styling (color classes, bold, etc.) that differs from the plain text.
 */
export function extractStyledValues(
  htmlTemplate: string,
  defaultContent: Record<string, any>,
  editableFields: any[],
  classStyleMap: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const field of editableFields) {
    if (field.type === "text" || field.type === "textarea") {
      const plainText = getNestedValue(defaultContent, field.field);
      if (typeof plainText !== "string" || !plainText) continue;
      // Skip if default_content already contains HTML styling
      if (/<[^>]+(?:style|class)=/.test(plainText) || /<(?:b|strong|i|em|u|mark)\b/.test(plainText)) continue;
      const styledHtml = extractStyledFragment(htmlTemplate, plainText, classStyleMap);
      if (styledHtml) {
        result[field.field] = styledHtml;
      }
    }

    if (field.type === "repeater" && Array.isArray(getNestedValue(defaultContent, field.field))) {
      const items = getNestedValue(defaultContent, field.field) as any[];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || typeof item !== "object") continue;
        for (const sf of field.fields || []) {
          if (sf.type !== "text" && sf.type !== "textarea") continue;
          const plainText = item[sf.field];
          if (typeof plainText !== "string" || !plainText) continue;
          if (/<[^>]+(?:style|class)=/.test(plainText) || /<(?:b|strong|i|em|u|mark)\b/.test(plainText)) continue;
          const styledHtml = extractStyledFragment(htmlTemplate, plainText, classStyleMap);
          if (styledHtml) {
            result[`${field.field}.${i}.${sf.field}`] = styledHtml;
          }
        }
      }
    }
  }

  return result;
}

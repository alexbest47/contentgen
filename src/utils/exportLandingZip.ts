import JSZip from "jszip";

const BASE_PATH = "/talentsy-template/";

const CSS_FILES = [
  "css/fix.css",
  "css/fix-filippov.css",
  "css/landing.min.css",
  "css/style-hg8ap7v1d.css",
  "css/main.css",
];

const JS_FILES = [
  "js/jquery-3.6.4.min.js",
  "js/swiper-bundle.min.js",
  "js/vendor.js",
  "js/landing.min.js",
  "js/main.js",
];

/**
 * Export a fully rendered landing page as a self-contained ZIP
 * suitable for uploading to a web server.
 *
 * Structure mirrors production: external CSS/JS files with relative paths,
 * all images and fonts bundled alongside.
 */
export async function exportLandingAsZip(
  blockHtmls: string[],
  landingName: string
) {
  const zip = new JSZip();
  const baseUrl = window.location.origin + BASE_PATH;

  // ─── 1. Collect asset paths from block HTML ─────────────────────────────
  const assetPaths = new Set<string>();
  const allHtml = blockHtmls.join("\n");

  // Relative src/srcset references
  const srcRe = /(?:src|srcset)=["'](?!https?:\/\/|\/\/|data:|#)([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = srcRe.exec(allHtml)) !== null) assetPaths.add(m[1]);

  // CSS url() references inside style="" attributes in HTML
  const inlineStyleUrlRe = /url\(\s*['"]?(?!data:|https?:|\/\/)([^'")]+)['"]?\s*\)/g;
  while ((m = inlineStyleUrlRe.exec(allHtml)) !== null) assetPaths.add(m[1]);

  // ─── 2. Fetch CSS files, extract font/image paths, add to ZIP ──────────
  for (const cssFile of CSS_FILES) {
    try {
      const resp = await fetch(baseUrl + cssFile);
      if (!resp.ok) {
        console.warn(`[ZIP] CSS not found: ${cssFile}`);
        continue;
      }
      let css = await resp.text();

      // Extract url() references from CSS and add to assets
      const cssUrlRe = /url\(\s*['"]?(?!data:|https?:|\/\/)(\.\.\/|)(.*?)['"]?\s*\)/g;
      let cm: RegExpExecArray | null;
      while ((cm = cssUrlRe.exec(css)) !== null) {
        // Resolve to root-relative path
        const resolved = cm[1] ? cm[2] : "css/" + cm[2];
        assetPaths.add(resolved);
      }

      // CSS stays as-is — url() paths are already relative to the CSS file,
      // which is the correct behavior for a server deployment.
      zip.file(cssFile, css);
    } catch (e) {
      console.warn(`[ZIP] Error fetching CSS ${cssFile}:`, e);
    }
  }

  // ─── 3. Fetch JS files ──────────────────────────────────────────────────
  for (const jsFile of JS_FILES) {
    try {
      const resp = await fetch(baseUrl + jsFile);
      if (!resp.ok) continue;
      zip.file(jsFile, await resp.text());
    } catch {
      /* skip */
    }
  }

  // ─── 4. Fetch all binary assets (images, fonts) ─────────────────────────
  const fetchPromises: Promise<void>[] = [];

  const addedPaths = new Set<string>();
  for (const path of assetPaths) {
    const trimmed = path.trim();
    if (
      !trimmed ||
      trimmed.startsWith("http") ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("data:") ||
      addedPaths.has(trimmed)
    )
      continue;
    addedPaths.add(trimmed);

    fetchPromises.push(
      (async () => {
        try {
          const resp = await fetch(baseUrl + trimmed);
          if (!resp.ok) return;
          zip.file(trimmed, await resp.arrayBuffer());
        } catch {
          /* skip */
        }
      })()
    );
  }

  // Fetch uploaded images from Supabase Storage (absolute URLs)
  const supabaseRe =
    /(?:src|srcset)=["'](https:\/\/[^"']*supabase[^"']*landing-assets[^"']+)["']/g;
  const supabaseMap = new Map<string, string>();
  let uploadIdx = 0;
  while ((m = supabaseRe.exec(allHtml)) !== null) {
    const absUrl = m[1];
    if (supabaseMap.has(absUrl)) continue;
    const ext = absUrl.split(".").pop()?.split("?")[0] || "png";
    const localPath = `img/uploads/uploaded_${uploadIdx++}.${ext}`;
    supabaseMap.set(absUrl, localPath);
    fetchPromises.push(
      (async () => {
        try {
          const resp = await fetch(absUrl);
          if (!resp.ok) return;
          zip.file(localPath, await resp.arrayBuffer());
        } catch {
          /* skip */
        }
      })()
    );
  }

  // Also handle Supabase URLs inside style="" (background-image)
  const supabaseBgRe =
    /url\(\s*['"]?(https:\/\/[^'")]*supabase[^'")]*landing-assets[^'")\s]+)['"]?\s*\)/g;
  while ((m = supabaseBgRe.exec(allHtml)) !== null) {
    const absUrl = m[1];
    if (supabaseMap.has(absUrl)) continue;
    const ext = absUrl.split(".").pop()?.split("?")[0] || "png";
    const localPath = `img/uploads/uploaded_${uploadIdx++}.${ext}`;
    supabaseMap.set(absUrl, localPath);
    fetchPromises.push(
      (async () => {
        try {
          const resp = await fetch(absUrl);
          if (!resp.ok) return;
          zip.file(localPath, await resp.arrayBuffer());
        } catch {
          /* skip */
        }
      })()
    );
  }

  await Promise.all(fetchPromises);

  // ─── 5. Build index.html ─────────────────────────────────────────────────
  let combinedHtml = blockHtmls.join("\n\n");

  // Replace Supabase absolute URLs with local paths
  for (const [absUrl, localPath] of supabaseMap) {
    combinedHtml = combinedHtml.split(absUrl).join(localPath);
  }

  const cssLinks = CSS_FILES.map(
    (f) => `  <link rel="stylesheet" href="${f}" type="text/css" media="all" />`
  ).join("\n");

  const jsScripts = JS_FILES.map(
    (f) => `  <script src="${f}"><\/script>`
  ).join("\n");

  const indexHtml = `<!DOCTYPE html>
<html lang="ru-RU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="format-detection" content="telephone=no">
  <title>${escapeHtml(landingName)}</title>
  <style>
    img:is([sizes=auto i],[sizes^="auto," i]){contain-intrinsic-size:3000px 1500px}
    body { margin: 0; padding: 0; }
  </style>
${cssLinks}
</head>
<body>
<div class="wrapper">
${combinedHtml}
</div>
${jsScripts}
</body>
</html>`;

  zip.file("index.html", indexHtml);

  // ─── 6. Log & generate ──────────────────────────────────────────────────
  const files = Object.keys(zip.files);
  console.log(`[ZIP Export] Total files: ${files.length}`);
  console.log(
    "[ZIP Export] CSS:",
    files.filter((f) => f.match(/\.css$/)).length
  );
  console.log(
    "[ZIP Export] JS:",
    files.filter((f) => f.match(/\.js$/)).length
  );
  console.log(
    "[ZIP Export] Fonts:",
    files.filter((f) => f.match(/\.(woff2?|ttf|eot)$/)).length
  );
  console.log(
    "[ZIP Export] Images:",
    files.filter((f) => f.match(/\.(png|jpe?g|svg|gif|webp)$/)).length
  );

  const uint8 = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  if (uint8.length < 4 || uint8[0] !== 0x50 || uint8[1] !== 0x4b) {
    throw new Error("Generated ZIP has invalid magic bytes");
  }
  console.log(`[ZIP Export] Generated ${uint8.length} bytes ✓`);

  const blob = new Blob([uint8], { type: "application/zip" });
  const safeName =
    transliterate(landingName).substring(0, 60) || "landing";
  downloadBlob(blob, `${safeName}.zip`);
}

function transliterate(str: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
    А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo", Ж: "Zh",
    З: "Z", И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O",
    П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "Kh", Ц: "Ts",
    Ч: "Ch", Ш: "Sh", Щ: "Sch", Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu",
    Я: "Ya",
  };
  return str
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { useState, useEffect } from "react";
import { buildClassStyleMap } from "@/lib/extractStyledValues";

const CSS_FILES = [
  "css/fix.css",
  "css/fix-filippov.css",
  "css/landing.min.css",
  "css/style-hg8ap7v1d.css",
  "css/main.css",
];

const BASE_PATH = "/talentsy-template/";

let _cachedMap: Record<string, string> | null = null;
let _fetchPromise: Promise<Record<string, string>> | null = null;

async function fetchAndBuildMap(): Promise<Record<string, string>> {
  if (_cachedMap) return _cachedMap;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    const baseUrl = window.location.origin + BASE_PATH;
    const results = await Promise.all(
      CSS_FILES.map(async (file) => {
        try {
          const resp = await fetch(baseUrl + file);
          if (!resp.ok) return "";
          return resp.text();
        } catch {
          return "";
        }
      }),
    );
    const allCss = results.join("\n");
    _cachedMap = buildClassStyleMap(allCss);
    return _cachedMap;
  })();

  return _fetchPromise;
}

/**
 * Hook that returns a mapping of CSS class names → inline style strings.
 * Used for converting template CSS classes to inline styles in the editor.
 */
export function useCssClassMap(): Record<string, string> | null {
  const [map, setMap] = useState<Record<string, string> | null>(_cachedMap);

  useEffect(() => {
    if (_cachedMap) {
      setMap(_cachedMap);
      return;
    }
    fetchAndBuildMap().then(setMap);
  }, []);

  return map;
}

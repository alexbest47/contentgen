import { useSearchParams } from "react-router-dom";

export type ContentFormat = "post" | "carousel" | null;

export function useContentFormat(): { format: ContentFormat; suffix: string; label: string } {
  const [params] = useSearchParams();
  const raw = params.get("format");
  const format: ContentFormat = raw === "post" || raw === "carousel" ? raw : null;
  const suffix = format ? `?format=${format}` : "";
  const label = format === "post" ? "Создание поста" : format === "carousel" ? "Создание карусели" : "Создание контента";
  return { format, suffix, label };
}

export function appendFormat(url: string, format: ContentFormat): string {
  if (!format) return url;
  return url + (url.includes("?") ? "&" : "?") + `format=${format}`;
}

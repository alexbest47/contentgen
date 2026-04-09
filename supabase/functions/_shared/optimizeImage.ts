// @ts-nocheck
// Shared image optimizer for email letters and landing pages.
// Downscales to maxWidth and re-encodes as JPEG to drastically reduce weight.
// Does NOT touch post/carousel/banner/bot-message images.
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

export interface OptimizedImage {
  bytes: Uint8Array;
  contentType: string;
  ext: "jpg" | "png";
}

export async function optimizeImage(
  input: Uint8Array,
  opts: { maxWidth?: number; quality?: number } = {},
): Promise<OptimizedImage> {
  const maxWidth = opts.maxWidth ?? 1200;
  const quality = opts.quality ?? 85;
  try {
    const img = await Image.decode(input);
    if (img.width > maxWidth) {
      img.resize(maxWidth, Image.RESIZE_AUTO);
    }
    const out = await img.encodeJPEG(quality);
    return { bytes: out, contentType: "image/jpeg", ext: "jpg" };
  } catch (e) {
    console.error("optimizeImage failed, falling back to original:", e);
    return { bytes: input, contentType: "image/png", ext: "png" };
  }
}

// Convenience: optimize a data URL and return a new data URL
export async function optimizeDataUrl(dataUrl: string, opts?: { maxWidth?: number; quality?: number }): Promise<string> {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) return dataUrl;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const opt = await optimizeImage(bytes, opts);
  let b = "";
  for (let i = 0; i < opt.bytes.length; i++) b += String.fromCharCode(opt.bytes[i]);
  return `data:${opt.contentType};base64,${btoa(b)}`;
}

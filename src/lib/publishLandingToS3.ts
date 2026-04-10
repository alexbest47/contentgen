import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";

export function normalizePublishedLandingPath(path: string): string {
  return path
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

export async function publishLandingToS3(input: {
  landingId: string;
  path: string;
  html: string;
}) {
  const normalizedPath = normalizePublishedLandingPath(input.path);

  if (!normalizedPath) {
    throw new Error("Заполните поле URL для публикации");
  }

  const data = await invokeEdgeFunction<{
    id: string;
    path: string;
    url: string;
    landing_id: string;
  }>("publish-s3-landing", {
      landing_id: input.landingId,
      path: normalizedPath,
      html: input.html,
  });
  return data;
}

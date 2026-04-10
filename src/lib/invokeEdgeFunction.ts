import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function invokeEdgeFunction<TResponse>(name: string, body: unknown): Promise<TResponse> {
  const accessToken = await getFreshAccessToken();

  if (!accessToken) {
    throw new Error("Не найдена активная сессия пользователя");
  }

  let response = await doFetch(name, body, accessToken);

  const rawText = await response.text();
  const parsed = rawText ? tryParseJson(rawText) : null;

  if (!response.ok && response.status === 401 && extractErrorMessage(parsed, rawText) === "Invalid JWT") {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken && refreshedAccessToken !== accessToken) {
      response = await doFetch(name, body, refreshedAccessToken);
      const retryRawText = await response.text();
      const retryParsed = retryRawText ? tryParseJson(retryRawText) : null;

      if (!response.ok) {
        throw new Error(extractErrorMessage(retryParsed, retryRawText));
      }

      return (retryParsed as TResponse) ?? ({} as TResponse);
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(parsed, rawText));
  }

  return (parsed as TResponse) ?? ({} as TResponse);
}

async function getFreshAccessToken(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentAccessToken = sessionData.session?.access_token ?? null;

  if (currentAccessToken) {
    return currentAccessToken;
  }

  return await refreshAccessToken();
}

async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    return null;
  }
  return data.session?.access_token ?? null;
}

async function doFetch(name: string, body: unknown, accessToken: string): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}

function extractErrorMessage(parsed: unknown, rawText: string): string {
  return (
    (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string" && parsed.error) ||
    (parsed && typeof parsed === "object" && "message" in parsed && typeof parsed.message === "string" && parsed.message) ||
    rawText ||
    "Ошибка вызова Edge Function"
  );
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

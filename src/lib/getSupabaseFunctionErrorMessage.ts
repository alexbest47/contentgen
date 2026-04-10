export async function getSupabaseFunctionErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== "object") {
    return "Ошибка вызова функции";
  }

  const maybeMessage = (error as { message?: unknown }).message;
  const maybeContext = (error as { context?: Response }).context;

  if (maybeContext && typeof maybeContext.text === "function") {
    try {
      const rawText = await maybeContext.text();
      if (!rawText) {
        return typeof maybeMessage === "string" && maybeMessage ? maybeMessage : "Ошибка вызова функции";
      }

      try {
        const parsed = JSON.parse(rawText) as { error?: string; message?: string };
        if (parsed.error) return parsed.error;
        if (parsed.message) return parsed.message;
      } catch {
        return rawText;
      }
    } catch {
      // ignore and fallback to message below
    }
  }

  if (typeof maybeMessage === "string" && maybeMessage) {
    return maybeMessage;
  }

  return "Ошибка вызова функции";
}



## Задача

Убрать Lovable AI Gateway из генерации изображений в `generate-email-letter`, использовать только OpenRouter.

## Изменение

### `supabase/functions/generate-email-letter/index.ts` (строки 51-55)

Удалить проверку `LOVABLE_API_KEY` и всегда использовать OpenRouter:

```ts
// Было:
const lovableKey = Deno.env.get("LOVABLE_API_KEY");
const imgApiKey = lovableKey || openrouterKey;
const imgApiUrl = lovableKey
  ? "https://ai.gateway.lovable.dev/v1/chat/completions"
  : "https://openrouter.ai/api/v1/chat/completions";

// Станет:
const imgApiKey = openrouterKey;
const imgApiUrl = "https://openrouter.ai/api/v1/chat/completions";
```

Один файл, 3 строки заменяются на 2.


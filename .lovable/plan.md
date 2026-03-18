

## Вернуть generate-lead-magnets на Anthropic API

### Изменения в `supabase/functions/generate-lead-magnets/index.ts`

**1. Строки 24-25** — заменить `LOVABLE_API_KEY` на `ANTHROPIC_API_KEY`:
```typescript
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
```

**2. Строки 167-191** — заменить вызов Lovable AI Gateway на Anthropic API:
- URL: `https://api.anthropic.com/v1/messages`
- Заголовки: `x-api-key`, `anthropic-version: 2023-06-01`
- Формат body: `{ model, max_tokens: 64000, system, messages: [{role:"user", content}] }`
- Парсинг ответа: `claudeData.content?.[0]?.text` вместо `choices[0].message.content`

Один файл, точечная замена двух блоков.


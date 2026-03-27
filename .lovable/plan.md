

## Исправить зависание очереди при таймауте Edge Function

### Проблема
Edge Function `generate-email-letter` (режим генерации изображений через OpenRouter) упала по таймауту (~150с). Функция не успела вызвать `failTask()`, и задача осталась в статусе `processing` навсегда (до 10-минутного watchdog). Все pending-задачи в линии `openrouter` заблокированы.

### Решение — 2 изменения

**1. Уменьшить watchdog-таймаут с 10 до 3 минут**

В `process-queue/index.ts`: изменить `10 * 60 * 1000` → `3 * 60 * 1000`. Edge Functions имеют таймаут ~150с, поэтому если задача в processing > 3 минут — она точно зависла.

**2. Добавить AbortController с таймаутом в generate-email-letter (режим изображений)**

При генерации изображения через OpenRouter — ограничить fetch до 120с. Если таймаут — вызвать `failTask()` и вернуть ошибку. Это гарантирует, что задача будет помечена как `error` до того, как Edge Function убьётся платформой.

```ts
// В generate-email-letter, в блоке генерации изображения:
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 120000);
try {
  const resp = await fetch(openrouterUrl, { ...opts, signal: controller.signal });
  // ...
} finally {
  clearTimeout(timeout);
}
```

Аналогично добавить в `generate-email-block/index.ts` для режима изображений.

### Файлы
- `supabase/functions/process-queue/index.ts` — watchdog 10 мин → 3 мин
- `supabase/functions/generate-email-letter/index.ts` — AbortController 120с для image fetch
- `supabase/functions/generate-email-block/index.ts` — AbortController 120с для image fetch


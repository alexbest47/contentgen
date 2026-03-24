

## Исправление потери результата генерации при таймауте

### Проблема

Edge-функция `generate-email-letter` получает таймаут в момент финализации. Функция `completeTask` создаёт свежий Supabase-клиент и успевает обновить `task_queue`, но обновление `email_letters` через основной клиент `sb` обрывается вместе с HTTP-соединением.

Результат: задача «Завершена», но письмо пустое.

### Решение

Перенести обновление `email_letters` внутрь `completeTask` (или выполнять через свежий клиент до вызова `completeTask`), чтобы оба обновления происходили атомарно через один свежий клиент.

### Изменения

#### 1. `generate-email-letter/index.ts` — строки 342-353

Заменить:
```typescript
// Текущий код (две раздельные операции):
await sb.from("email_letters").update(updatePayload).eq("id", letter_id);  // ← обрывается
if (taskId) await completeTask(taskId, responseData);                       // ← успевает
```

На:
```typescript
// Новый код: свежий клиент для обоих обновлений
const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
await freshSb.from("email_letters").update(updatePayload).eq("id", letter_id);
if (taskId) await completeTask(taskId, responseData);
```

Это гарантирует, что обновление `email_letters` выполняется через тот же механизм, что и `completeTask` — свежий клиент, не привязанный к HTTP-соединению запроса.

#### 2. Аналогичное исправление во всех edge-функциях с `completeTask`

Проверить и при необходимости исправить тот же паттерн в:
- `generate-email-block/index.ts`
- `generate-pipeline/index.ts`
- `generate-content/index.ts`
- `generate-lead-magnets/index.ts`
- `generate-pdf-material/index.ts`

### Итого
- ~6 edge-функций — замена клиента перед финальным сохранением
- Без миграций, без изменений фронтенда


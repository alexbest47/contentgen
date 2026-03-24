

## Исправление таймаута 504 в очереди задач

### Проблема

`process-queue` вызывает целевую edge-функцию через `fetch()` и **ждёт ответа**. Edge-функции имеют лимит ~150 секунд. Если `generate-email-letter` или `generate-pipeline` работает дольше — `process-queue` получает 504 от платформы, помечает задачу как `error`, хотя целевая функция может ещё работать.

```text
process-queue ──fetch──► generate-email-letter ──fetch──► Claude API
     │                        │
     │  ← 504 (150s limit)    │  ← ещё работает...
     │                        │
     └─ marks task "error"    └─ завершается, но результат потерян
```

### Решение: fire-and-forget + self-update

Целевые функции сами обновляют `task_queue` по завершении. `process-queue` не ждёт ответа.

```text
process-queue ──fetch (fire-and-forget)──► generate-email-letter
     │                                         │
     │  ← возвращается сразу                   │
     │                                         ├─► Claude API (долго)
     │                                         ├─► UPDATE task_queue → completed
     │                                         └─► POST process-queue (chain)
```

### Изменения

#### 1. `process-queue/index.ts` — fire-and-forget

Вместо `await fetch(...)` и ожидания ответа:
- Добавить в payload задачи поле `_task_id` с id текущей задачи
- Вызвать fetch **без await** (fire-and-forget)
- Сразу вернуть ответ, не дожидаясь завершения целевой функции
- Убрать блок try/catch с пометкой completed/error — это теперь делает сама функция
- Добавить **watchdog**: если задача в статусе `processing` более 10 минут — помечать как `error` (защита от зависших задач)

#### 2. Каждая целевая edge-функция — self-update

В каждую из ~12 функций добавить в конце логику:
- Если в payload есть `_task_id` — обновить `task_queue` (status: completed/error, result, error_message)
- Вызвать `process-queue` (fire-and-forget) для продолжения цепочки

Затронутые функции:
- `generate-email-letter`
- `generate-email-block`
- `generate-pipeline`
- `generate-pipeline-images`
- `generate-lead-magnets`
- `generate-content`
- `generate-image`
- `generate-pdf-material`
- `generate-diagnostic` / `run-diagnostic-pipeline`
- `generate-diagnostic-images` / `process-diagnostic-image`
- `generate-card-prompt`
- `refine-prompt`

#### 3. Хелпер для DRY

Создать общий паттерн (inline в каждой функции, т.к. shared imports не поддерживаются):

```typescript
// В конце каждой функции, перед return:
if (taskId) {
  const sb = createClient(supabaseUrl, serviceKey);
  await sb.from("task_queue").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    result: { success: true, /* данные */ },
  }).eq("id", taskId);
  // Chain next task
  fetch(`${supabaseUrl}/functions/v1/process-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ trigger: true }),
  }).catch(() => {});
}
```

И в catch:
```typescript
if (taskId) {
  await sb.from("task_queue").update({
    status: "error",
    completed_at: new Date().toISOString(),
    error_message: err.message?.substring(0, 2000),
  }).eq("id", taskId);
}
```

#### 4. Watchdog в `process-queue`

Перед обработкой новых задач — проверять зависшие:

```typescript
// Reset stuck tasks (processing > 10 min)
await supabase.from("task_queue")
  .update({ status: "error", error_message: "Timeout: task exceeded 10 minutes" })
  .eq("status", "processing")
  .lt("started_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
```

### Порядок реализации

1. Обновить `process-queue` (fire-and-forget + watchdog)
2. Обновить все целевые функции (self-update по `_task_id`)
3. Передеплоить все функции

### Итого
- 1 функция переписана (`process-queue`)
- ~12 функций дополнены блоком self-update
- 0 миграций
- 0 изменений фронтенда


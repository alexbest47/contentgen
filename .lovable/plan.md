

## Исправить ошибку компиляции generate-email-letter и поведение «Повторить»

### Проблема 1: Таймаут из-за ошибки компиляции

В файле `supabase/functions/generate-email-letter/index.ts` строки 190-194 содержат дублирование переменных `templateId` и `selectedObjectionIds`. При добавлении `imageStyleId` строки были вставлены перед существующими вместо замены:

```text
190: const templateId = letter.template_id;          // первое объявление
191: const selectedObjectionIds = ...                 // первое объявление  
192: const imageStyleId = (letter as any).image_style_id;  // ← добавлено
193: const templateId = letter.template_id;          // ← ДУБЛИКАТ
194: const selectedObjectionIds = ...                // ← ДУБЛИКАТ
```

Deno отказывается загружать функцию → задача зависает → через 10 мин watchdog ставит timeout.

**Исправление**: удалить строки 193-194 (дубликаты).

### Проблема 2: Кнопка «Повторить» создаёт новую задачу

Текущий `handleRetry` вызывает `enqueue()` — это by design создаёт новую запись. Для истинного повтора нужно:

**`src/pages/TaskQueue.tsx`**: изменить `handleRetry` — вместо `enqueue()` сбрасывать существующую задачу в статус `pending` напрямую через update в `task_queue`, а затем триггерить `process-queue`.

```text
handleRetry(task):
  1. UPDATE task_queue SET status='pending', started_at=null, 
     completed_at=null, error_message=null WHERE id=task.id
  2. POST /functions/v1/process-queue {trigger: true}
```

### Файлы
- `supabase/functions/generate-email-letter/index.ts` — удалить дубликаты строк 193-194
- `src/pages/TaskQueue.tsx` — переписать `handleRetry` на сброс существующей задачи


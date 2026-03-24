

## Глобальная очередь задач

### Архитектура

```text
Frontend                    Backend
────────                    ───────
Кнопка "Генерировать"       
  │                         
  ├─► enqueue-task ──► INSERT task_queue (pending)
  │                         │
  │                    process-queue (self-chaining)
  │                         ├─► lane "claude": 1 задача
  │                         └─► lane "openrouter": 1 задача
  │                              │
  │                         Вызывает оригинальную edge-функцию
  │                         Обновляет статус → completed/error
  │                         Если есть ещё задачи → вызывает себя
  │                         
  └─► Страница "Очередь" (polling / realtime)
```

Две параллельные линии: `claude` (текст) и `openrouter` (картинки). В каждой линии выполняется строго одна задача.

### Изменения

#### 1. Миграция — таблица `task_queue`

```sql
CREATE TABLE task_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  lane text NOT NULL,           -- 'claude' или 'openrouter'
  status text NOT NULL DEFAULT 'pending',  -- pending/processing/completed/error
  function_name text NOT NULL,  -- имя edge-функции
  payload jsonb NOT NULL DEFAULT '{}',
  result jsonb,
  error_message text,
  display_title text NOT NULL DEFAULT '',
  priority integer NOT NULL DEFAULT 0
);

ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;
-- Все аутентифицированные видят очередь
-- Вставка по auth.uid() = created_by
-- Обновление/удаление для owner или admin
ALTER PUBLICATION supabase_realtime ADD TABLE task_queue;
```

#### 2. Edge-функция `enqueue-task`

- Принимает `{ function_name, payload, display_title, lane }`
- Вставляет строку в `task_queue` со статусом `pending`
- Fire-and-forget вызывает `process-queue`
- Возвращает `{ task_id }`

#### 3. Edge-функция `process-queue` (воркер)

- Выбирает по одной задаче `pending` из каждой линии (ORDER BY priority DESC, created_at ASC)
- Помечает как `processing`, ставит `started_at`
- Вызывает оригинальную edge-функцию через HTTP (тот же Supabase URL)
- При успехе → `completed`, при ошибке → `error` + `error_message`
- Если есть ещё `pending` задачи → self-chain (вызывает себя)
- Защита от дублирования: UPDATE ... WHERE status = 'pending' RETURNING (атомарный захват)

#### 4. Cron-fallback (pg_cron)

- Каждую минуту вызывает `process-queue` — страховка, если self-chain оборвалась

#### 5. Страница «Очередь» (`/queue`)

- Добавить в сайдбар первым пунктом (иконка `ListOrdered`)
- Доступна всем пользователям
- Таблица: название задачи, статус (badge), время создания, время выполнения, ошибка
- Realtime-подписка на `task_queue` для live-обновлений
- Фильтры: все / в очереди / выполняются / завершено / ошибки
- Кнопка «Повторить» для задач с ошибкой

#### 6. Миграция frontend — замена прямых вызовов на enqueue

Все `supabase.functions.invoke(...)` для AI-генерации заменяются на вызов `enqueue-task`. Затронутые файлы:

| Файл | Вызовы | Lane |
|------|--------|------|
| `OfferDetail.tsx` | generate-lead-magnets | claude |
| `ProjectDetail.tsx` | generate-lead-magnets, generate-pipeline | claude |
| `ContentDetail.tsx` | generate-pipeline, generate-pipeline-images | claude / openrouter |
| `EmailBuilder.tsx` | generate-email-block (×2), generate-email-letter (×2) | claude / openrouter |
| `DiagnosticDetail.tsx` | run-diagnostic-pipeline | claude |
| `Diagnostics.tsx` | run-diagnostic-pipeline | claude |
| `PdfMaterialView.tsx` | generate-pdf-material | claude |
| `CreatePdfWizard.tsx` | generate-pdf-material | claude |
| `GeneratedBlockSettings.tsx` | generate-lead-magnets (×2) | claude |
| `RefinePromptDialog.tsx` | refine-prompt | claude |

**Не затрагиваются** (не AI-генерация): `generate-project-name`, `import-prompts-txt`, `fetch-google-doc`, `scan-case-folder`, `transcribe-case-file`, `deepgram-callback`.

Каждый вызов заменяется на:
```typescript
const { data } = await supabase.functions.invoke("enqueue-task", {
  body: {
    function_name: "generate-pipeline",
    payload: { project_id, content_type },
    display_title: "Генерация контента: ...",
    lane: "claude",
  },
});
// toast("Задача добавлена в очередь")
```

UI-компоненты переходят на polling/realtime для отслеживания результата вместо ожидания ответа.

#### 7. Хелпер `useTaskQueue`

React-хук для:
- Постановки задачи в очередь
- Подписки на статус конкретной задачи (realtime)
- Показа toast при завершении/ошибке

### Порядок реализации

1. Миграция БД + RLS
2. `enqueue-task` + `process-queue` edge-функции
3. Страница «Очередь» + маршрут + сайдбар
4. Хук `useTaskQueue`
5. Постепенная замена вызовов во frontend (по файлам)
6. pg_cron fallback

### Итого
- 1 миграция
- 2 новые edge-функции
- 1 новая страница + маршрут
- 1 хук
- ~10 файлов frontend модифицированы


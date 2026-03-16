

## Классификация кейсов после транскрибации

### Архитектура

После получения транскрипции в `deepgram-callback`, система ставит файл в очередь на классификацию. Новая edge-функция `classify-case` берёт из очереди по одному файлу, отправляет в Claude API с промптом из БД, сохраняет результат в новую таблицу `case_classifications`.

```text
deepgram-callback                classify-case
    │                                │
    ├─ Сохраняет транскрипт          │
    ├─ Ставит status = "classifying" │
    ├─ Вызывает classify-case ───────┤
    │                                ├─ Проверяет: нет ли уже
    │                                │  активной классификации?
    │                                ├─ Берёт промпт из БД
    │                                ├─ Отправляет в Claude API
    │                                ├─ Сохраняет JSON в
    │                                │  case_classifications
    │                                ├─ Ставит status = "classified"
    │                                └─ Берёт следующий файл
    │                                   со status = "classifying"
```

### Изменения

**1. Миграция: таблица `case_classifications`**
```sql
CREATE TABLE public.case_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.case_jobs(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  source_url text,          -- ссылка на исходный файл на Яндекс.Диске
  classification_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
+ RLS: authenticated SELECT, admin INSERT/UPDATE/DELETE
+ Обновить статусы в `case_files`: добавить `classifying` и `classified`

**2. Новая edge-функция: `classify-case`**
- Принимает `{ file_id, job_id }`
- Проверяет очередь: если уже есть файл в статусе `classifying` (кроме текущего) — не запускает (очередь из 1)
- Загружает промпт из `prompts` по `content_type = 'case_analysis'`, `is_active = true`
- Подставляет `{{transcript_text}}` в `user_prompt_template`
- Вызывает Anthropic API с `system_prompt` и подготовленным user prompt
- Парсит JSON-ответ
- Сохраняет в `case_classifications`
- Обновляет `case_files.status = "classified"`
- Ищет следующий файл со статусом `classifying` → self-chain

**3. Изменить `deepgram-callback`**
- После сохранения транскрипта: ставить `status = "classifying"` вместо `completed`
- Вызывать `classify-case` вместо `transcribe-case-file` для следующего шага
- Продолжать цепочку транскрибации параллельно (следующий pending файл)

**4. UI: две вкладки на странице `CaseManagement.tsx`**
- **Вкладка «Задачи»** — текущий контент (форма + список задач)
- **Вкладка «Результаты классификации»** — таблица:
  - Имя файла
  - Ссылка на видео (source_url)
  - summary, video_type, products, emotional_tone, student_name, quote, tags
  - Кнопка просмотра полного JSON
  - Дата

**5. Обновить STATUS_MAP в UI**
- `classifying` → «Классификация...» + иконка
- `classified` → «Классифицировано» + иконка

### Очередь классификации

Механизм очереди без отдельного сервиса: `classify-case` при старте проверяет, есть ли другой файл в статусе `classifying` (обрабатываемый прямо сейчас). Если да — просто выходит, текущий обработчик подберёт этот файл после завершения своей работы (self-chain). Это гарантирует max 1 параллельный запрос к Claude.

### Файлы
- Миграция SQL (таблица + RLS)
- `supabase/functions/classify-case/index.ts` (новая)
- `supabase/functions/deepgram-callback/index.ts` (изменить)
- `supabase/config.toml` (добавить classify-case)
- `src/pages/CaseManagement.tsx` (две вкладки + таблица результатов)


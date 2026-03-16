

## Добавление раздела «Управление кейсами» — транскрибация видео из Яндекс.Диска

### Обзор

Новый раздел в администрировании. Пользователь вставляет публичную ссылку на папку Яндекс.Диска — система автоматически находит все видеофайлы, скачивает их и транскрибирует через Deepgram API. Результат: текст + JSON с таймкодами для каждого видео.

### Архитектура

Edge-функции имеют таймаут ~60 сек, поэтому обработка разбита на 2 этапа с self-chaining (как в существующих пайплайнах):

```text
[UI: ввод ссылки] 
    → scan-case-folder (сканирует папку, создаёт записи файлов)
    → transcribe-case-file (обрабатывает 1 файл, вызывает себя для следующего)
```

### 0. Секрет Deepgram

Запросить у пользователя `DEEPGRAM_API_KEY` через `add_secret`.

### 1. Миграция БД — 2 таблицы

**`case_jobs`** — задачи на обработку папки:
- `id`, `folder_url`, `status` (pending/processing/completed/error), `error_message`, `created_by`, `created_at`

**`case_files`** — отдельные видеофайлы:
- `id`, `job_id` (FK → case_jobs), `file_path`, `file_name`, `file_size`, `status` (pending/downloading/transcribing/completed/error), `error_message`, `transcript_text`, `transcript_json` (jsonb — таймкоды), `download_url`, `resource_id` (уникальный идентификатор файла на Я.Диске — защита от дубликатов), `created_at`
- Unique constraint на `(job_id, resource_id)` для защиты от повторной обработки

RLS: владелец + админ — CRUD. Authenticated — SELECT.

### 2. Edge Function: `scan-case-folder`

- Принимает `{ folder_url }` + auth
- Извлекает public_key из URL
- Вызывает `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=...&limit=100&offset=0`
- Рекурсивно обходит подпапки
- Фильтрует по расширениям: mp4, mov, mkv, avi, webm
- Создаёт запись в `case_jobs` (status: processing)
- Создаёт записи в `case_files` (status: pending)
- Вызывает `transcribe-case-file` для первого файла

### 3. Edge Function: `transcribe-case-file`

- Принимает `{ job_id, file_id }`
- Получает download URL через `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=...&path=...`
- Скачивает видео (redirect → бинарные данные)
- Отправляет в Deepgram: `POST https://api.deepgram.com/v1/listen?model=nova-2&language=ru&punctuate=true&utterances=true`
- Сохраняет `transcript_text` и `transcript_json` в `case_files`
- Self-chains: находит следующий pending файл в job → вызывает себя
- Когда файлов не осталось → обновляет `case_jobs.status = completed`
- При ошибке: помечает файл как error, продолжает с остальными

### 4. UI: страница `src/pages/CaseManagement.tsx`

- Форма ввода ссылки на папку + кнопка «Начать обработку»
- Список задач (case_jobs) с прогрессом: X из Y файлов обработано
- Раскрытие задачи → список файлов со статусами
- Для завершённых файлов: кнопка «Показать транскрипцию» → диалог с текстом
- Кнопка копирования текста

### 5. Навигация

- `AppSidebar.tsx`: добавить `{ title: "Управление кейсами", url: "/cases", icon: FileVideo }` в `adminNav`
- `App.tsx`: добавить роут `/cases` с `adminOnly`

### 6. Конфигурация

- `supabase/config.toml`: добавить обе функции с `verify_jwt = false`

### Итого: 2 таблицы + 2 edge functions + 1 страница + навигация + 1 секрет

**Файлы:**
- Миграция: таблицы `case_jobs`, `case_files` + RLS
- `supabase/functions/scan-case-folder/index.ts`
- `supabase/functions/transcribe-case-file/index.ts`
- `src/pages/CaseManagement.tsx`
- `src/components/AppSidebar.tsx`
- `src/App.tsx`
- `supabase/config.toml`


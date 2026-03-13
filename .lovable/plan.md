

## Диагностика проблем и перенос генерации на бэкэнд

### Причина провала изображений

Все 12 запросов к `generate-diagnostic-images` возвращают `200` с `image_url: null`. Ошибка в вызове OpenRouter: **отсутствует `modalities: ["image", "text"]`** в теле запроса. Без этого параметра модель `google/gemini-3-pro-image-preview` не возвращает изображения. Также функции `generate-diagnostic` и `generate-diagnostic-images` отсутствуют в `supabase/config.toml`.

### План: перенос всего процесса на бэкэнд + исправление

Вместо точечного фикса предлагаю сразу реализовать полный перенос на бэкэнд — это решает обе задачи.

#### 1. Исправить `generate-diagnostic-images/index.ts`
- Добавить `modalities: ["image", "text"]` в тело запроса к OpenRouter
- Исправить парсинг ответа: изображения в формате `images[0].image_url.url` (вложенный объект), а не `images[0].image_url`

#### 2. Создать новую edge-функцию `run-diagnostic-pipeline/index.ts`
Единый оркестратор, который выполняет весь процесс:
- Вызывает Claude для генерации JSON (копирует логику из `generate-diagnostic`)
- Извлекает плейсхолдеры `{{IMAGE:PROMPT=...}}`
- Обновляет статус диагностики: `generating` → `quiz_generated` → `generating_images` → `ready`/`error`
- Последовательно генерирует каждое изображение (вызывает `generateImage` напрямую, без HTTP-вызова другой функции)
- После каждого изображения обновляет `quiz_json` в БД (позволяет фронтенду видеть прогресс)
- Заменяет оставшиеся плейсхолдеры на `null`, сохраняет финальный JSON, ставит статус `ready`

#### 3. Добавить в `supabase/config.toml`
```toml
[functions.generate-diagnostic]
verify_jwt = false

[functions.generate-diagnostic-images]
verify_jwt = false

[functions.run-diagnostic-pipeline]
verify_jwt = false
```

#### 4. Обновить `src/pages/DiagnosticDetail.tsx`
- `handleGenerate` теперь: обновляет статус → вызывает `run-diagnostic-pipeline` (fire-and-forget через `fetch` без await на ответ) → запускает поллинг
- Поллинг: каждые 5 секунд запрашивает `diagnostics` по id, проверяет `status`:
  - `generating` → шаг 1 активен
  - `quiz_generated` → шаг 1 готов, шаг 2 активен
  - `generating_images` → шаг 2 активен (можно показать прогресс по количеству оставшихся плейсхолдеров в `quiz_json`)
  - `ready` → всё готово, останавливает поллинг
  - `error` → показывает ошибку
- При заходе на страницу: если статус `generating`/`quiz_generated`/`generating_images` — автоматически запускает поллинг (пользователь может уйти и вернуться)
- Убрать весь клиентский код оркестрации (цикл по плейсхолдерам, вызовы `generate-diagnostic-images`)

#### 5. Добавить поле `generation_progress` в таблицу `diagnostics`
Миграция: `ALTER TABLE diagnostics ADD COLUMN generation_progress jsonb DEFAULT null`
Формат: `{ "total_images": 12, "completed_images": 3 }` — обновляется оркестратором после каждого изображения.

```text
Итоговый флоу:

Фронтенд                          Бэкэнд (run-diagnostic-pipeline)
─────────                          ──────────────────────────────────
POST fire-and-forget ──────────▶  Получает запрос
Поллинг каждые 5 сек               │
  │                                 ├─ Claude API → quiz_json
  │                                 ├─ status = quiz_generated
  │                                 ├─ Цикл: генерация изображений
  │                                 │   ├─ OpenRouter + modalities
  │                                 │   ├─ Upload → Storage
  │                                 │   └─ UPDATE generation_progress
  │                                 ├─ Финальный JSON → БД
  │                                 └─ status = ready
  │
  └── Видит прогресс, может
      уйти и вернуться
```


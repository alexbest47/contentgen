

## Перенос генерации изображений на сервер

### Проблема

Генерация изображений выполняется на фронтенде (`DiagnosticDetail.tsx`, функция `startImageGeneration`). Если пользователь уходит со страницы — процесс прерывается. Это противоречит идее полностью серверного пайплайна.

### Решение

#### 1. `supabase/functions/run-diagnostic-pipeline/index.ts`

После Step 1 (quiz) и Step 1.5 (card prompt), вместо установки `images_pending` и остановки — добавить **Step 2: цикл генерации изображений** прямо в этой же функции:

- Установить статус `generating_images`
- Для каждого плейсхолдера `{{IMAGE:PROMPT=...}}`:
  - Проверить отмену (`checkCancelled`)
  - Вызвать `generateImage(prompt, OPENROUTER_API_KEY)` (скопировать логику из `generate-diagnostic-images`)
  - Загрузить в Storage `quiz-images/{diagnostic_id}/image_{i}_{timestamp}.webp`
  - Получить публичный URL
  - Заменить плейсхолдер в quiz JSON строке на URL
  - Обновить `generation_progress.completed_images` в БД
- После цикла: сохранить финальный `quiz_json` с реальными URL, статус `ready`
- При ошибке отдельной картинки: инкрементировать счётчик ошибок, продолжать цикл

#### 2. `src/pages/DiagnosticDetail.tsx`

- **Удалить** функцию `startImageGeneration` и `imageGenRef`
- **Удалить** ветку polling для `images_pending` → `startImageGeneration`
- **Удалить** ветку в `useEffect` для `images_pending`/`generating_images` → `startImageGeneration`
- Polling остаётся только для отображения прогресса (статус, `completed_images / total_images`)
- Polling останавливается при `ready` или `error`

#### 3. `supabase/functions/generate-diagnostic-images/index.ts`

- Оставить как есть (может пригодиться для ручной перегенерации одной картинки), либо удалить — на ваш выбор

### Итог

Весь процесс: quiz → card prompt → изображения → ready — выполняется в одном серверном вызове. Фронтенд только показывает прогресс через polling.


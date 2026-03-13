
Причину нашёл. Генерация изображений фактически стартует, но фронтенд-процесс падает после первого успешного ответа и больше не продолжает цикл.

1) Что уже проверено (факты)
- `run-diagnostic-pipeline` отрабатывает корректно: статус переходит в `images_pending`, плейсхолдеры сохраняются.
- Вызов `generate-diagnostic-images` из UI реально проходит с `200` и возвращает `image_url`.
- В storage появляются файлы `quiz-images/.../image_0_...webp` (то есть картинка генерируется и загружается).
- Но запись `diagnostics` остаётся в `generating_images`, `completed_images = 0`, и в `quiz_json` остаются все `{{IMAGE:PROMPT=...}}`.

2) Корневая причина
В `src/pages/DiagnosticDetail.tsx` после каждого изображения есть строка:
`JSON.parse(currentQuizString.replace(/\{\{IMAGE:PROMPT=[^}]*\}\}/g, '"null"'))`

Проблема: плейсхолдер находится внутри JSON-строки (`"image":"{{IMAGE:PROMPT=...}}"`), а замена на `"null"` даёт невалидный JSON (`"image":""null""`), из-за чего `JSON.parse` падает.
Это ломает цикл на первой итерации после успешной генерации картинки.

3) План исправления
- Исправить обработку `quiz_json` в `DiagnosticDetail.tsx`:
  - убрать хрупкий `string replace + JSON.parse`;
  - заменить на безопасную обработку объекта (рекурсивно менять точные значения плейсхолдеров на URL/`null`).
- Обернуть весь цикл `startImageGeneration` в `try/catch/finally`:
  - при любой ошибке переводить диагностику в `error` с понятным `generation_progress.error`;
  - в `finally` всегда сбрасывать `imageGenRef.current = false`, чтобы не оставалось “залипания”.
- Добавить восстановление после падения:
  - если статус `generating_images` и есть `placeholders`, автоматически продолжать цикл (сейчас автозапуск есть только для `images_pending`).
- Сохранить прогресс после каждой итерации без промежуточного невалидного парсинга JSON.

4) Дополнительное улучшение (параллельно)
- В `handleGenerate` заменить raw `fetch` на `supabase.functions.invoke("run-diagnostic-pipeline")`, чтобы убрать периодические `TypeError: Failed to fetch` в браузере и унифицировать вызовы функций.

Технические детали
- Файл: `src/pages/DiagnosticDetail.tsx`
  - Баговые места: блоки с `safeQuizJson` и `finalQuizJson` (замена `{{IMAGE...}}` на `"null"`).
  - Логика восстановления: `useEffect/startPolling` ветка для `generating_images`.
  - Надёжность: глобальный `try/catch/finally` в `startImageGeneration`.
- Бэкенд-функция `generate-diagnostic-images` рабочая (подтверждено логами + объектами в storage), менять её для этой проблемы не требуется.

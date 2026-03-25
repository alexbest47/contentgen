

## Разделить поведение левой и правой ячеек баннера

### Проблема
Regex в `preprocessHtmlWithPlaceholders` обрабатывает ВСЕ вхождения `background-image: url({{id}})` одинаково. Обе ячейки получают серую заглушку и кнопки, хотя правая ячейка — это текстовый блок с тёмным фоном, который не нуждается в управлении изображением.

### Решение

**Файл: `src/components/email-builder/BlockCanvas.tsx`**

**1. `preprocessHtmlWithPlaceholders`** — для каждого placeholder ID, только ПЕРВОЕ вхождение `background-image: url({{id}})` получает полное placeholder-поведение:
- Первое вхождение: `data-placeholder-id`, `data-placeholder-unfilled/filled`, серая заглушка (unfilled) или реальный URL (filled) — как сейчас.
- Последующие вхождения того же ID: подставить реальный URL (filled) или просто убрать `background-image` без серой заглушки и без data-атрибутов. Остальные стили элемента (включая `background-color: #1C1C2E`) сохраняются.

Реализация: вместо одного `.replace()` — пройтись по `matchAll`, отслеживая `Set<string>` уже обработанных ID. Первый матч — полная обработка, остальные — только замена URL.

**2. `restorePlaceholderMarkers`** — без изменений, текущая логика уже корректно восстанавливает все вхождения обратно в `{{id}}`.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx` — только `preprocessHtmlWithPlaceholders`


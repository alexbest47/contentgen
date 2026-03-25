

## Поддержка `background-image: url({{placeholder}})` в конструкторе писем

Расширить существующую логику обработки плейсхолдеров в `BlockCanvas.tsx`, чтобы она покрывала не только `<img src="{{id}}">` и standalone `{{id}}`, но и `background-image: url({{id}})`.

### Что изменится для пользователя

- Вместо видимого текста `{{image_placeholder_1}}` в CSS — серая заглушка с подписью типа и размера.
- Когда изображение сгенерировано/выбрано — реальный URL подставляется в `background-image`.

### Технические детали

**Файл: `src/components/email-builder/BlockCanvas.tsx`**

**1. `preprocessHtmlWithPlaceholders`** — добавить третий `.replace()`:
- Regex: `background-image:\s*url\(\s*\{\{(image_placeholder_\w+)\}\}\s*\)`
- Если `ph.image_url` есть → `background-image: url(реальный_url)`
- Если нет → `background-image: none; background-color: #e5e7eb` (серая заглушка; текст-подпись уже есть в ячейке или добавляется через `::after` нет — проще заменить фон на серый, а текст внутри ячейки останется видимым)

**2. `restorePlaceholderMarkers`** — добавить обратную замену:
- Для каждого плейсхолдера с `image_url`: заменить `background-image:\s*url\(реальный_url\)` обратно на `background-image: url({{id}})`
- Для плейсхолдеров без URL: заменить `background-image: none; background-color: #e5e7eb` обратно на `background-image: url({{id}})`

### Файлы
- `src/components/email-builder/BlockCanvas.tsx` — обе функции


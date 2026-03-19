

## Проблемы

### 1. Изображение генерируется, но не вставляется в письмо

**Причина**: когда пользователь кликает в область письма (contentEditable) и фокус уходит (onBlur), обработчик сохраняет текущий innerHTML обратно в `generatedHtml`. Но innerHTML уже содержит подставленные `<div data-placeholder-id="...">` вместо оригинальных маркеров `{{image_placeholder_N}}`. После этого функция `preprocessHtmlWithPlaceholders` больше не находит маркеры `{{...}}` — и не может заменить их на `<img>` с реальным URL.

**Решение**: в обработчике `onBlur` (или в `onUpdateGeneratedHtml`) перед сохранением нужно восстанавливать маркеры — заменять `<div data-placeholder-id="X">...</div>` и `<img src="URL" ...>` (для уже сгенерированных) обратно на `{{X}}` / `src="{{X}}"`. Либо хранить «чистый» HTML с маркерами отдельно от отображаемого.

**Изменения**:
- **`BlockCanvas.tsx`**: добавить функцию `restorePlaceholderMarkers(html, placeholders)`, которая в innerHTML находит `data-placeholder-id` элементы и заменяет их обратно на `<img src="{{id}}" ...>`. Вызывать её в onBlur перед передачей в `onUpdateGeneratedHtml`.

### 2. Блоки «Программы» и «Бесплатные курсы» не применяют цветовую гамму

**Причина**: `PaidProgramsCollectionSettings` и `FreeCoursesGridSettings` генерируют HTML с захардкоженными цветами (`#1A1A2E`, `#888888`, `#E8E0F0`, `#E0E0E0`), не получая `colorSchemeId` и не загружая цвета из схемы.

**Решение**: передать `colorSchemeId` в оба компонента, загрузить `preview_colors` и использовать:
- `preview_colors[0]` — основной цвет текста (заголовки)
- `preview_colors[1]` — акцентный цвет (ссылки, разделители)
- `preview_colors[2]` — фон карточек/плейсхолдеров

**Изменения**:

- **`BlockSettingsPanel.tsx`**: передать `colorSchemeId` в `PaidProgramsCollectionSettings` и `FreeCoursesGridSettings`
- **`PaidProgramsCollectionSettings.tsx`**: принять `colorSchemeId`, загрузить `preview_colors` через useQuery, использовать цвета в `buildHtml()` для заголовков, ссылок, разделителей
- **`FreeCoursesGridSettings.tsx`**: аналогично — принять `colorSchemeId`, использовать цвета схемы для заголовков, ссылок и фона плейсхолдеров изображений

---

Итого: 4 файла, ~60 строк изменений.




## Исправить отображение логотипа и скачивание HTML

### Проблема 1: Логотип не отображается
URL логотипа с Stripo CDN имеет ограничения на загрузку из iframe / других доменов. В лендинге (image-231) видно сломанный img с alt="Talentsy".

**Решение**: В edge function `generate-pdf-material` — после извлечения URL логотипа из email_settings, скачать изображение, загрузить его в бакет `generated-images` (путь `brand/logo.png`), и использовать публичный URL из Supabase Storage как `{{logo_url}}`. Кэшировать: проверять наличие файла перед повторной загрузкой.

### Проблема 2: Скачанный HTML выглядит без стилей
На скриншоте image-230 — контент отображается без фона и стилей. Вероятная причина: при открытии скачанного HTML как `file://` браузер блокирует загрузку внешних изображений (Supabase Storage URL). Без фонового изображения и без фиолетового оверлея — текст остаётся серым на белом.

**Решение**: В функции `downloadHtml` — перед скачиванием встроить фоновое изображение как base64 data URL прямо в HTML. Для этого:
1. При загрузке материала (useQuery) — также fetch'ить `background_image_url` как blob и конвертировать в base64
2. При экспорте — заменять URL изображения на `data:image/png;base64,...` в HTML

Альтернативно (проще): добавить в CSS лендинга fallback `background-color` для `.image-section` или оверлея, чтобы даже без загрузки изображения стили отображались корректно.

### Изменения

**1. `supabase/functions/generate-pdf-material/index.ts`**
- После извлечения `logoUrl` из email_settings: fetch изображение, upload в Storage `brand/logo.png`, использовать публичный URL
- Fallback: если загрузка не удалась — оставить оригинальный URL

**2. `src/pages/PdfMaterialView.tsx`**
- В функцию `downloadHtml` для лендинга: перед скачиванием fetch'ить `background_image_url`, конвертировать в base64, заменить URL в HTML
- Сделать функцию async: `downloadHtmlWithImages(html, imageUrl, filename)`

### Итого
- 1 edge function изменена
- 1 страница изменена


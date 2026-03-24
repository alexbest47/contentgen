

## Кнопка «Сохранить в библиотеку» для изображений-плейсхолдеров

Добавить четвёртую кнопку в группу плавающих кнопок справа от заполненного плейсхолдера, которая сохраняет текущее изображение как баннер в библиотеку.

### Что будет сделано

1. **`src/components/email-builder/BlockCanvas.tsx`** — добавить кнопку «Сохранить в библиотеку» (иконка `Save`/`BookmarkPlus`) в секцию filled placeholders (строки 318–368). Кнопка вызывает новый колбэк `onSavePlaceholderToLibrary(placeholderId)`.

2. **`src/pages/EmailBuilder.tsx`** — реализовать функцию `savePlaceholderToLibrary`:
   - Получить `image_url` плейсхолдера из состояния `imagePlaceholders`.
   - Определить `banner_type` через `PLACEHOLDER_TO_BANNER_TYPE`.
   - Вставить запись в таблицу `banners` (title из названия письма + типа, category из контекста письма, image_url, banner_type, program_id, color_scheme_id, source = "manual").
   - Показать toast об успехе.
   - Передать этот колбэк в `BlockCanvas` через новый проп `onSavePlaceholderToLibrary`.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx` — новая кнопка + проп
- `src/pages/EmailBuilder.tsx` — логика сохранения + передача пропа


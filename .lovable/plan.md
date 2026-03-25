

## Баннер не появляется после генерации + кнопки пропадают у некоторых плейсхолдеров

### Проблема 1: Баннер не появляется после генерации изображения

Та же гонка, что и с генерацией письма. Во время генерации изображения (`generatingPlaceholderId !== null`) автосейв перезаписывает `image_placeholders` в БД старым состоянием (без `image_url`). Edge-функция записывает URL → но автосейв уже затёр его.

**Решение**: добавить ref `generatingPlaceholderRef` и использовать его в `save()` для блокировки записи `image_placeholders` во время генерации изображения (аналогично `generatingLetterRef`).

### Проблема 2: Проверка `isFilled` использует неправильное поле

Строка 433 в `BlockCanvas.tsx`:
```ts
const isFilled = !!(ph as any).url;  // WRONG — поле называется image_url
```
Из-за этого `isFilled` всегда `false`, и кнопка «Сохранить в библиотеку» никогда не появляется для заполненных плейсхолдеров.

### Проблема 3: Кнопки отсутствуют у некоторых плейсхолдеров

Для **заполненных** standalone-плейсхолдеров (не background-image) кнопки ищутся через сопоставление `img.src.includes(ph.image_url)` (строки 248-263). Но для **незаполненных** div-плейсхолдеров кнопки должны появляться всегда — если `data-placeholder-id` есть, элемент найдётся. Вероятная причина: `tool_diagram` — не совпадает с регулярным выражением standalone-замены `/\{\{(image_placeholder_\w+)\}\}/g` (строка 161), которое требует префикс `image_placeholder_`. Если ID = `tool_diagram`, он не обработается как standalone, а только через `<img src="{{tool_diagram}}">` (строка 124) — и тогда div создаётся корректно. Нужно расширить regex для поддержки любых placeholder ID.

### Изменения

**`src/pages/EmailBuilder.tsx`**:
1. Добавить `generatingPlaceholderRef` (аналог `generatingLetterRef`)
2. В `save()`: блокировать запись `image_placeholders` когда `generatingPlaceholderRef.current` активен

**`src/components/email-builder/BlockCanvas.tsx`**:
1. Строка 433: исправить `(ph as any).url` → `ph.image_url`
2. Строка 161: расширить regex standalone-замены с `image_placeholder_\w+` на `[^}]+` для поддержки всех ID плейсхолдеров (аналогично img src regex на строке 124)


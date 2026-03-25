

## Восстановить кнопки управления для background-image плейсхолдеров

### Проблема

Кнопки «Сгенерировать», «Из библиотеки», «Сохранить в библиотеку» не появляются для плейсхолдеров, использующих `background-image: url({{id}})`, потому что:

1. **Unfilled**: замена ставит `background-image: none; background-color: #e5e7eb`, но НЕ добавляет `data-placeholder-id` на элемент → `measurePlaceholders` не находит его.
2. **Filled**: измерение ищет только `<img>` элементы, а элементы с `background-image` не проверяются.

### Решение

**Файл: `src/components/email-builder/BlockCanvas.tsx`**

**1. `preprocessHtmlWithPlaceholders`** — при замене `background-image: url({{id}})`:
- Расширить regex, чтобы захватить открывающий тег элемента (td, div и т.д.), содержащий этот стиль.
- Вставить атрибут `data-placeholder-id="id"` в этот тег.
- Для unfilled: также добавить `data-placeholder-unfilled="true"`.
- Для filled: добавить `data-placeholder-filled="true"`.

**2. `measurePlaceholders`** — добавить поиск элементов с `data-placeholder-unfilled` и `data-placeholder-filled`:
- `[data-placeholder-filled]` — добавлять rect для filled-плейсхолдеров (аналогично img-логике).
- `[data-placeholder-unfilled]` уже покрывается существующим `[data-placeholder-id]` селектором, если атрибут добавлен.

**3. `restorePlaceholderMarkers`** — при обратной замене удалять добавленные `data-placeholder-id`, `data-placeholder-unfilled`, `data-placeholder-filled` атрибуты из тегов.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx`


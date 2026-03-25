

## Перенести панель форматирования в левое меню + добавить гиперссылки

### Что делаем
1. Убираем `FormattingToolbar` из `BlockCanvas` (между шапкой и контентом).
2. Добавляем панель форматирования в левую колонку `EmailBuilder.tsx` — под `BlockLibrary`, видна только в full letter mode.
3. Расширяем палитру цветов выделения.
4. Добавляем кнопку «Ссылка» — вставка гиперссылки через `document.execCommand('createLink')` с prompt для ввода URL.
5. Добавляем возможность редактировать URL кнопок (CTA) прямо в сгенерированном HTML — при клике на `<a>` внутри contentEditable показывать мини-попап для редактирования href.

### Технические изменения

**Файл: `src/components/email-builder/BlockCanvas.tsx`**
- Удалить компонент `FormattingToolbar` и его вызов `<FormattingToolbar />` из JSX (строка 458).
- Удалить `HIGHLIGHT_COLORS` константу.
- Экспортировать contentRef наружу через callback ref или передать ref как prop, чтобы форматирование работало из левой панели (execCommand действует на текущий selection в document — ref не нужен, достаточно чтобы фокус был в contentEditable).
- Добавить обработчик клика по `<a>` внутри contentEditable: при клике на ссылку/кнопку показывать всплывающий попап с полем href и кнопкой «Сохранить». Это покроет как текстовые гиперссылки, так и кнопки CTA.

**Новый файл: `src/components/email-builder/FormattingToolbar.tsx`**
- Вынести `FormattingToolbar` в отдельный компонент.
- Расширить палитру до ~12 цветов: жёлтый, зелёный, голубой, розовый, оранжевый, красный, сиреневый, лавандовый, салатовый, персиковый, серый, белый (убрать).
- Вертикальная компоновка (для левой колонки): кнопки в сетке или столбцом.
- Добавить кнопку «Ссылка» (Link icon): при клике — `window.prompt("Введите URL")` → `document.execCommand('createLink', false, url)`. Если выделение пустое — вставить ссылку с текстом URL.
- `onMouseDown={preventDefault}` на всех кнопках, как раньше.

**Файл: `src/pages/EmailBuilder.tsx`**
- В левой колонке (строка 712-714), после `<BlockLibrary ... />`, добавить:
  ```tsx
  {generatedHtml && <FormattingToolbar />}
  ```
- Импортировать новый компонент.

**Файл: `src/components/email-builder/BlockCanvas.tsx` (попап редактирования ссылок)**
- Добавить state `editingLink: { el: HTMLAnchorElement; href: string } | null`.
- В contentEditable `onClick` — проверить, кликнули ли по `<a>`. Если да — показать абсолютно позиционированный попап с input для href и кнопками «Сохранить» / «Удалить ссылку».
- При сохранении — обновить `el.href`. При удалении — `document.execCommand('unlink')`.

### Файлы
- `src/components/email-builder/FormattingToolbar.tsx` — новый
- `src/components/email-builder/BlockCanvas.tsx` — убрать toolbar, добавить попап ссылок
- `src/pages/EmailBuilder.tsx` — подключить toolbar в левую панель


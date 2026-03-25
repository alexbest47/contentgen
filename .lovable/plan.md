

## Обернуть CTA-кнопку ссылкой целиком

### Проблема
`document.execCommand("createLink")` оборачивает только выделенный текст в `<a>`, а не весь контейнер кнопки (обычно `<td>` с background-color).

### Решение

**Файл: `src/components/email-builder/FormattingToolbar.tsx`** — изменить функцию `insertLink`:

После получения URL, перед вызовом `createLink`, проверить, находится ли курсор/выделение внутри CTA-кнопки. Логика:

1. От `sel.anchorNode` подняться вверх по DOM, ища ближайший `<td>` или `<a>` с `background-color` (типичная структура email CTA: `<td style="background-color:..."><a>текст</a></td>`).
2. Если найден такой `<td>` — найти или создать внутри него `<a>`, установить `href=url`, сделать ссылку блочной (`display:block`, `text-decoration:none`, `color:inherit`, `padding` перенести с `<td>` на `<a>`), чтобы вся область кнопки была кликабельной.
3. Если CTA-контейнер не найден — использовать текущую логику (`createLink` для выделенного текста или вставка `<a>` без выделения).

Определение CTA-кнопки: `<td>` у которого есть inline `background-color` и он не является частью layout-таблицы (ширина < 400px или есть `text-align: center`).

### Файлы
- `src/components/email-builder/FormattingToolbar.tsx`


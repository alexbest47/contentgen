

## Добавить отступы в PDF-контент

### Проблема
Текст в PDF прижимается к краям страницы — нет боковых отступов.

### Решение

**`src/pages/PdfMaterialView.tsx`**

Расширить `printFixCss` — добавить `body { padding: 32px 48px; }` для контента внутри iframe. Также добавить в `@media print` аналогичные отступы через `margin`, чтобы при печати тоже были поля.

```css
body { padding: 32px 48px; box-sizing: border-box; }
@media print { body { margin: 0; padding: 32px 48px; } }
```

### Итого
- 1 файл, ~2 строки в CSS-блоке


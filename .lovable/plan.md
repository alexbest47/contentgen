

## Исправить вылезание обложки за первую страницу при печати

### Проблема
Body имеет `padding: 32px 48px`, а `.cover` компенсирует это отрицательными margin'ами. Но `max-height: 100vh` + внутренний padding обложки = контент превышает одну страницу.

### Решение

**`src/pages/PdfMaterialView.tsx`**

Переписать `printFixCss`:
- Убрать padding с body для обложки — вместо этого применять padding только к элементам ПОСЛЕ обложки
- Обложка: `height: 100vh`, `margin: 0`, `padding: 0`, `page-break-after: always` (чтобы контент начинался с новой страницы)
- Убрать отрицательные margin'ы — они ненадёжны
- Body padding заменить на padding для контентных секций через `body > *:not(.cover)`

```css
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
body { margin: 0; padding: 0; }
.cover { 
  width: 100%; height: 100vh; 
  overflow: hidden; 
  box-sizing: border-box;
  page-break-after: always;
}
body > *:not(.cover) { padding-left: 48px; padding-right: 48px; }
@media print {
  .cover { page-break-after: always; height: 100vh; }
}
```

### Итого
- 1 файл, ~5 строк CSS изменены


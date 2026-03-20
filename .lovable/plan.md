

## Исправить обложку PDF при печати

### Проблема
Обложка `.cover` имеет `height: 100vh` или фиксированную высоту, а `body { padding: 32px 48px }` добавляет дополнительное пространство сверху/снизу — итого обложка вылезает за границы первой страницы при печати.

### Решение

**`src/pages/PdfMaterialView.tsx`**

Обновить `printFixCss` — убрать padding для обложки и ограничить её размер страницей A4:

```css
.cover { 
  page-break-after: avoid !important;
  max-height: 100vh !important;
  overflow: hidden !important;
  padding: 32px 48px !important;
  box-sizing: border-box !important;
}
body > .cover:first-child { margin: -32px -48px; width: calc(100% + 96px); }
```

Суть: body padding создаёт отступы для текстовых страниц, но обложка должна быть полностраничной — убираем для неё внешний padding через отрицательные margin и ограничиваем высоту.

### Итого
- 1 файл, ~5 строк CSS


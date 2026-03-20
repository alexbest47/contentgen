

## Исправить печать PDF: фон обложки + пустая вторая страница

### Проблема 1: Фон обложки не печатается
Браузеры по умолчанию не печатают фоновые цвета и изображения. В CSS сгенерированного HTML нет директивы `print-color-adjust`.

### Проблема 2: Пустая вторая страница
CSS `.cover` имеет `page-break-after: always`, что создаёт пустую страницу между обложкой и контентом.

### Решение

**`src/pages/PdfMaterialView.tsx`**

Перед передачей `html_content` в iframe для печати — инжектить CSS-фикс прямо в HTML:

```css
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
@media print { .cover { page-break-after: avoid; } }
```

Добавить функцию `injectPrintStyles(html)` — вставляет `<style>` блок перед `</head>` (или в начало HTML). Применять и к `srcDoc` iframe, и к `print()`.

### Итого
- 1 файл изменён (`PdfMaterialView.tsx`), ~10 строк


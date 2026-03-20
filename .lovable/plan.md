

## Исправить кнопку «Скачать PDF»

### Проблема
Кнопка вызывает `pdfIframeRef.current?.contentWindow?.print()` на iframe с `data:` URL. Браузеры блокируют доступ к `contentWindow` у `data:` URL из-за ограничений cross-origin.

### Решение

**`src/pages/PdfMaterialView.tsx`**

Заменить `data:` URL на атрибут `srcDoc` для обоих iframe. `srcDoc` рендерит HTML inline без cross-origin ограничений, и `contentWindow.print()` будет работать.

- Убрать переменные `landingSrc` и `pdfSrc`
- Для iframe лендинга: `srcDoc={landingHtml}`
- Для iframe PDF: `srcDoc={material.html_content || ""}`, `ref={pdfIframeRef}`

### Итого
- 1 файл, ~4 строки изменены


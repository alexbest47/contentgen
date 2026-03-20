

## Исправить прокрутку iframe лендинга

### Проблема
Iframe с лендингом имеет `minHeight: "80vh"` — фиксированная высота, контент обрезается, а iframe сам не скроллится.

### Решение

**`src/pages/PdfMaterialView.tsx`**

Для iframe лендинга (строка 121-126): заменить `style={{ minHeight: "80vh" }}` на `style={{ height: "85vh" }}` и убедиться что iframe скроллится — это поведение по умолчанию для iframe. Проблема скорее в том, что лендинговый HTML содержит `overflow: hidden` на body/html. 

Более надёжное решение: установить фиксированную высоту iframe и позволить ему скроллиться внутри:
- `style={{ height: "80vh" }}` + никаких `scrolling="no"` атрибутов (iframe скроллится по умолчанию)

Iframe уже должен скроллиться. Вероятная причина — лендинговый HTML имеет `overflow: hidden` на `html` или `body`. Нужно инжектить CSS-фикс в `landingHtml`:

```css
html, body { overflow: auto !important; height: auto !important; }
```

Добавить это в `landingHtml` перед передачей в `srcDoc` — аналогично `injectPrintStyles`, но для лендинга.

### Итого
- 1 файл (`PdfMaterialView.tsx`), ~3 строки


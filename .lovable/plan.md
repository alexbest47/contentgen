

## Iframe 16:9 + кнопка «Перегенерировать» поверх изображения

### Изменения

**`src/pages/PdfMaterialView.tsx`**

1. **Iframe 16:9**: Заменить `style={{ height: "80vh" }}` на `aspect-ratio: 16/9` через CSS-класс `aspect-video` (Tailwind) для iframe лендинга.

2. **Кнопка «Перегенерировать»**: Добавить поверх iframe лендинга кнопку с абсолютным позиционированием (top-right). При клике — вызывать edge function `generate-pdf-material` с `pdf_material_id`, показывать Loader, после успеха — refetch данных.

   - Обернуть iframe в `relative` контейнер
   - Кнопка: `absolute top-3 right-3 z-10`, полупрозрачный фон
   - Состояние `regenerating` + `useState`
   - После вызова `supabase.functions.invoke("generate-pdf-material", { body: { pdf_material_id: id } })` — `refetch()` для обновления данных

### Итого
- 1 файл (`PdfMaterialView.tsx`), ~15 строк добавлено/изменено


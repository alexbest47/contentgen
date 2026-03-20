

## Показать PDF-материалы на странице «Скачай PDF» внутри программы

### Проблема
`OfferTypeDetail` для типа `download_pdf` ищет записи в таблице `offers`, но PDF-материалы хранятся в отдельной таблице `pdf_materials`. Нужно обработать этот тип аналогично тому, как обрабатываются диагностики (`isDiagnosticType`).

### Решение

**`src/pages/OfferTypeDetail.tsx`**

1. Добавить флаг `isPdfType = offerType === "download_pdf"`
2. Добавить `useQuery` для `pdf_materials` с фильтром по `program_id`, enabled только при `isPdfType`
3. В рендеринге: добавить ветку для `isPdfType` — список PDF-материалов со статусом и датой, клик ведёт на `/pdf-materials/:id`
4. Обновить условие для запроса `offers`: `enabled: !isDiagnosticType && !isPdfType`

### Итого
- 1 файл изменён (`OfferTypeDetail.tsx`), ~30 строк добавлено


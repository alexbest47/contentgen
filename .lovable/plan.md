

## Связать PDF-материалы с офферами (как диагностики)

### Проблема
PDF-материалы не создают запись в таблице `offers`, поэтому при выборе «Скачай PDF» в программе невозможно перейти к генерации контента (лид-магнитов, справочных материалов и т.д.).

### Решение
Повторить паттерн диагностик: при создании PDF-материала — создавать связанную запись в `offers`, сохранять `offer_id` в `pdf_materials`.

### Изменения

**1. Миграция БД**
- Если колонка `offer_id` отсутствует в `pdf_materials` — добавить: `ALTER TABLE pdf_materials ADD COLUMN offer_id uuid REFERENCES offers(id);`

**2. `src/components/pdf/CreatePdfWizard.tsx`**
После создания записи `pdf_materials` и перед вызовом edge function:
- Создать запись в `offers` с `offer_type: "download_pdf"`, `title`, `program_id`, `created_by`
- Обновить `pdf_materials` с полученным `offer_id`

**3. `src/pages/OfferTypeDetail.tsx`**
В ветке `isPdfType`:
- Добавить `offer_id` в select-запрос `pdf_materials`
- При клике на PDF-материал: если есть `offer_id` — навигировать на `/programs/${programId}/offers/download_pdf/${offer_id}` (как диагностики), иначе показать ошибку

### Итого
- 1 миграция (добавить `offer_id` в `pdf_materials`)
- 2 файла изменены (`CreatePdfWizard.tsx`, `OfferTypeDetail.tsx`)


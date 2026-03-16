

## Заменить «Описание» на «Ссылка на Google Doc» в диагностиках + сделать обязательным

### 1. Миграция БД
Добавить колонку `doc_url text` в таблицу `diagnostics`.

### 2. `src/pages/CreateDiagnostic.tsx`
- Заменить state `description` → `docUrl`
- Заменить поле `Textarea` «Описание» на `Input` «Ссылка на Google Doc» с `required`
- В `handleSave`: писать `doc_url: docUrl` вместо `description` в insert для `diagnostics` и `offers`

### 3. `src/pages/Diagnostics.tsx`
- В edit-диалоге: заменить поле «Описание» (`Textarea`) на «Ссылка на Google Doc» (`Input`)
- В state `editingDiag`: заменить `description` на `doc_url`
- В `updateMutation`: отправлять `doc_url` вместо `description`
- Загружать `doc_url` в select-запросе

### 4. `src/pages/OfferTypeDetail.tsx`
- Сделать поле Google Doc обязательным: добавить `required` на Input в `OfferForm`

### 5. Edge-функции
- В `run-diagnostic-pipeline` и `generate-diagnostic`: загружать `doc_url` из диагностики и использовать для получения текста из Google Doc (аналогично `program_doc_url`), передавая в переменную промпта `{{test_description}}`.


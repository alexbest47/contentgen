

## Задача

Разделить «описание оффера» на две переменные:
- `{{offer_value}}` — короткое описание (поле `offers.description`, обязательное)
- `{{offer_description}}` — полное описание из Google Docs (поле `offers.doc_url`)

Сейчас `{{offer_description}}` использует `offers.description` с фоллбэком на Google Docs. Нужно их разделить.

## Изменения

### 1. `src/pages/PromptVariables.tsx` — обновить справочник

В категории «Оффер»:
- Переименовать описание `{{offer_description}}` → «Полное описание оффера из Google Docs», source: `offers.doc_url → Google Docs export`
- Добавить `{{offer_value}}` → «Короткое описание оффера (ценностное предложение)», source: `offers.description`

### 2. Edge-функции — разделить подстановку

Во всех 6 функциях, где подставляется `{{offer_description}}`:

**Логика для функций с доступом к объекту offer** (`generate-content`, `generate-lead-magnets`, `generate-pipeline`, `generate-image`, `generate-email-block`, `generate-email-letter`):
- `{{offer_value}}` = `offer.description || ""`
- `{{offer_description}}` = текст из Google Docs (doc_url) — загружать всегда, независимо от наличия description

В каждой функции:
- Изменить логику загрузки `offerDescription`: всегда загружать из doc_url (убрать условие `!offerDescription`)
- Добавить `.replace(/\{\{offer_value\}\}/g, offer.description || "")`
- Оставить `.replace(/\{\{offer_description\}\}/g, offerDescription)` — теперь это только Google Docs

**Для `run-diagnostic-pipeline` и `generate-card-prompt`** (диагностики):
- `offer_value` = `description` (параметр из запроса)
- `offer_description` = текст из Google Docs (doc_url диагностики)

### Затрагиваемые файлы

1. `src/pages/PromptVariables.tsx`
2. `supabase/functions/generate-content/index.ts`
3. `supabase/functions/generate-lead-magnets/index.ts`
4. `supabase/functions/generate-pipeline/index.ts`
5. `supabase/functions/generate-image/index.ts`
6. `supabase/functions/generate-email-block/index.ts`
7. `supabase/functions/generate-email-letter/index.ts`
8. `supabase/functions/run-diagnostic-pipeline/index.ts`
9. `supabase/functions/generate-card-prompt/index.ts`


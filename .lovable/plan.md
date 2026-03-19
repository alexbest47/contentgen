

## Задача

Добавить переменные `{{offer_image}}` и обновить описание `{{offer_description}}` в справочнике переменных и в edge-функциях подстановки.

## Изменения

### 1. `src/pages/PromptVariables.tsx` — обновить справочник

В категории «Оффер» (строки 34–40):
- Обновить описание `{{offer_description}}`: источник теперь `offers.description` (обязательное поле) с фоллбэком на Google Docs
- Добавить новую переменную `{{offer_image}}` — URL изображения оффера, источник `offers.image_url`

### 2. Edge-функции — добавить подстановку `{{offer_image}}`

В каждой из функций, где уже подставляется `{{offer_description}}`, добавить `.replace(/\{\{offer_image\}\}/g, offer.image_url || "")`:

- `supabase/functions/generate-lead-magnets/index.ts`
- `supabase/functions/generate-content/index.ts`
- `supabase/functions/generate-email-block/index.ts`
- `supabase/functions/generate-email-letter/index.ts`
- `supabase/functions/run-diagnostic-pipeline/index.ts`

Никаких миграций БД не требуется — поля уже существуют.


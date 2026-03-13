

## Переименование переменных диагностики и обновление справочника

### Изменения

**1. `supabase/functions/generate-diagnostic/index.ts`** — переименовать переменные:
- `{{quiz_name}}` → `{{test_name}}`
- `{{quiz_description}}` → `{{test_description}}`

**2. `src/pages/PromptVariables.tsx`** — добавить 3 новые переменные в массив `variables`:
- `{{test_name}}` — Название диагностики / теста, источник: `diagnostics.name`
- `{{test_description}}` — Описание диагностики / теста, источник: `diagnostics.description`
- `{{audience_tags}}` — Теги аудитории диагностики, источник: `diagnostics.audience_tags`




## Упрощение пайплайна: убрать thankYouPage, сделать шаги независимыми

### Текущие проблемы

1. **Лишний блок `thankYouPage`** — генерируется в Step 1, сохраняется в `thank_you_json`, показывается в UI. Не нужен.
2. **Step 2 зависит от Step 1** — сейчас из quiz извлекаются `resultTypes` и передаются как `{{result_types_json}}` в промпт карты. По спецификации оба запроса используют одни и те же переменные из формы.

### Изменения

#### 1. `supabase/functions/run-diagnostic-pipeline/index.ts`

- **Step 1**: убрать извлечение `thankYouPage` из ответа Claude. Сохранять только `quiz_json`, без `thank_you_json`.
- **Step 2**: убрать переменную `result_types_json` из `step2Vars`. Использовать те же `templateVars`, что и Step 1. Оба запроса полностью независимы.
- Убрать запись `thank_you_json` в БД.

#### 2. `src/pages/DiagnosticDetail.tsx`

- Убрать переменную `thankYouJson` и весь блок "JSON страницы «Спасибо»" (строки 760-782).
- Убрать `thank_you_json` из polling select и cache update.
- Итого в UI остаётся два блока: "JSON теста" и "Промпт диагностической карты".


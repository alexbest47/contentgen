

## Разделение генерации на два последовательных запроса к Claude

### Суть изменений

Сейчас edge-функция делает один запрос к Claude и ожидает ответ с тремя частями (quiz, thankYouPage, diagnosticCardPrompt). Нужно разделить на два последовательных вызова, каждый со своим промптом из БД.

### Edge-функция `run-diagnostic-pipeline/index.ts`

**Вместо** загрузки одного промпта по `prompt_id`, загружаем все активные промпты категории `test_generation`, отсортированные по `step_order`:

```ts
const { data: prompts } = await supabase
  .from("prompts")
  .select("*")
  .eq("category", "test_generation")
  .eq("is_active", true)
  .order("step_order");
```

**Шаг 1** — Промпт 1 (step_order=1): вызов Claude → парсим JSON → извлекаем `quiz` и `thankYouPage`. Сохраняем в `quiz_json`, `thank_you_json`. Статус: `quiz_generated`.

**Шаг 1.5** (новый) — Промпт 2 (step_order=2): подставляем переменную `{{result_types_json}}` = `JSON.stringify(quizPart.resultTypes)` из результата шага 1. Вызов Claude → получаем текст/JSON card_prompt. Сохраняем в `card_prompt`. Статус: `card_prompt_generated` (новый).

**Шаг 2** — Генерация изображений (без изменений).

Между шагами — проверка cancellation (статус `error`).

### Новый статус `card_prompt_generated`

Добавляется между `quiz_generated` и `generating_images` в цепочке: `draft → generating → quiz_generated → generating_card_prompt → card_prompt_generated → generating_images → ready`.

Новый промежуточный статус `generating_card_prompt` для отображения прогресса.

### Frontend `DiagnosticDetail.tsx`

1. **Шаги прогресса** — добавить третий шаг «Генерация промпта карты» между «Структура теста» и «Изображения»:
```ts
const s = [
  { label: "Генерация структуры теста", status: "pending" },
  { label: "Генерация промпта карты", status: "pending" },
  { label: "Создание изображений", status: "pending" },
  { label: "Готово", status: "pending" },
];
```

2. **`updateStepsFromStatus`** — обработать новые статусы `generating_card_prompt` и `card_prompt_generated`.

3. **`ACTIVE_STATUSES`** — добавить `"generating_card_prompt"`.

4. **`handleGenerate`** — убрать передачу `prompt_id` (промпты теперь подбираются автоматически в edge-функции).

### Frontend `CreateDiagnostic.tsx`

Убрать селектор промпта (промпты подбираются автоматически по категории и step_order). Поле `prompt_id` в `diagnostics` становится необязательным/legacy.

### Переменные промптов

Добавить `{{result_types_json}}` в справочник на странице `/prompt-variables` (если он там ведётся в коде).


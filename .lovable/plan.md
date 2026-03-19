

## Задача

Добавить переменную `{{program_description}}` в справочник переменных промптов.

## Контекст

Переменная `{{program_description}}` уже подставляется в 5 edge-функциях (`generate-email-letter`, `generate-email-block`, `generate-diagnostic`, `generate-card-prompt`, `run-diagnostic-pipeline`), но отсутствует в справочнике на странице `/prompt-variables`. Источник — поле `paid_programs.description` (краткое описание программы, введённое вручную в диалоге редактирования).

## Изменение — 1 файл

**`src/pages/PromptVariables.tsx`**, строка 26 — добавить новую переменную в категорию «Платная программа» после `{{program_title}}`:

```ts
{ name: "{{program_description}}", description: "Краткое описание платной программы (введённое вручную)", source: "paid_programs.description" },
```


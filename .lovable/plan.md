

## Задача

Добавить переменные `{{letter_theme}}` и `{{template_name}}` в справочник переменных промптов, в категорию «Конструктор email».

## Изменение — 1 файл

**`src/pages/PromptVariables.tsx`**, строки 96-99 — расширить массив `variables` категории «Конструктор email»:

```ts
{
  title: "Конструктор email",
  variables: [
    { name: "{{letter_theme}}", description: "Тема письма (название + описание из дерева тем или введённое вручную)", source: "email_letters.letter_theme_title + letter_theme_description" },
    { name: "{{template_name}}", description: "Название выбранного шаблона письма", source: "email_templates.name" },
    { name: "{{letter_blocks_summary}}", description: "JSON-сводка всех блоков письма (типы, офферы, темы) — заполняется автоматически при генерации темы", source: "Системная переменная (email_letter_blocks)" },
  ],
},
```

Также стоит добавить остальные переменные, используемые в промпте генерации письма, если они подставляются в edge-функции: `{{offer_type}}`, `{{program_description}}`, `{{offer_description}}`, `{{brand_style}}`, `{{case_data}}`, `{{offers_selection}}`. Однако большинство из них уже описаны в других категориях справочника (Оффер, Платная программа, Контент-отзыв). Поэтому добавляем только `{{letter_theme}}` и `{{template_name}}` — они специфичны для конструктора email и нигде больше не указаны.


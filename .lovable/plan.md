

## Переименование `{{blocks_summary}}` → `{{letter_blocks_summary}}`

### Изменения

**1. `supabase/functions/generate-email-subject/index.ts`**
- Строка 13: `blocks_summary` → `letter_blocks_summary` в деструктуризации
- Строка 36: `blocks_summary` → `letter_blocks_summary`
- Строка 40: `{{blocks_summary}}` → `{{letter_blocks_summary}}`

**2. `src/pages/EmailBuilder.tsx`**
- Строка 253: `blocks_summary` → `letter_blocks_summary` в body запроса

**3. `src/pages/PromptVariables.tsx`**
- Добавить новую категорию «Конструктор email» в массив `categories` (после «Отработка возражения»):
```ts
{
  title: "Конструктор email",
  variables: [
    { name: "{{letter_blocks_summary}}", description: "JSON-сводка всех блоков письма (типы, офферы, темы) — заполняется автоматически при генерации темы", source: "Системная переменная (email_letter_blocks)" },
  ],
}
```




## Добавить шаблон «Доверимся ИИ»

### 1. SQL-миграция — запись в `email_templates` и `prompts`

**email_templates**: Добавить новую строку:
- name: `Доверимся ИИ`
- category: `paid_programs`
- description: текст из ТЗ
- sort_order: 3 (после «С нуля»)
- blocks JSON: `[{"block_type":"image","label":"Баннер-заголовок","mode":"header_image"},{"block_type":"text","label":"Тело письма","mode":"text_only"},{"block_type":"cta","label":"CTA","mode":"accent_block"}]`

**prompts**: Добавить новую строку:
- name: `Доверимся ИИ`
- slug: `email-builder-ai-driven`
- content_type: `email_builder`
- category: `email_builder`
- system_prompt и user_prompt_template: пустые заглушки (пользователь заполнит через UI управления промптами)
- provider: `anthropic`, model: `claude-sonnet-4-20250514`
- is_active: true, step_order: 1

### 2. Маппинг шаблон → промпт (`generate-email-letter/index.ts`)

Добавить в `TEMPLATE_PROMPT_MAP`:
```
"Доверимся ИИ": "email-builder-ai-driven"
```

### 3. Визард (`CreateLetterWizard.tsx`)

Логика «Доверимся ИИ» идентична «Прямому офферу» (3-шаговый flow без темы и без free-form описания):

- Добавить: `const isAiDriven = selectedTemplateName === "Доверимся ИИ";`
- Обновить `is3StepFlow`: `const is3StepFlow = isDirectOffer || isWebinar || isAiDriven;`
- `letter_theme_title` и `letter_theme_description` — пустые строки (как у direct offer)
- Всё остальное (шаги аудитория → настройки → создать) работает как у 3-шаговых шаблонов

### 4. `noCaseRequired` — шаблон без кейса

**EmailBuilder.tsx** (строка ~847): Добавить `"Доверимся ИИ"` в массив `noCaseRequired`:
```ts
noCaseRequired={["Приглашение на вебинар: письмо 1", "Приглашение на вебинар: письмо 2", "С нуля", "Доверимся ИИ"].includes(template?.name || "")}
```

**BlockLibrary.tsx** (строка 48): Добавить в `NO_CASE_TEMPLATES`:
```ts
const NO_CASE_TEMPLATES = ["Приглашение на вебинар: письмо 1", "Приглашение на вебинар: письмо 2", "С нуля", "Доверимся ИИ"];
```

### 5. Панель генерации (`LetterGenerationPanel.tsx`)

Для `noCaseRequired && !isWebinar` (т.е. «Доверимся ИИ» и «С нуля»): показать текст-подсказку «ИИ самостоятельно определит структуру письма» вместо «Данные берутся из настроек вебинара».

Обновить строку 315-321:
```ts
{noCaseRequired && !isDirectOffer && (
  <div className="pt-2">
    <p className="text-xs text-muted-foreground text-center">
      {isWebinar ? "Данные берутся из настроек вебинара" : "ИИ самостоятельно определит структуру письма"}
    </p>
  </div>
)}
```

Также передать `templateName` в props (он уже приходит).

### Файлы в изменениях

| Файл | Что меняется |
|------|-------------|
| Миграция SQL | INSERT в `email_templates` и `prompts` |
| `supabase/functions/generate-email-letter/index.ts` | +1 строка в `TEMPLATE_PROMPT_MAP` |
| `src/components/email-builder/CreateLetterWizard.tsx` | `isAiDriven`, обновить `is3StepFlow` |
| `src/pages/EmailBuilder.tsx` | Добавить «Доверимся ИИ» в массив `noCaseRequired` |
| `src/components/email-builder/BlockLibrary.tsx` | Добавить в `NO_CASE_TEMPLATES` |
| `src/components/email-builder/LetterGenerationPanel.tsx` | Уточнить подсказку для no-case шаблонов |


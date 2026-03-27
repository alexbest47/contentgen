

## Добавить шаблон «С нуля» (free_form)

### Обзор
Новый шаблон email-письма со свободной формой. Пользователь описывает цель письма в текстовом поле, и это передаётся в промпт через существующую переменную `{{letter_theme}}`.

### 1. Добавить шаблон в БД

**Миграция SQL** — вставка строки в `email_templates`:
```sql
INSERT INTO email_templates (name, description, category, sort_order, blocks) VALUES (
  'С нуля',
  'Свободная форма. Пользователь сам определяет тему и цель письма.',
  'paid_programs',
  3,
  '[
    {"block_type":"image","label":"Баннер-заголовок","mode":"header_image"},
    {"block_type":"text","label":"Тело письма","mode":"text_only"},
    {"block_type":"cta","label":"CTA","mode":"accent_block"}
  ]'::jsonb
);
```

### 2. Визард (`CreateLetterWizard.tsx`)

Добавить новый флаг `isFreeForm` (проверка `selectedTemplateName === "С нуля"`).

**Поток для «С нуля» — 4 шага:**
1. Выбор шаблона (стандартный)
2. Для кого письмо (аудитория — как у «Прямого оффера»)
3. Настройки (программа, оффер, цвет, стиль — как у «Прямого оффера»)
4. **Новый шаг** — «О чём это письмо?» (textarea, min-height 160px, обязательное)

Изменения в логике:
- `totalSteps`: для `isFreeForm` = 4
- Заголовки шагов: «Шаг X из 4»
- Шаг 4 показывает textarea с описанием цели письма
- Новый state `freeFormDescription`
- `canCreate` для free_form: `letterTitle.trim() && freeFormDescription.trim()`
- `handleCreate`: сохранять `freeFormDescription` в `letter_theme_description`, а `letterTitle` в `letter_theme_title`
- Кнопка на шаге 4: «Создать письмо»

Маппинг шагов для `isFreeForm`:
- step 1 = шаблон, step 2 = аудитория, step 3 = настройки, step 4 = описание письма

### 3. Промпт-маппинг (`generate-email-letter/index.ts`)

Добавить в `TEMPLATE_PROMPT_MAP`:
```ts
"С нуля": "email-builder-free-form",
```

Фолбэк на `email-builder-full-letter` если промпт не найден — уже есть.

### 4. BlockLibrary — скрыть генерируемые блоки

Добавить `"С нуля"` в `NO_CASE_TEMPLATES` в `BlockLibrary.tsx`, чтобы скрыть секцию «Генерируемые блоки».

### 5. LetterGenerationPanel — пропустить выбор кейса

Для шаблона «С нуля» передать `noCaseRequired={true}` из `EmailBuilder.tsx` (аналогично вебинарным шаблонам). Добавить `"С нуля"` в список шаблонов без кейса.

### 6. Каталог переменных (`PromptVariables.tsx`)

Добавить в блок «Тема от пользователя» описание использования `{{letter_theme}}` для шаблона «С нуля»:
```
{{letter_theme}} — Свободное описание цели и содержания письма (шаблон «С нуля»)
```

### Файлы для изменения
- **Миграция** — новая строка в `email_templates`
- `src/components/email-builder/CreateLetterWizard.tsx` — 4-шаговый поток для free_form
- `src/components/email-builder/BlockLibrary.tsx` — добавить в `NO_CASE_TEMPLATES`
- `src/pages/EmailBuilder.tsx` — `noCaseRequired` для «С нуля»
- `supabase/functions/generate-email-letter/index.ts` — маппинг промпта
- `src/pages/PromptVariables.tsx` — описание переменной


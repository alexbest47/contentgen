

## Добавить вебинарные шаблоны, промпты и wizard-флоу

### 1. Миграция БД — 2 шаблона + 2 промпта

**Шаблоны** (`email_templates`):
```sql
INSERT INTO email_templates (name, description, category, sort_order, blocks) VALUES
('Приглашение на вебинар: письмо 1',
 'Приглашение на вебинар от боли читателя. Письмо называет конкретную ситуацию читателя, объясняет что именно об этом будет вебинар, показывает программу и спикера. Работает и для живых вебинаров, и для автовебинаров.',
 'webinar', 10,
 '[{"block_type":"hook_situation","label":"Крючок + ситуация читателя","mode":"header_image"},{"block_type":"webinar_program","label":"Программа вебинара","mode":"schema_image"},{"block_type":"speaker","label":"Спикер","mode":"text_only"},{"block_type":"offer_cta","label":"CTA","mode":"accent_block"}]'),
('Приглашение на вебинар: письмо 2',
 'Второе касание. Даёт конкретную пользу по теме вебинара прямо в письме — читатель получает 2–3 инсайта и хочет продолжения на вебинаре. Не повторяет анонс — углубляет тему.',
 'webinar', 11,
 '[{"block_type":"hook_question","label":"Интригующий вопрос + зачин","mode":"header_image"},{"block_type":"insights","label":"Инсайты по теме","mode":"schema_image"},{"block_type":"speaker_short","label":"Спикер (коротко)","mode":"text_only"},{"block_type":"offer_cta","label":"CTA","mode":"accent_block"}]');
```

**Промпты** (`prompts`):
```sql
INSERT INTO prompts (name, slug, category, content_type, provider, model, is_active, step_order,
  system_prompt, user_prompt_template) VALUES
('Приглашение на вебинар — Письмо 1 / Генерация письма',
 'email-builder-webinar-letter-1', 'email_builder', 'email_builder',
 'anthropic', 'claude-sonnet-4-20250514', true, 1,
 'Ты — email-копирайтер.', 'Сгенерируй письмо-приглашение на вебинар.'),
('Приглашение на вебинар — Письмо 2 / Генерация письма',
 'email-builder-webinar-letter-2', 'email_builder', 'email_builder',
 'anthropic', 'claude-sonnet-4-20250514', true, 2,
 'Ты — email-копирайтер.', 'Сгенерируй второе письмо-приглашение на вебинар.');
```

### 2. `src/pages/EmailTemplates.tsx`
- Добавить в `MODE_LABELS` недостающие моды (`header_image` → «Текст + баннер», `schema_image` → «Изображение + текст») — они уже есть как «Заголовок + текст» и «Текст + схема», но блоки используют label, так что отображение корректно через `b.label`.
- Никаких изменений не нужно — страница уже группирует по `category` и покажет новые шаблоны автоматически.

### 3. `src/components/email-builder/BlockLibrary.tsx`
- Добавить в `blockTypeLabels` новые block_type: `hook_situation`, `webinar_program`, `speaker`, `hook_question`, `insights`, `speaker_short` — для корректного отображения в wizard и canvas.

### 4. `supabase/functions/generate-email-letter/index.ts`
- Расширить маппинг prompt slug (строка 210):
  ```
  "Прямой оффер" → "email-builder-direct-offer"
  "Приглашение на вебинар: письмо 1" → "email-builder-webinar-letter-1"
  "Приглашение на вебинар: письмо 2" → "email-builder-webinar-letter-2"
  default → "email-builder-full-letter"
  ```

### 5. `src/components/email-builder/CreateLetterWizard.tsx`
- Добавить флаг `isWebinar` = шаблон из категории `webinar`
- Для вебинарных шаблонов wizard = 3 шага:
  - **Шаг 1**: Выбор шаблона (существующий)
  - **Шаг 2**: Выбор вебинара (новый шаг — Select из офферов `offer_type = 'webinar'`, `is_archived = false`) + выбор аудитории
  - **Шаг 3**: Настройки (название, цветовая гамма)
- При выборе вебинара автоматически заполнять `programId`, `offerId`, `offerType = 'webinar'`
- Загружать офферы-вебинары отдельным запросом (без привязки к программе)

### Итого
- 1 миграция (2 шаблона + 2 промпта)
- 3 файла изменены (`CreateLetterWizard.tsx`, `BlockLibrary.tsx`, `generate-email-letter/index.ts`)


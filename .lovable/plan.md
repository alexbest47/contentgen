

## Несоответствия между обновлённым промптом и кодом

Промпт «Генерация углов отзыва» теперь возвращает:
```json
{
  "id": 1,
  "angle_type": "УЗНАВАНИЕ",
  "angle_title": "...",
  "hook": "...",
  "story_arc": { "before": "...", "turning_point": "...", "after": "..." },
  "key_quote": "..." or null,
  "what_reader_feels": "...",
  "transition_to_offer": "..."
}
```

### Найденные проблемы:

**1. `key_idea` → `key_quote`** (критично)
В `generate-lead-magnets/index.ts` строка 192 маппинг использует `lm.key_idea`, но промпт возвращает `key_quote`. Поле `visual_content` будет пустым.

**2. Новые поля `story_arc` и `what_reader_feels` не сохраняются**
Промпт возвращает эти поля, но они теряются при маппинге в `lead_magnets`. Нужно сохранять их — `story_arc` в `save_reason` (как JSON), `what_reader_feels` в `cta_text`.

**3. `{{case_angle}}` не подставляется в `generate-pipeline`** (критично)
Канальные промпты (Instagram, Telegram, VK, Email) используют `{{case_angle}}`, но в `generate-pipeline/index.ts` нет замены этой переменной. Нужно загружать выбранный lead_magnet и подставлять его JSON.

**4. UI-лейблы устарели**
В `ProjectDetail.tsx` строка 549: «Ключевая идея» → «Ключевая цитата».

**5. `PromptVariables.tsx` ссылается на `key_idea`**
Строка 62: описание `{{case_angle}}` упоминает `key_idea` — нужно обновить на `key_quote`, `story_arc`, `what_reader_feels`.

---

### План изменений:

**1. `supabase/functions/generate-lead-magnets/index.ts`** — обновить маппинг testimonial_content:
- `lm.key_idea` → `lm.key_quote` для `visual_content`
- Сохранить `story_arc` в `save_reason` как `JSON.stringify(lm.story_arc || null)`
- Сохранить `what_reader_feels` в `cta_text`

**2. `supabase/functions/generate-pipeline/index.ts`** — добавить подстановку `{{case_angle}}`:
- После блока `case_data`: загрузить `lead_magnets` для проекта (выбранный угол), сформировать JSON с полями `angle_type`, `angle_title`, `hook`, `key_quote`, `story_arc`, `what_reader_feels`, `transition_to_offer` и подставить в `{{case_angle}}`

**3. `src/pages/ProjectDetail.tsx`** — обновить лейблы:
- «Ключевая идея» → «Ключевая цитата»
- Добавить отображение `story_arc` (из `save_reason`) и `what_reader_feels` (из `cta_text`)

**4. `src/pages/PromptVariables.tsx`** — обновить описание `{{case_angle}}`:
- Заменить `key_idea` на `key_quote, story_arc, what_reader_feels, transition_to_offer`


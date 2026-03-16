

## Добавление типа контента «Провокационный контент»

Задача полностью аналогична тому, как был добавлен `expert_content`. Нужно пройти по всей цепочке: БД → Edge-функция → фронтенд.

### 1. Миграция БД: новое значение enum `prompt_category`

Добавить `provocative_content` в enum `prompt_category`:
```sql
ALTER TYPE public.prompt_category ADD VALUE 'provocative_content';
```

### 2. Вставка 5 пустых промптов-болванок

Через insert tool добавить 5 записей в `prompts`:

| name | slug | content_type | channel | category |
|---|---|---|---|---|
| Генерация тем провокационного контента | provocative-topics | provocative_content | NULL | provocative_content |
| Провокационный контент: Instagram | provocative-instagram | provocative_content | instagram | text_instagram |
| Провокационный контент: Telegram | provocative-telegram | provocative_content | telegram | text_telegram |
| Провокационный контент: VK | provocative-vk | provocative_content | vk | text_vk |
| Провокационный контент: Email | provocative-email | provocative_content | email | text_email |

Все с пустыми `system_prompt` / `user_prompt_template`, `is_active = true`.

### 3. `src/lib/promptConstants.ts`

- Добавить `provocative_content: "Провокационный контент"` в `categoryLabels` и `contentTypeLabels`
- Добавить ветку в `deriveCategory`: `if (contentType === "provocative_content") return "provocative_content"`
- Добавить `provocative_content` в условие показа канала в `PromptFormDialog` (наравне с `lead_magnet` и `expert_content`)

### 4. `src/pages/Prompts.tsx`

- Добавить фильтр `provocativeContentPrompts`
- Добавить вкладку «Провокационный контент» + `renderProvocativeContentTab()` (копия `renderExpertContentTab`)

### 5. `src/pages/OfferDetail.tsx`

- Добавить `"provocative_content"` в тип `generatingType` и в `generateMutation.mutationFn`
- Добавить статусные лейблы для `provocative_content`
- Добавить бейдж «Провокационный контент» в список проектов
- Добавить кнопку «Сгенерировать провокационный контент»

### 6. `supabase/functions/generate-lead-magnets/index.ts`

- Добавить `provocative_content` в маппинг `promptCategory` (→ `"provocative_content"`)
- Добавить маппинг полей (аналогичный `expert_content`: `topic_title→title`, `category→visual_format`, `topic_angle→visual_content`, `hook→instant_value`, `transition_to_offer→transition_to_course`)
- Не обрезать до 3 (как для `expert_content`)

### 7. `src/pages/ProjectDetail.tsx`

- Добавить статусные лейблы для `provocative_content`
- Добавить лейблы полей карточек (аналогично `expert_content`)

### 8. `supabase/functions/generate-pipeline/index.ts`

- Добавить подстановку `{{provocative_post_topic}}` (аналогично `{{expert_post_topic}}` — которую тоже нужно добавить, т.к. она ещё не реализована)

### 9. `src/pages/PromptVariables.tsx`

- Добавить карточку «Провокационный контент» с переменной `{{provocative_post_topic}}`

### 10. `src/components/prompts/PromptFormDialog.tsx`

- Добавить `provocative_content` в условие показа селектора канала

---

**Итого: 1 миграция + 1 вставка данных + 8 файлов кода.**


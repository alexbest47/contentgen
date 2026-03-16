

## Новый тип контента: «Контент-отзыв» (testimonial_content)

Этот тип контента отличается от остальных тем, что вместо генерации вариантов через AI, пользователь сначала **вручную выбирает кейс** из таблицы `case_classifications`, а затем по этому кейсу генерируются 3 угла подачи.

### Уникальный flow

```text
1. Кнопка «Сгенерировать контент-отзыв» на странице оффера
2. Создаётся проект (content_type = "testimonial_content")
3. На странице проекта — таблица классификаций с кнопкой «Выбрать»
4. После выбора кейса → генерация 3 углов (УЗНАВАНИЕ / СОМНЕНИЕ / РЕЗУЛЬТАТ)
5. Выбор угла → генерация контента по каналам (Instagram/Telegram/VK/Email)
```

### Изменения в БД

**1. Новое значение enum `prompt_category`:**
```sql
ALTER TYPE public.prompt_category ADD VALUE 'testimonial_content';
```

**2. Добавить колонку `selected_case_id` в таблицу `projects`:**
```sql
ALTER TABLE public.projects ADD COLUMN selected_case_id uuid REFERENCES public.case_classifications(id);
```

Это хранит выбранный кейс для проектов типа `testimonial_content`.

**3. Вставить 5 промптов-болванок:**
- 1 основной (без channel): «Генерация углов отзыва» — с полным текстом промпта из запроса
- 4 канальных (пустые): Instagram, Telegram, VK, Email

### Изменения в коде

**`src/lib/promptConstants.ts`:**
- Добавить `testimonial_content: "Контент-отзыв"` в `contentTypeLabels` и `categoryLabels`
- Добавить маппинг в `deriveCategory`: `if (contentType === "testimonial_content") return "testimonial_content"`

**`src/pages/OfferDetail.tsx`:**
- Добавить кнопку «Сгенерировать контент-отзыв»
- Для этого типа generateMutation НЕ вызывает `generate-lead-magnets`, а создаёт проект со статусом `draft` (content_type = "testimonial_content") и переходит на страницу проекта
- Добавить бейдж «Контент-отзыв» в список проектов

**`src/pages/ProjectDetail.tsx`:**
- Для `testimonial_content`: вместо lead magnets показать таблицу `case_classifications` с кнопкой «Выбрать» (дублируем UI из CaseManagement, вкладка «Результаты классификации»)
- При выборе кейса: сохранить `selected_case_id` в проект, вызвать `generate-lead-magnets` с `content_type: "testimonial_content"` и `case_classification_id`
- После генерации углов: показать 3 карточки (angle_type, hook, key_idea, transition_to_offer) с кнопкой «Выбрать»
- После выбора угла: показать 4 канала для генерации контента (как обычно)

**`supabase/functions/generate-lead-magnets/index.ts`:**
- Добавить поддержку `content_type = "testimonial_content"`
- При этом типе: получить `case_classification_id` из body, загрузить `case_classifications.classification_json`, подставить в `{{case_data}}`
- Маппинг полей в `lead_magnets`: `angle_title → title`, `angle_type → visual_format`, `key_idea → visual_content`, `hook → instant_value`, `transition_to_offer → transition_to_course`

**`supabase/functions/generate-pipeline/index.ts`:**
- Добавить подстановку `{{case_data}}`: загрузить `case_classifications` по `selected_case_id` проекта и передать JSON

**`src/pages/Prompts.tsx`:**
- Добавить вкладку «Контент-отзыв» с renderTestimonialContentTab (по шаблону expert_content)
- Фильтр: `content_type === "testimonial_content"`

**`src/pages/PromptVariables.tsx`:**
- Добавить секцию «Контент-отзыв» с переменной `{{case_data}}` — полный JSON кейса из case_classifications

### Файлы для изменения
- Миграция: новый enum value + колонка `selected_case_id`
- `src/lib/promptConstants.ts`
- `src/pages/OfferDetail.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/pages/Prompts.tsx`
- `src/pages/PromptVariables.tsx`
- `supabase/functions/generate-lead-magnets/index.ts`
- `supabase/functions/generate-pipeline/index.ts`
- Вставка 5 промптов в БД




## Добавление типа контента «Разбор мифа» (myth_busting)

### Обзор
Новый тип контента `myth_busting` по архитектуре идентичен `expert_content`: 10 тем → выбор одной → 4 канальных пайплайна. Визуал — статичная карточка (без карусели).

### 1. База данных — новый enum value

Миграция SQL:
```sql
ALTER TYPE public.prompt_category ADD VALUE 'myth_busting';
```

### 2. Edge-функция `generate-lead-magnets`

- Добавить `myth_busting` в маппинг `promptCategory` (строка 22): `content_type === "myth_busting" ? "myth_busting"`
- Добавить блок парсинга (аналогично `expert_content`, строки 224-235): маппинг полей `myth_title`→`title`, `category`→`visual_format`, `myth_angle`→`visual_content`, `hook`→`instant_value`, `transition_to_offer`→`transition_to_course`

### 3. Edge-функция `generate-pipeline`

- Добавить `{{myth_topic}}` — контекст выбранной темы мифа (аналогично `expertContext`, строки 125-130)
- Добавить `.replace(/\{\{myth_topic\}\}/g, mythContext)` в подстановку (строка ~163)
- Убедиться, что `myth_busting` не блокируется — функция уже берёт промпт по `content_type` + `channel`

### 4. Edge-функция `generate-content` (если используется)

- Добавить `.replace(/\{\{myth_topic\}\}/g, ...)` в подстановку переменных

### 5. Константы `src/lib/promptConstants.ts`

- `categoryLabels`: добавить `myth_busting: "Разбор мифа"`
- `contentTypeLabels`: добавить `myth_busting: "Разбор мифа"`
- `contentTypeKeys`: автоматически обновится
- `deriveCategory`: добавить `if (contentType === "myth_busting") return "myth_busting";`

### 6. Страница промптов `src/pages/Prompts.tsx`

- Добавить фильтр `mythBustingPrompts`
- Добавить `renderMythBustingTab()` (копия `renderExpertContentTab`)
- Добавить `<TabsTrigger value="myth_busting">Разбор мифа</TabsTrigger>` и `<TabsContent>`

### 7. Страница оффера `src/pages/OfferDetail.tsx`

- Добавить `myth_busting` в union type мутации `generateMutation` (строка 133)
- Добавить `myth_busting: "тем разбора мифа"` в `labelMap`
- Добавить бейдж `myth_busting` → "Разбор мифа" в проектах (строка 221)
- Добавить кнопку «Сгенерировать разбор мифа»

### 8. Страница проекта `src/pages/ProjectDetail.tsx`

- Добавить статусные лейблы для `myth_busting` в `getStatusLabel`
- Добавить отображение полей карточки (аналогично `expert_content`: Категория, Угол подачи, Крючок)

### 9. Страница контента `src/pages/ContentDetail.tsx`

- Добавить `myth_busting` в `supportsCarousel` = false (не поддерживает карусель)
- `supportsStaticImage` = true (поддерживает статичное изображение)

### 10. Переменные промптов `src/pages/PromptVariables.tsx`

- Добавить секцию «Разбор мифа» с переменной `{{myth_topic}}`

### 11. Импорт промптов `supabase/functions/import-prompts-txt/index.ts`

- Добавить алиасы при необходимости (пока пустые — промпты будут загружены вручную)

### Именование промптов в базе
- `Генерация тем разбора мифа` (content_type: myth_busting, channel: null)
- `Разбор мифа: Instagram` (content_type: myth_busting, channel: instagram)
- `Разбор мифа: Telegram` (content_type: myth_busting, channel: telegram)
- `Разбор мифа: VK` (content_type: myth_busting, channel: vk)
- `Разбор мифа: Email` (content_type: myth_busting, channel: email)

### Технические детали
- Маппинг полей JSON → `lead_magnets`: идентичен `expert_content` (`topic_title`→title, `category`→visual_format, `topic_angle`→visual_content, `hook`→instant_value)
- Контекст `{{myth_topic}}`: аналогичен `{{expert_post_topic}}` — текстовое описание выбранной темы


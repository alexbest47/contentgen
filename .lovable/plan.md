

## Добавление нового типа контента «Список» (list_content)

### Обзор
Добавить `list_content` по аналогии с `expert_content` и `provocative_content`: кнопка генерации на странице оффера, маппинг в Edge-функциях, вкладка в управлении промптами, переменная `{{list_topic}}`, 5 промптов-болванок.

### 1. Миграция БД — добавить значение в enum `prompt_category`

```sql
ALTER TYPE public.prompt_category ADD VALUE IF NOT EXISTS 'list_content';
```

### 2. `src/lib/promptConstants.ts`

- Добавить `list_content: "Список"` в `categoryLabels`
- Добавить `list_content: "Список"` в `contentTypeLabels`
- В `deriveCategory`: добавить `if (contentType === "list_content") return "list_content";`
- В условие показа канала в `PromptFormDialog.tsx` (строка 44): добавить `|| form.content_type === "list_content"`

### 3. `src/pages/OfferDetail.tsx`

- В `generateMutation.mutationFn` — добавить `list_content` в тип union (строка 116)
- Добавить `list_content: "тем списка"` в `labelMap` (строка 118)
- Добавить кнопку «Сгенерировать список» (строки 256–267, по аналогии)
- В бейдж проекта (строка 201): добавить `(p as any).content_type === "list_content" ? "Список" :`

### 4. `src/pages/OfferDetail.tsx` + `src/pages/ProjectDetail.tsx` — статусные лейблы

Добавить блок для `list_content`:
```typescript
if (contentType === "list_content") {
  const listLabels = {
    generating_leads: "Генерация тем списка...",
    leads_ready: "Выберите тему списка",
    lead_selected: "Тема списка выбрана",
  };
  if (listLabels[status]) return listLabels[status];
}
```

### 5. `src/pages/ProjectDetail.tsx` — отображение полей списка

Добавить ветку для `list_content` в карточках лид-магнитов (строки 201–224):
```typescript
) : project?.content_type === "list_content" ? (
  <>
    <div><span className="font-medium">Подтип:</span> {lm.visual_format}</div>
    <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
    <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
  </>
```

В `selectMutation` тост (строка 140) — добавить `list_content`.

### 6. `supabase/functions/generate-lead-magnets/index.ts`

- Строка 15: добавить `content_type === "list_content" ? "list_content" :` в маппинг `promptCategory`
- Строка 173: добавить `list_content` в условие `items` (без slice до 3)
- Добавить маппинг полей для `list_content`:

```typescript
if (content_type === "list_content") {
  return {
    project_id,
    title: lm.list_title || lm.title || "Без названия",
    visual_format: lm.subtype || "",
    visual_content: JSON.stringify(lm.items || []),
    instant_value: lm.hook || "",
    save_reason: "",
    transition_to_course: lm.transition_to_offer || "",
    cta_text: "",
  };
}
```

### 7. `supabase/functions/generate-pipeline/index.ts`

Добавить контекст и подстановку `{{list_topic}}` (строки 100–131):

```typescript
const listContext = JSON.stringify({
  id: selectedLead.id,
  subtype: selectedLead.visual_format || "",
  list_title: selectedLead.title,
  hook: selectedLead.instant_value || "",
  items: JSON.parse(selectedLead.visual_content || "[]"),
  transition_to_offer: selectedLead.transition_to_course || "",
});
```

И `.replace(/\{\{list_topic\}\}/g, listContext)` в подстановке.

### 8. `src/pages/ContentDetail.tsx`

- Строка 48: добавить `list_content` в массив типов без карусели:
```typescript
const supportsCarousel = !["expert_content", "provocative_content", "list_content"].includes(...)
```

### 9. `src/pages/Prompts.tsx`

- Добавить фильтр `listContentPrompts` (строка 105)
- Добавить `renderListContentTab()` (по аналогии с `renderProvocativeContentTab`)
- Добавить TabsTrigger и TabsContent для `list_content`

### 10. `src/pages/PromptVariables.tsx`

Добавить карточку «Список» с переменной `{{list_topic}}`:
```typescript
{
  title: "Список",
  variables: [
    { name: "{{list_topic}}", description: "Полный JSON-объект выбранной темы списка (id, subtype, list_title, hook, items, transition_to_offer)", source: "Сгенерированные данные (lead_magnets)" },
  ],
},
```

### 11. Вставка 5 промптов-болванок через миграцию

В той же миграции вставить 5 записей в `prompts`:

1. **Генерация тем списка** — `content_type: list_content`, `channel: null`, `category: list_content` — с полным промптом из запроса пользователя
2. **Пайплайн Instagram** — `content_type: list_content`, `channel: instagram` — болванка
3. **Пайплайн Telegram** — `content_type: list_content`, `channel: telegram` — болванка
4. **Пайплайн VK** — `content_type: list_content`, `channel: vk` — болванка
5. **Пайплайн Email** — `content_type: list_content`, `channel: email` — болванка

### Итого: 9 файлов + 1 миграция

- Миграция: enum + 5 промптов
- `src/lib/promptConstants.ts`
- `src/components/prompts/PromptFormDialog.tsx`
- `src/pages/OfferDetail.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/pages/ContentDetail.tsx`
- `src/pages/Prompts.tsx`
- `src/pages/PromptVariables.tsx`
- `supabase/functions/generate-lead-magnets/index.ts`
- `supabase/functions/generate-pipeline/index.ts`


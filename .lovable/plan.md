

## Исправление маппинга полей провокационного контента

### Проблема
Промпт провокационного контента возвращает JSON с полями `format` и `discussion_trigger`, но Edge-функция маппит `lm.category` (а не `lm.format`) на `visual_format`, и `discussion_trigger` не сохраняется вообще.

### Решение

**Файл: `supabase/functions/generate-lead-magnets/index.ts`**

Разделить ветку `if (content_type === "expert_content" || content_type === "provocative_content")` на две:

1. **`expert_content`** — без изменений:
   - `visual_format` ← `lm.category`

2. **`provocative_content`** — отдельный маппинг:
   - `visual_format` ← `lm.format` (тип провокации)
   - `save_reason` ← `lm.discussion_trigger` (сейчас пустая строка, можно использовать это поле)

Альтернативно: можно в промпте переименовать `format` → `category` и убрать `discussion_trigger`, чтобы формат был идентичен экспертному. Но тогда теряется `discussion_trigger`.

### Рекомендуемый вариант — отдельная ветка в коде:

```typescript
if (content_type === "provocative_content") {
  return {
    project_id,
    title: lm.topic_title || lm.title || "Без названия",
    visual_format: lm.format || "",
    visual_content: lm.topic_angle || "",
    instant_value: lm.hook || "",
    save_reason: lm.discussion_trigger || "",
    transition_to_course: lm.transition_to_offer || "",
    cta_text: "",
  };
}
```

Также нужно обновить **лейблы полей** в `src/pages/ProjectDetail.tsx` для `provocative_content`, чтобы `save_reason` отображался как «Триггер дискуссии» (а не «Причина сохранить»).

### Итого: 2 файла
- `supabase/functions/generate-lead-magnets/index.ts` — отдельная ветка маппинга
- `src/pages/ProjectDetail.tsx` — лейбл «Триггер дискуссии» для поля `save_reason`


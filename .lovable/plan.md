

## Исправить маппинг полей для myth_busting

### Проблема
Парсер в `generate-lead-magnets` объединяет `myth_busting` с `expert_content`, но у промпта другие имена полей. Три поля теряются, два приходят пустыми.

### Решение

**`supabase/functions/generate-lead-magnets/index.ts`** — выделить `myth_busting` в отдельную ветку:

```typescript
if (content_type === "myth_busting") {
  return {
    project_id,
    title: lm.myth_statement || lm.title || "Без названия",
    visual_format: lm.category || "",          // категория по Хормози
    visual_content: lm.myth_angle || "",        // почему миф вреден
    instant_value: lm.hook || "",               // крючок
    save_reason: JSON.stringify({ harm: lm.harm, truth: lm.truth }), // доп. данные
    transition_to_course: lm.transition_to_offer || "",
    cta_text: "",
    target_segment: lm.target_segment || "",
  };
}
```

Маппинг:
| JSON поле | → lead_magnets поле | Назначение |
|---|---|---|
| `myth_statement` | `title` | Формулировка мифа (на карточку) |
| `category` | `visual_format` | Категория по Хормози |
| `myth_angle` | `visual_content` | Почему миф вреден |
| `hook` | `instant_value` | Крючок поста |
| `harm` + `truth` | `save_reason` (JSON) | Вред и правда |
| `transition_to_offer` | `transition_to_course` | Переход к офферу |
| `target_segment` | `target_segment` | Сегмент аудитории |

Также обновить `{{myth_topic}}` в `generate-pipeline` — добавить `harm` и `truth` из `save_reason`.

Одно изменение в двух edge-функциях + редеплой.


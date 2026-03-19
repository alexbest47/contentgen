

## Задача

Удалить 5-й блок «Подборка офферов» (`offer_collection`) из шаблона «История трансформации».

## Изменения

### Обновление данных в `email_templates`

Обновить поле `blocks` записи с `id = '15ce6987-0220-433f-990b-3f85448ca3a4'`, убрав последний элемент массива. Итоговый JSON:

```json
[
  {"block_type": "expert_content", "mode": "text_only"},
  {"block_type": "testimonial_content", "mode": "header_image"},
  {"block_type": "lead_magnet", "mode": "schema_image"},
  {"block_type": "myth_busting", "mode": "header_image"}
]
```

Код не затрагивается — страница `EmailTemplates.tsx` и wizard автоматически покажут обновлённый состав.




## Очистка старых промптов в базе данных

Проблема не в коде UI — он уже обновлён. Проблема в данных: в базе по-прежнему лежат по 3 промпта на каждый канал (Анонс, Прогрев, Конверсия).

### Действия:

1. **SQL-миграция** для очистки данных:
   - Удалить все промпты с `sub_type = 'warmup'` и `sub_type = 'conversion'` (Прогрев и Конверсия)
   - У оставшихся промптов (Анонс) обнулить `sub_type` (`SET sub_type = NULL`)
   - Переименовать оставшиеся промпты: убрать слова «Анонс», «Warmup», «Конверсия» и т.п. из `name`
   - Например: `"Текст поста + все Imagen-промпты: Instagram Анонс"` → `"Текст поста + все Imagen-промпты: Instagram"`

### SQL:
```sql
-- Delete warmup and conversion prompts
DELETE FROM prompts WHERE sub_type IN ('warmup', 'conversion');

-- Clear sub_type on remaining prompts
UPDATE prompts SET sub_type = NULL WHERE sub_type IS NOT NULL;

-- Clean up names: remove strategy suffixes
UPDATE prompts SET name = REPLACE(name, ' Анонс', '') WHERE name LIKE '% Анонс%';
UPDATE prompts SET name = REPLACE(name, ' Announcement', '') WHERE name LIKE '% Announcement%';
```

Код UI менять не нужно — после очистки данных на каждый канал останется по 1 промпту, и страница будет отображать их корректно.


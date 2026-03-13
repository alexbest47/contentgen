

## Добавить поле `save_reason` в систему

### 1. Миграция базы данных
Добавить столбец `save_reason text default ''` в таблицу `lead_magnets`.

### 2. `supabase/functions/generate-lead-magnets/index.ts`
Добавить `save_reason: lm.save_reason || ""` в объект вставки (строка ~128).

### 3. UI — отображение лид-магнитов
В `src/pages/ProjectDetail.tsx` добавить отображение `save_reason` в карточке лид-магнита (рядом с `instant_value` и `transition_to_course`).

### Итого: 1 миграция + 2 файла


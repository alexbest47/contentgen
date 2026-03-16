

## Фильтры и счётчик использования для таблицы выбора кейсов

### 1. Счётчик использования кейса (сколько раз выбран)
Подсчитать количество проектов, ссылающихся на каждый `case_classification.id` через `projects.selected_case_id`. Это делается клиентским запросом — без миграции БД.

**Новый запрос** в `ProjectDetail.tsx`:
```sql
SELECT selected_case_id, count(*) FROM projects 
WHERE selected_case_id IS NOT NULL 
GROUP BY selected_case_id
```
Результат — `Record<string, number>` для отображения в столбце «Использован».

### 2. Фильтры для таблицы кейсов

**`src/pages/ProjectDetail.tsx`** — добавить state-переменные фильтров и UI-элементы над таблицей:

- `filterType` — фильтр по `classification_json.video_type` (Select)
- `filterProduct` — фильтр по `classification_json.products` (Select)  
- `filterTone` — фильтр по `classification_json.emotional_tone` (Select)
- `filterQuality` — фильтр по `classification_json.content_quality` (Select)
- `filterTag` — фильтр по `classification_json.tags` (Select)

Опции для каждого фильтра вычисляются динамически из загруженных `classifications` (unique values). Фильтрация — клиентская, через `.filter()` перед `.map()`.

### 3. Новый столбец «Использован»
Добавить столбец `<TableHead>Использован</TableHead>` в таблицу, отображающий число из счётчика. Если 0 — показать «—», иначе число с бейджем.

### 4. UI фильтров
Ряд `Select`-компонентов над таблицей в flex-контейнере, каждый с опцией «Все» для сброса.


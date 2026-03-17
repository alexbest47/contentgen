

## Система выбора цветовой гаммы

### 1. База данных

**Новая таблица `color_schemes`:**
```sql
CREATE TABLE public.color_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  preview_colors text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```
RLS: authenticated SELECT, admin INSERT/UPDATE/DELETE. Trigger `update_updated_at_column`. Seed 14 гамм.

**Новая колонка в `projects`:**
```sql
ALTER TABLE public.projects ADD COLUMN selected_color_scheme_id uuid REFERENCES public.color_schemes(id);
```

### 2. Страница «Переменные промптов» — секция «Цветовые гаммы»

Новый компонент `ColorSchemesCard` ниже `GlobalVariablesCard`:
- Список всех гамм: цветные квадратики (preview_colors), название, бейдж активна/неактивна, кнопки редактировать/удалить
- Кнопка «+ Добавить»
- Диалог добавления/редактирования: название, hex-цвета через запятую (с превью), textarea описания, switch is_active
- CRUD через Supabase

### 3. Страница `ProjectDetail` — блок выбора гаммы

Между блоком выбранного контента и блоком «Создание контента» (строка ~597):
- Загрузка `color_schemes` где `is_active = true`
- Сетка карточек 3-4 колонки: полоска из цветов + название
- Клик — выделение (ring + галочка), сохранение `selected_color_scheme_id` в `projects`
- Первая активная гамма выбрана по умолчанию если у проекта ещё нет выбора

### 4. Передача `{{brand_style}}` в edge-функции

В 4 функциях (`generate-pipeline`, `generate-content`, `generate-image`, `generate-lead-magnets`):
- Загрузить `selected_color_scheme_id` из проекта → `color_schemes.description`
- Добавить `.replace(/\{\{brand_style\}\}/g, brandStyleValue)` в цепочку подстановок

### 5. Справочник переменных

Добавить `{{brand_style}}` в массив `categories` на странице PromptVariables в секцию «Оффер» или отдельную карточку.

### Файлы

| Файл | Действие |
|---|---|
| Миграция SQL | Создать таблицу + колонку + seed 14 гамм |
| `src/pages/PromptVariables.tsx` | Добавить `ColorSchemesCard` |
| `src/pages/ProjectDetail.tsx` | Добавить блок выбора гаммы |
| `supabase/functions/generate-pipeline/index.ts` | `{{brand_style}}` подстановка |
| `supabase/functions/generate-content/index.ts` | `{{brand_style}}` подстановка |
| `supabase/functions/generate-image/index.ts` | `{{brand_style}}` подстановка |
| `supabase/functions/generate-lead-magnets/index.ts` | `{{brand_style}}` подстановка |


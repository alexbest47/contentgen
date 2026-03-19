

## Задача

Добавить возможность назначать теги платным программам (аналогично офферам), с раздельными переменными для промптов.

## Изменения

### 1. Миграция БД — таблица `program_tags`

Создать таблицу `program_tags` (аналог `offer_tags`):

```sql
CREATE TABLE public.program_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.paid_programs(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (program_id, tag_id)
);

ALTER TABLE public.program_tags ENABLE ROW LEVEL SECURITY;

-- RLS: привязка к владельцу программы
CREATE POLICY "Authenticated can view program_tags" ON public.program_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner or admin can insert program_tags" ON public.program_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM paid_programs WHERE id = program_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owner or admin can delete program_tags" ON public.program_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM paid_programs WHERE id = program_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
```

### 2. UI — `ProgramDetail.tsx`

Добавить в диалог редактирования программы секцию выбора тегов (Badge-кнопки, как в `OfferForm`):
- Загрузить все теги из `tags`
- Загрузить текущие теги программы из `program_tags`
- При сохранении: удалить старые `program_tags` для программы, вставить новые

Также показать текущие теги программы в заголовке страницы (под ссылками на Google Docs).

### 3. Справочник переменных — `PromptVariables.tsx`

Добавить в категорию «Платная программа»:
- `{{program_tags}}` — «Теги аудитории платной программы (через запятую)», источник: `program_tags → tags.name`

Добавить в категорию «Оффер»:
- `{{offer_tags}}` — «Теги аудитории оффера (через запятую)», источник: `offer_tags → tags.name`

### Файлы (3)

1. **Миграция** — новая таблица `program_tags` + RLS
2. **`src/pages/ProgramDetail.tsx`** — UI выбора тегов в диалоге + отображение
3. **`src/pages/PromptVariables.tsx`** — 2 новые переменные




## Добавить карточку «Общее» с редактируемыми переменными

### Суть
На страницу `/prompt-variables` добавить карточку «Общее» с тремя переменными (`{{offer_rules}}`, `{{antiAI_rules}}`, `{{brand_voice}}`), значения которых хранятся в БД и редактируются прямо на странице через текстовые поля.

### Хранение данных
Использовать существующую таблицу `email_settings` не подходит по смыслу. Создать новую таблицу `prompt_global_variables`:

```sql
CREATE TABLE public.prompt_global_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_global_variables ENABLE ROW LEVEL SECURITY;

-- Все авторизованные могут читать
CREATE POLICY "Authenticated can view" ON public.prompt_global_variables
  FOR SELECT TO authenticated USING (true);

-- Только админы могут изменять
CREATE POLICY "Admins can update" ON public.prompt_global_variables
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert" ON public.prompt_global_variables
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed initial rows
INSERT INTO public.prompt_global_variables (key, label) VALUES
  ('offer_rules', 'Адаптация под тип оффера'),
  ('antiAI_rules', 'Требования к тексту — антиAI'),
  ('brand_voice', 'Голос бренда Talentsy');
```

### Изменения в UI

**`src/pages/PromptVariables.tsx`**:
1. Добавить импорты: `useState`, `useEffect`, `supabase`, `Textarea`, `Button`, `toast`, `Loader2`.
2. Добавить хук загрузки данных из `prompt_global_variables` (3 записи по ключам).
3. Перед справочными карточками — новая карточка «Общее» с тремя блоками:
   - Для каждой переменной: имя в `Badge`, описание, и `Textarea` с текущим значением.
   - Кнопка «Сохранить» для каждой переменной (или одна общая).
4. При сохранении — `upsert` в `prompt_global_variables`, toast с результатом.

### Подстановка в edge-функциях (на будущее)
Переменные будут доступны для подстановки в пайплайнах после загрузки из таблицы `prompt_global_variables`. Это отдельный шаг, если потребуется.




## Стили изображений: от одной переменной к 3 пресетам с выбором в визарде

### Суть
Вместо одной переменной `image_style` — создать новую таблицу `image_styles` с 3 пресетами. Каждый пресет имеет название (отображается пользователю) и текст стиля (подставляется в промпты). При создании письма пользователь выбирает стиль изображений наряду с цветовой гаммой. Выбранный стиль сохраняется в `email_letters` и передаётся в генерацию.

### Изменения

**1. Миграция БД**
- Создать таблицу `image_styles` (id, name, description text, is_active boolean default true, created_at)
- Добавить колонку `image_style_id uuid references image_styles(id)` в `email_letters` (nullable)
- RLS: чтение для authenticated, запись для admin
- Вставить 3 начальных записи (названия-заглушки: «Стиль 1», «Стиль 2», «Стиль 3» — пользователь заполнит текст сам)

**2. `src/pages/PromptVariables.tsx`**
- Убрать `image_style` из массива `GLOBAL_VARS` (больше не единая переменная)
- Добавить новую карточку `ImageStylesCard` (по аналогии с `ColorSchemesCard`): CRUD для стилей изображений — название, описание (textarea), активность. Кнопки добавить/редактировать/удалить
- Разместить после `ColorSchemesCard`
- В справочной таблице «Оффер» обновить описание `{{image_style}}`: источник → `image_styles (выбранный стиль)`

**3. `src/components/email-builder/CreateLetterWizard.tsx`**
- Добавить state `imageStyleId`
- Загрузить активные стили: `useQuery` на `image_styles` где `is_active = true`
- На шаге «Настройки» после выбора цветовой гаммы добавить Select «Стиль изображений»
- При создании письма сохранять `image_style_id` в `email_letters`

**4. `supabase/functions/generate-banner-image/index.ts`**
- Вместо загрузки `image_style` из `prompt_global_variables` — принимать `image_style_id` в body
- Загружать текст стиля из таблицы `image_styles` по id
- Если id не передан — фолбэк на `prompt_global_variables.image_style` (обратная совместимость)

**5. `supabase/functions/generate-email-letter/index.ts`**
- После загрузки letter — получить `image_style_id` из letter
- Загрузить `image_styles.description` и подставить в `{{image_style}}`
- Фолбэк на `gv.image_style` если id нет

**6. `supabase/functions/generate-email-block/index.ts`**
- Аналогично: загрузить `image_style_id` из letter, подставить описание в `{{image_style}}`

### Что НЕ трогаем
- Существующую переменную `image_style` в `prompt_global_variables` — оставляем как фолбэк
- Генерацию изображений для проектов (не email) — они продолжают использовать глобальную переменную


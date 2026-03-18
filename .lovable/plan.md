

## Задача

Добавить раздел «Дерево тем», раздел «Шаблоны писем», новый тип блока «Подборка офферов» и переработать флоу создания письма на 3-шаговый wizard.

---

## 1. База данных — 2 миграции

### Миграция 1: Таблица `topic_tree`

```sql
CREATE TABLE public.topic_tree (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.topic_tree(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view topic_tree" ON public.topic_tree FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert topic_tree" ON public.topic_tree FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update topic_tree" ON public.topic_tree FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete topic_tree" ON public.topic_tree FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
```

### Миграция 2: Таблица `email_templates` + столбцы `letter_theme*` в `email_letters`

```sql
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view email_templates" ON public.email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage email_templates" ON public.email_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Добавить тему и шаблон к письму
ALTER TABLE public.email_letters
  ADD COLUMN letter_theme_title text NOT NULL DEFAULT '',
  ADD COLUMN letter_theme_description text NOT NULL DEFAULT '',
  ADD COLUMN template_id uuid REFERENCES public.email_templates(id);

-- Вставить 3 предустановленных шаблона
INSERT INTO public.email_templates (name, description, sort_order, blocks) VALUES
('История трансформации',
 'Длинное письмо-нарратив. Читатель проходит путь от узнавания своей боли через историю реального человека к инструменту и логичному следующему шагу.',
 1,
 '[{"block_type":"expert_content","mode":"text_only"},{"block_type":"testimonial_content","mode":"header_image"},{"block_type":"lead_magnet","mode":"schema_image"},{"block_type":"myth_busting","mode":"header_image"},{"block_type":"offer_collection","mode":"header_image"}]'
),
('Экспертный дайджест',
 'Письмо-журнал с несколькими ценностными материалами и встроенными офферами для регулярной рассылки по базе.',
 2,
 '[{"block_type":"provocative_content","mode":"header_image"},{"block_type":"list_content","mode":"schema_image"},{"block_type":"testimonial_content","mode":"header_image"},{"block_type":"offer_collection","mode":"header_image"},{"block_type":"lead_magnet","mode":"header_image"}]'
),
('Работа с возражением',
 'Письмо, которое снимает один конкретный страх или сомнение. Идеально для реактивации холодной базы.',
 3,
 '[{"block_type":"objection_handling","mode":"header_image"},{"block_type":"expert_content","mode":"text_only"},{"block_type":"testimonial_content","mode":"header_image"},{"block_type":"lead_magnet","mode":"schema_image"},{"block_type":"offer_collection","mode":"header_image"}]'
);
```

---

## 2. Новый тип блока `offer_collection`

### `src/components/email-builder/BlockLibrary.tsx`
- Добавить `"offer_collection"` в `EmailBlockType`
- Добавить в `generatedBlocks`: `{ type: "offer_collection", label: "Подборка офферов", icon: LayoutGrid }`
- Добавить в `blockTypeLabels` и в `isGeneratedBlock`

### `src/components/email-builder/OfferCollectionSettings.tsx` (новый)
Правая панель для `offer_collection`:
- Режим: radio `text_only` / `header_image` (без `schema_image`)
- Заголовок подборки — Input
- Количество: radio 2 / 4
- Для каждого слота: программа → тип оффера → оффер (аналогично GeneratedBlockSettings, но упрощённо)
- Кнопка «Сгенерировать»

### `src/components/email-builder/BlockSettingsPanel.tsx`
- Добавить условие для `offer_collection` → рендерить `OfferCollectionSettings`

### `src/components/email-builder/BlockCanvas.tsx`
- Добавить рендеринг для `offer_collection`: заголовок + сетка карточек (2 в ряд) из config

---

## 3. Раздел «Дерево тем»

### `src/pages/TopicTree.tsx` (новый)
- Загрузка всех `topic_tree` одним запросом, построение дерева на клиенте
- Компонент `TopicNode` — рекурсивный раскрывающийся узел (Collapsible)
- CRUD: добавление на любом уровне, редактирование inline, удаление
- Поиск по title (фильтр на клиенте)
- Кнопка «Импорт JSON»: FileInput → парсинг → Dialog «Добавить / Заменить» → рекурсивная вставка → toast

### `src/App.tsx`
- Добавить маршрут `/topics` → `TopicTree` (adminOnly)

### `src/components/AppSidebar.tsx`
- Добавить в `contentPrepNav` между «Управление кейсами» и «Работа с возражениями»: `{ title: "Дерево тем", url: "/topics", icon: TreePine }`

---

## 4. Раздел «Шаблоны писем»

### `src/pages/EmailTemplates.tsx` (новый)
- Загрузка из `email_templates`, отображение карточками
- Каждая карточка: название, описание, список блоков с иконками из `blockTypeLabels`
- Только просмотр, без CRUD

### `src/App.tsx`
- Добавить маршрут `/email-templates` → `EmailTemplates` (adminOnly)

### `src/components/AppSidebar.tsx`
- Добавить в `adminNav` перед «Управление промптами»: `{ title: "Шаблоны писем", url: "/email-templates", icon: FileTemplate }`

---

## 5. 3-шаговый wizard создания письма

### `src/components/email-builder/CreateLetterWizard.tsx` (новый)
Dialog с 3 шагами, управляемый state `step: 1 | 2 | 3`.

**Шаг 1 — Выбор темы:**
- Поиск + дерево тем из `topic_tree`
- Клик по теме → сохраняет `{ title, description }`
- Поле «Или введите вручную» — снимает выбор в дереве
- Кнопка «Далее»

**Шаг 2 — Выбор шаблона:**
- Карточки из `email_templates` (название, описание, список блоков с иконками)
- Выбор одного
- Кнопка «Далее»

**Шаг 3 — Настройки:**
- Название письма (Input)
- Цветовая гамма (Select из `color_schemes`)
- Кнопка «Создать письмо»

**При создании:**
1. Insert в `email_letters` с `title`, `selected_color_scheme_id`, `letter_theme_title`, `letter_theme_description`, `template_id`
2. Insert блоков из шаблона в `email_letter_blocks` с `block_type`, `config: { mode }`, `sort_order`
3. Navigate → `/email-builder/:id`

### `src/pages/EmailBuilderList.tsx`
- Заменить `createMutation.mutate()` на открытие `CreateLetterWizard`
- При успешном создании — навигация к письму

---

## 6. Тема в промптах и шапке

### `src/components/email-builder/EmailBuilderHeader.tsx`
- Добавить лейбл «Тема: [letter_theme_title]» между названием и badge статуса
- По клику — открывать шаг 1 wizard (отдельный режим «смена темы»)

### `src/pages/EmailBuilder.tsx`
- Загружать `letter_theme_title`, `letter_theme_description` из `email_letters`
- Передавать в `generateBlock` → edge-функция

### `supabase/functions/generate-email-block/index.ts`
- Загружать `letter_theme_title` и `letter_theme_description` из `email_letters` по `letter_id` (передавать `letter_id` из фронта)
- Подставлять `{{letter_theme}}` = `title + "\n" + description`

---

## Файлы (итого ~12)

**Новые страницы:** `TopicTree.tsx`, `EmailTemplates.tsx`
**Новые компоненты:** `CreateLetterWizard.tsx`, `OfferCollectionSettings.tsx`
**Изменяемые:** `App.tsx`, `AppSidebar.tsx`, `BlockLibrary.tsx`, `BlockSettingsPanel.tsx`, `BlockCanvas.tsx`, `EmailBuilderHeader.tsx`, `EmailBuilder.tsx`, `EmailBuilderList.tsx`, `generate-email-block/index.ts`
**Миграции:** 2


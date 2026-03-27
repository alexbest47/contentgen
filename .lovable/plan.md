

## Добавить функциональность «Цепочки писем»

Это большая фича, состоящая из новых таблиц, страниц, визарда и интеграции с очередью задач. Разобью на логические блоки.

---

### 1. SQL-миграция — новые таблицы

**Таблица `email_chain_templates`** — шаблоны цепочек:
- `id`, `name`, `description`, `letter_count` (int), `letters_config` (jsonb — массив с номером, днём, названием, slug промпта, группой), `sort_order`, `created_at`
- RLS: authenticated SELECT, admin ALL

**Таблица `email_chains`** — созданные цепочки:
- `id`, `title`, `template_id` (uuid), `status` (text, default 'generating'), `webinar_offer_id` (uuid), `program_id` (uuid), `selected_color_scheme_id` (uuid), `image_style_id` (uuid), `pdf_material_id` (uuid nullable), `case_id` (uuid nullable), `mini_course_offer_id` (uuid nullable), `created_by` (uuid), `created_at`
- RLS: authenticated SELECT, owner INSERT, owner/admin UPDATE/DELETE

**Таблица `email_chain_letters`** — связь цепочки с письмами:
- `id`, `chain_id` (uuid), `letter_id` (uuid, ref email_letters), `letter_number` (int), `group_name` (text), `slug` (text), `status` (text default 'pending'), `sort_order` (int), `created_at`
- RLS: authenticated SELECT, owner/admin INSERT/UPDATE/DELETE (через join на email_chains.created_by)

**Начальные данные (INSERT):** один шаблон «До и После вебинара» с 16 письмами в `letters_config` JSON (включая 16-е письмо — нужно также добавить промпт `email-webinar-letter-16` в `prompts`).

Также добавить поля в `pdf_materials`: `pdf_reg_title` (text nullable), `pdf_reg_url` (text nullable).

---

### 2. Навигация (`AppSidebar.tsx`)

- В `mainNav`: добавить `{ title: "Конструктор цепочек", url: "/email-chains", icon: Link2 }` после «Конструктор писем»
- В `emailSettingsNav`: добавить `{ title: "Шаблоны цепочек", url: "/chain-templates", icon: Layers }` в конец

---

### 3. Маршруты (`App.tsx`)

Добавить:
- `/email-chains` → `EmailChainList` (доступно всем)
- `/email-chains/:chainId` → `EmailChainDetail` (доступно всем)
- `/chain-templates` → `ChainTemplates` (adminOnly)

---

### 4. Страница «Шаблоны цепочек» (`src/pages/ChainTemplates.tsx`)

Загружает `email_chain_templates`, отображает карточки с названием, описанием и кол-вом писем. Аналог `EmailTemplates.tsx`, но для цепочек.

---

### 5. Страница «Конструктор цепочек» — список (`src/pages/EmailChainList.tsx`)

- Кнопка «+ Новая цепочка» → открывает визард
- Таблица: Название, Шаблон, Тип оффера, Статус (вычисляется из статусов входящих писем), Дата создания, Действия (открыть/удалить)
- Загрузка из `email_chains` + join `email_chain_templates(name)` + подсчёт статусов из `email_chain_letters`
- Polling каждые 5 секунд для обновления статусов

---

### 6. Визард «Новая цепочка» (`src/components/chains/CreateChainWizard.tsx`)

4 шага:

**Шаг 1** — выбор шаблона из `email_chain_templates`

**Шаг 2** — выбор вебинара: Select из `offers` where `offer_type = 'webinar'`. При выборе автоматически определяется `program_id`.

**Шаг 3** — контент (необязательные):
- PDF при регистрации — Select из `pdf_materials` (status = 'ready') + «Пропустить»
- Кейс студента — Select из `case_classifications` + «Пропустить»  
- Мини-курс — Select из `offers` where `offer_type = 'mini_course'` + «Пропустить»
- Подсказка внизу

**Шаг 4** — настройки:
- Название цепочки (input)
- Цветовая гамма (Select из `color_schemes`)
- Стиль изображений (Select из `image_styles`)
- Кнопка «Создать цепочку»

**При создании:**
1. Создать запись в `email_chains`
2. Для каждого из 16 писем: создать `email_letters` + `email_letter_blocks` + `email_chain_letters`
3. Для каждого письма: `enqueue` задачу с `function_name: "generate-email-letter"`, `payload: { letter_id, chain_letter_slug: slug }`, `lane: "claude"`
4. Navigate на `/email-chains/{chainId}`

---

### 7. Страница «Детали цепочки» (`src/pages/EmailChainDetail.tsx`)

- Заголовок + кнопка «Назад»
- Три группы карточек: «До вебинара», «День вебинара», «После вебинара»
- Каждая карточка: номер + день, название, статус-бейдж, кнопка «Открыть письмо» (→ `/email-builder/{letterId}`), кнопка «Перегенерировать» (при ошибке)
- Polling каждые 5с для обновления статусов из `email_chain_letters` join `email_letters`

---

### 8. Edge Function (`generate-email-letter/index.ts`)

Добавить в `TEMPLATE_PROMPT_MAP` маппинг для slug `email-webinar-letter-N` (1–16). При получении `chain_letter_slug` в payload — использовать его напрямую для поиска промпта по slug вместо маппинга через шаблон.

---

### 9. Промпт `email-webinar-letter-16` (INSERT)

Добавить 16-й промпт-заглушку в `prompts` по аналогии с 1–15.

---

### Файлы

| Файл | Изменение |
|------|-----------|
| SQL миграция | Создание 3 таблиц + RLS |
| SQL insert | Шаблон цепочки, 16-й промпт, поля pdf_materials |
| `src/components/AppSidebar.tsx` | +2 пункта навигации |
| `src/App.tsx` | +3 маршрута |
| `src/pages/ChainTemplates.tsx` | Новая страница |
| `src/pages/EmailChainList.tsx` | Новая страница |
| `src/pages/EmailChainDetail.tsx` | Новая страница |
| `src/components/chains/CreateChainWizard.tsx` | Визард 4 шага |
| `supabase/functions/generate-email-letter/index.ts` | Поддержка `chain_letter_slug` |


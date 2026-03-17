

## Конструктор писем — план реализации

Масштабная фича: конструктор email-рассылок с drag-and-drop блоками, генерацией контента через отдельные промпты и экспортом HTML.

---

### 1. База данных

**1a. Новый enum value:**
```sql
ALTER TYPE public.prompt_category ADD VALUE 'email_builder';
```

**1b. Таблица `email_letters` (список писем):**
```sql
CREATE TABLE public.email_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  preheader text NOT NULL DEFAULT '',
  selected_color_scheme_id uuid,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_letters ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated can view, owner/admin can CUD
```

**1c. Таблица `email_letter_blocks` (блоки письма):**
```sql
CREATE TABLE public.email_letter_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES public.email_letters(id) ON DELETE CASCADE,
  block_type text NOT NULL, -- 'lead_magnet','reference_material','expert_content','provocative_content','list_content','testimonial_content','myth_busting','objection_handling','text','image','cta','divider'
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}', -- type-specific settings (program_id, offer_id, lead_magnet_id, mode, etc.)
  generated_html text DEFAULT '',
  banner_image_prompt text DEFAULT '',
  banner_image_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_letter_blocks ENABLE ROW LEVEL SECURITY;
-- RLS: through letter_id → email_letters.created_by
```

---

### 2. Новый enum + константы

- `promptConstants.ts`: добавить `email_builder: "Конструктор email"` в `categoryLabels`, `contentTypeLabels`
- `deriveCategory`: маппинг `email_builder → email_builder`

---

### 3. Роутинг и навигация

- `AppSidebar.tsx`: в `mainNav` после «Платные программы» добавить `{ title: "Конструктор писем", url: "/email-builder", icon: Mail }`
- `App.tsx`: два маршрута:
  - `/email-builder` → `EmailBuilderList` (список писем)
  - `/email-builder/:letterId` → `EmailBuilder` (конструктор)

---

### 4. Страница списка писем (`src/pages/EmailBuilderList.tsx`)

- Таблица: название, тема, дата, статус (Черновик/Готово), кнопки (Открыть/Дубль/Удалить)
- Кнопка «+ Новое письмо» → insert → navigate к `/email-builder/{id}`
- Запросы к `email_letters`

---

### 5. Страница конструктора (`src/pages/EmailBuilder.tsx`)

Основная страница — три колонки:

**Шапка:** Название, Тема (+ кнопка «Сгенерировать» через промпт «Тема и прехедер письма»), Прехедер, Цветовая гамма (dropdown `color_schemes`). Автосохранение каждые 30с. Кнопки «Сгенерировать всё» и «Экспортировать HTML».

**Левая панель (~240px):** Библиотека из 12 блоков (8 генерируемых + 4 пользовательских). Клик → добавляет блок в конец.

**Центральная область (600px):** Превью. Хедер/футер из `email_settings`. Блоки вертикально. Hover → панель управления (настроить/переместить/удалить). Drag-and-drop для реордера (через react state, стрелки вверх/вниз).

**Правая панель (~280px):** Настройки выбранного блока. Содержимое зависит от типа.

---

### 6. Компоненты блоков

**Общий паттерн для 8 генерируемых блоков** — вынести в `src/components/email-builder/GeneratedBlockSettings.tsx`:
1. Режим: Только текст / Текст + изображение (radio)
2. Программа (dropdown `paid_programs`)
3. Тип оффера (dropdown 9 типов)
4. Оффер (dropdown `offers` filtered)
5. Дополнительные поля по типу (lead_magnet → dropdown lead_magnets; expert_content → dropdown topics; testimonial → case + angle; и т.д.)
6. Кнопка «Сгенерировать блок» / «Перегенерировать»

**Пользовательские блоки:**
- Текстовый: простой contenteditable / textarea → inline HTML
- Изображение: upload/URL + alt + align
- CTA: текст + URL + цвет из гаммы
- Разделитель: без настроек

Компоненты:
- `src/components/email-builder/BlockLibrary.tsx`
- `src/components/email-builder/BlockCanvas.tsx`
- `src/components/email-builder/BlockSettingsPanel.tsx`
- `src/components/email-builder/GeneratedBlockSettings.tsx`
- `src/components/email-builder/UserBlockSettings.tsx`
- `src/components/email-builder/EmailBuilderHeader.tsx`

---

### 7. Edge-функция `generate-email-block`

Новая edge-функция:
- Принимает: `block_type`, `program_id`, `offer_id`, `lead_magnet_id` (и т.п. по типу), `color_scheme_id`, `mode` (text_only/text_image)
- Загружает контекст программы/оффера (аналогично `generate-pipeline`)
- Выбирает промпт из `prompts` WHERE `content_type = 'email_builder'` AND `slug = 'email-builder-{block_type}'`
- Подставляет `{{offer_rules}}`, `{{antiAI_rules}}`, `{{brand_voice}}`, `{{brand_style}}` + переменные контекста
- Возвращает `{ block_html, banner_image_prompt }`
- Сохраняет в `email_letter_blocks`

---

### 8. Edge-функция `generate-email-subject`

Новая edge-функция:
- Принимает: `letter_id`
- Загружает все блоки письма, собирает сводку (типы, офферы, темы)
- Вызывает промпт «Тема и прехедер письма» (`content_type = 'email_builder'`, `slug = 'email-builder-subject'`)
- Возвращает `{ subject, preheader }`

---

### 9. Генерация изображений для блоков

При нажатии «Сгенерировать изображение» на блоке:
- Берёт `banner_image_prompt` из блока
- Вызывает существующую `generate-image` или отдельный вызов OpenRouter/Imagen
- Загружает в `generated-images` bucket
- Обновляет `banner_image_url` в блоке

---

### 10. Экспорт HTML

Модальное окно: собирает `headerHtml + блоки по sort_order + footerHtml`. Кнопка «Скопировать».

---

### 11. Вкладка промптов «Конструктор email»

- `Prompts.tsx`: добавить `<TabsTrigger value="email_builder">Конструктор email</TabsTrigger>`
- Рендер по аналогии с другими вкладками (без каналов — все промпты общие)

---

### 12. Промпты-заглушки (9 штук)

| name | slug | content_type | category |
|---|---|---|---|
| Тема и прехедер письма | email-builder-subject | email_builder | email_builder |
| Блок лид-магнита | email-builder-lead_magnet | email_builder | email_builder |
| Блок справочного материала | email-builder-reference_material | email_builder | email_builder |
| Блок экспертного контента | email-builder-expert_content | email_builder | email_builder |
| Блок провокационного контента | email-builder-provocative_content | email_builder | email_builder |
| Блок поста-списка | email-builder-list_content | email_builder | email_builder |
| Блок кейса / отзыва | email-builder-testimonial_content | email_builder | email_builder |
| Блок разбора мифа | email-builder-myth_busting | email_builder | email_builder |
| Блок отработки возражения | email-builder-objection_handling | email_builder | email_builder |

---

### 13. Порядок реализации

Из-за объёма разобью на этапы:

**Этап A (инфра):** Миграции БД (enum + 2 таблицы) + константы + роутинг + сайдбар + вставка промптов

**Этап B (список):** Страница `EmailBuilderList` — CRUD писем

**Этап C (конструктор — скелет):** Три колонки, библиотека блоков, canvas с drag/реордером, шапка с автосохранением, экспорт HTML

**Этап D (настройки блоков):** Правая панель для каждого из 12 типов блоков, пользовательские блоки (текст/изображение/CTA/разделитель)

**Этап E (генерация):** Edge-функции `generate-email-block` + `generate-email-subject`, генерация изображений, «Сгенерировать всё»

**Этап F (промпты):** Вкладка «Конструктор email» в Prompts.tsx

---

### Файлы (новые)
- `src/pages/EmailBuilderList.tsx`
- `src/pages/EmailBuilder.tsx`
- `src/components/email-builder/BlockLibrary.tsx`
- `src/components/email-builder/BlockCanvas.tsx`
- `src/components/email-builder/BlockSettingsPanel.tsx`
- `src/components/email-builder/GeneratedBlockSettings.tsx`
- `src/components/email-builder/UserBlockSettings.tsx`
- `src/components/email-builder/EmailBuilderHeader.tsx`
- `supabase/functions/generate-email-block/index.ts`
- `supabase/functions/generate-email-subject/index.ts`

### Файлы (редактируемые)
- `src/App.tsx` — маршруты
- `src/components/AppSidebar.tsx` — пункт меню
- `src/lib/promptConstants.ts` — enum/labels
- `src/pages/Prompts.tsx` — вкладка
- `src/integrations/supabase/types.ts` — автообновление после миграции




## План: Рефакторинг архитектуры — Офферы + Теги

### Новая иерархия

```text
Платная программа (audience via Google Docs)
  └─ Тип оффера (мини-курс, диагностика, вебинар, ...)
       └─ Конкретный оффер (название + Google Doc описания + теги)
            └─ Проект (лид-магниты → контент)
```

### 1. Изменения в БД (миграции)

**Новый enum `offer_type`:**
- `mini_course`, `diagnostic`, `webinar`, `pre_list`, `new_stream`, `spot_available`, `sale`, `discount`, `download_pdf`

**Новая таблица `offers`** (заменяет `mini_courses`):
- `id`, `program_id`, `offer_type`, `title`, `description`, `doc_url` (Google Doc), `created_by`, `created_at`

**Новая таблица `tags`:**
- `id`, `name`, `created_by`, `created_at`

**Новая таблица `offer_tags`** (связь many-to-many):
- `id`, `offer_id` → `offers.id`, `tag_id` → `tags.id`

**Обновление `projects`:**
- Добавить `offer_id` (FK → `offers.id`)
- Сделать `mini_course_id` nullable (для обратной совместимости, затем можно удалить)

**RLS** на все новые таблицы по тем же паттернам (owner + admin). Теги — доступны всем authenticated на чтение, создание/удаление — всем authenticated.

**Обновление enum `prompt_category`:** добавить значения если потребуется.

### 2. Новые/изменённые страницы

**`ProgramDetail.tsx`** — полная переработка:
- Вместо списка мини-курсов показывать сетку из 9 типов офферов (карточки с иконками)
- Клик → переход на `/programs/:programId/offers/:offerType`

**Новая `OfferTypeDetail.tsx`** (`/programs/:programId/offers/:offerType`):
- Список офферов данного типа для программы
- Кнопка «Создать оффер» → диалог с полями: название, Google Doc URL, выбор тегов (мультиселект)
- Клик по офферу → `/programs/:programId/offers/:offerType/:offerId`

**Новая `OfferDetail.tsx`** (`/programs/:programId/offers/:offerType/:offerId`):
- По сути текущий `CourseDetail.tsx` — список проектов, кнопка генерации лид-магнитов
- Показывает теги оффера

**`ProjectDetail.tsx`** — минимальные изменения:
- Обновить навигацию «назад» на новый URL
- Обновить параметры маршрута

**Новая `Tags.tsx`** (`/tags`):
- Список всех тегов, создание, удаление
- Добавить в сайдбар

### 3. Обновление роутинга (`App.tsx`)

Удалить маршруты с `/courses/`. Добавить:
- `/programs/:programId` — типы офферов
- `/programs/:programId/offers/:offerType` — список офферов
- `/programs/:programId/offers/:offerType/:offerId` — проекты оффера
- `/programs/:programId/offers/:offerType/:offerId/projects/:projectId` — детали проекта
- `/tags` — управление тегами

### 4. Обновление сайдбара

Добавить пункт «Теги» в основную навигацию.

### 5. Обновление Edge Functions

**`generate-lead-magnets`** и **`generate-content`**:
- Заменить запросы к `mini_courses` на `offers`
- Заменить `mini_courses.paid_programs` на `offers` → `paid_programs` join
- Обновить шаблонные переменные: `{{mini_course_title}}` → `{{offer_title}}`, `{{mini_course_description}}` → `{{offer_description}}`

### 6. Что удаляется

- Страница `CourseDetail.tsx` (заменяется `OfferDetail.tsx`)
- Старые маршруты с `/courses/`
- Таблица `mini_courses` останется в БД, но код перестанет её использовать (данные можно мигрировать отдельно)

### Порядок реализации

1. Миграция БД (новые таблицы + RLS)
2. Страница тегов + сайдбар
3. Переработка ProgramDetail (типы офферов)
4. OfferTypeDetail (список офферов)
5. OfferDetail (проекты оффера)
6. Обновление ProjectDetail + роутинг
7. Обновление Edge Functions


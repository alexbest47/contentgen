# ContentGen — Полное описание системы

## 1. Общее описание

**ContentGen** — платформа автоматизации создания маркетингового контента для платных образовательных программ (онлайн-курсы, наставничество, групповые программы). Система позволяет:

- Создавать и управлять офферами (лид-магниты, диагностики, вебинары и т.д.)
- Генерировать контент для 4 каналов: Instagram, Telegram, VK, Email
- Создавать вертикальные видео и изображения в пошаговом конструкторе с AI-генерацией
- Собирать email-письма в блочном конструкторе с AI-генерацией
- Собирать email-цепочки из нескольких писем по шаблону
- Генерировать диагностические квизы с изображениями
- Транскрибировать и классифицировать кейсы клиентов
- Создавать PDF-материалы и баннеры
- Собирать лендинги в визуальном конструкторе из готовых HTML-блоков с AI-генерацией контента и экспортом в ZIP
- Принимать и анализировать email-рассылки конкурентов (Resend inbound → Claude AI анализ)
- Управлять промптами с версионированием и глобальными переменными

---

## 2. Технологический стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, Vite 5, TypeScript 5.8, Tailwind CSS 3, shadcn/ui |
| Роутинг | React Router v6 |
| Состояние | TanStack React Query v5, React Context (Auth) |
| Формы | React Hook Form + Zod |
| UI-компоненты | shadcn/ui (Radix UI), Lucide Icons, Sonner (тосты) |
| Backend | Supabase (PostgreSQL 17, Auth, Storage, 29 Edge Functions на Deno) |
| AI-генерация текста | Anthropic Claude (claude-sonnet-4-20250514) |
| AI-генерация изображений | OpenRouter → Google Gemini Flash 3.1 Image Preview |
| AI-генерация видео | Google Gemini API → Veo 3.1 (Fast / Standard / Lite) |
| Транскрибация | Deepgram (модель nova-2, язык: ru, async webhook) |
| Отправка писем / Inbound email | Resend API (отправка + приём inbound через webhook) |
| Внешние сервисы | Yandex Disk (публичные папки для кейсов), Google Docs, Talentsy KB (TipTap JSON via Supabase cross-project query), Generic URLs |

### Ключевые зависимости

- `@supabase/supabase-js` — клиент Supabase
- `@tanstack/react-query` — серверное состояние и кеширование
- `react-router-dom` — маршрутизация
- `sonner` — уведомления (toast)
- `date-fns` — работа с датами
- `recharts` — графики
- `react-resizable-panels` — разделяемые панели (email-builder)
- `react-hook-form` + `zod` — формы и валидация

---

## 3. Структура проекта

```
src/
├── App.tsx                          # Роутинг, провайдеры
├── main.tsx                         # Точка входа
├── index.css                        # Глобальные стили, CSS-переменные
├── contexts/
│   └── AuthContext.tsx               # Контекст аутентификации (session, user, profile, role)
├── hooks/
│   ├── useTaskQueue.ts              # Хук для добавления задач в очередь
│   ├── usePromptInfo.ts             # Хук для получения информации о промпте
│   ├── use-mobile.tsx               # Определение мобильного устройства
│   └── use-toast.ts                 # Хук для тостов
├── lib/
│   ├── utils.ts                     # cn() и утилиты
│   ├── promptConstants.ts           # Типы/константы промптов, маппинг категорий
│   ├── offerTypes.ts                # 8 типов офферов, группировка
│   ├── bannerConstants.ts           # Типы баннеров, prompt-шаблоны, размеры
│   └── uploadOfferImage.ts          # Загрузка изображений офферов
├── components/
│   ├── AppLayout.tsx                # Лейаут с сайдбаром (SidebarProvider + Outlet)
│   ├── AppSidebar.tsx               # Навигационный сайдбар (5 групп)
│   ├── NavLink.tsx                  # Компонент навигационной ссылки
│   ├── banners/                     # AddBannerDialog, EditBannerDialog, BannerPickerDialog
│   ├── case/                        # ElapsedTime
│   ├── chains/                      # CreateChainWizard (4 шага)
│   ├── email-builder/               # 15+ компонентов блочного конструктора писем
│   ├── offer/                       # ImageUploadField, TopicChoiceDialog
│   ├── landing-builder/              # 8 компонентов конструктора лендингов (+ ImagePositionControl, ImageScaleControl)
│   ├── pdf/                         # CreatePdfWizard
│   ├── project/                     # PipelineResultView
│   ├── prompts/                     # PromptFormDialog, PromptStepCard, PipelineGroup, и др.
│   └── ui/                          # shadcn/ui компоненты (40+)
├── pages/                           # 50+ страниц
└── integrations/supabase/
    ├── client.ts                    # Supabase клиент (авто-генерация)
    └── types.ts                     # TypeScript типы БД (авто-генерация)

supabase/
├── config.toml                      # Конфигурация проекта (verify_jwt = false)
└── functions/                       # 33 Edge Functions (Deno)
```

---

## 4. Иерархия данных

```
Платная программа (paid_programs)
├── Теги аудитории (program_tags → tags)
├── Возражения (objections)
├── Офферы (offers) — 8 типов
│   ├── Контентные: mini_course, diagnostic, webinar, download_pdf
│   └── Продающие: pre_list, new_stream, spot_available, discount
│       └── Проект (projects)
│           ├── Лид-магниты (lead_magnets) — 163 записи
│           └── Контентные части (content_pieces) — 70 записей
├── Промпты (prompts) — 72 записи
│   ├── Версии промптов (prompt_versions) — 92 записи
│   └── Глобальные переменные (prompt_global_variables) — 9 переменных
├── Диагностики (diagnostics) — 27 записей
├── Email-письма (email_letters) — 61 письмо
│   ├── Блоки писем (email_letter_blocks) — 9 блоков
│   └── Шаблоны писем (email_templates) — 8 шаблонов (вкл. service: «Мы до вас не дозвонились»)
├── Email-цепочки (email_chains)
│   ├── Письма в цепочке (email_chain_letters) — связь цепочка→письмо (slug, group_name)
│   └── Шаблоны цепочек (email_chain_templates) — 3 шаблона (вебинарная + прогрев + закрытая заявка)
├── PDF-материалы (pdf_materials) — 8 материалов
├── Баннеры (banners) — 4 баннера
├── Кейсы (case_files) — 228 файлов
│   ├── Задания транскрибации (case_jobs) — 3 задания
│   └── Классификации (case_classifications) — 206 записей
├── Цвет-схемы (color_schemes) — 14 схем
├── Стили изображений (image_styles) — 3 стиля
└── Структура тем (topic_tree) — 329 записей

Видео-проекты (video_projects)
├── Этапы (video_stages) — пошаговый конструктор (фото + видео)
│   ├── stage_type: "image" | "video"
│   ├── model: Gemini Flash 3.1 (image) / Veo 3.1 Fast/Standard/Lite (video)
│   ├── config: aspect_ratio, quality/resolution, duration, generate_audio
│   ├── reference_image_url, start_frame_url → result_url
│   └── task_id → task_queue

Письма конкурентов (competitor_emails)
├── competitor_name (text) — название конкурента (заполняется AI из анализа)
├── from_address — email отправителя
├── html_body / text_body — тело письма (загружается через Resend Receiving API)
├── status: new → fetched → analyzing → analyzed / error
├── resend_email_id — ID для получения тела через Resend API
└── Анализы (competitor_email_analyses) — структурированный JSON от Claude
    ├── email_type, summary, tone, target_audience
    ├── offers[], products[], promotions[], cta_list[]
    ├── urgency_triggers[], key_messages[]
    └── raw_analysis (полный JSON)

Лендинги (landings)
├── Блоки лендинга (landing_blocks) — связь лендинг→определение блока
├── Шаблоны лендингов (landing_templates)
│   └── Блоки шаблонов (landing_template_blocks)
└── Определения блоков (landing_block_definitions) — библиотека HTML-блоков

Очередь задач (task_queue) — 37 задач
```

---

## 5. Маршрутизация

### Основные маршруты (все требуют аутентификации)

| Маршрут | Страница | Описание |
|---------|----------|---------|
| `/` | — | Редирект на `/queue` |
| `/queue` | TaskQueue | Мониторинг очереди задач (фильтр по статусу, lane) |
| `/programs` | Programs | Список платных программ для создания контента |
| `/programs/:programId` | ProgramDetail | Детали программы со списком офферов |
| `/programs/:programId/offers/:offerType` | OfferTypeDetail | Офферы одного типа с проектами |
| `/programs/:programId/offers/:offerType/:offerId` | OfferDetail | Детали оффера, выбор топиков/лидов |
| `/programs/:programId/offers/:offerType/:offerId/projects/:projectId` | ProjectDetail | Детали проекта с генерацией контента |
| `/programs/:programId/offers/:offerType/:offerId/projects/:projectId/content/:contentType` | ContentDetail | Просмотр контента (карусель/статичные изображения) |
| `/vertical-content` | VideoProjectList | Список видео-проектов (инлайн-переименование, удаление) |
| `/vertical-content/:id` | VideoProjectEditor | Конструктор видео-проекта (этапы фото/видео) |
| `/content-plan` | ContentPlan | Календарный контент-план (email, social, events) |
| `/competitor-emails` | CompetitorEmails | Лента писем конкурентов (фильтр по конкуренту/типу, удаление, ручной запуск анализа) |
| `/competitor-emails/:id` | CompetitorEmailDetail | Детальный просмотр письма + анализ JSON (переанализ) |
| `/landings` | LandingList | Список лендингов (конструктор) |
| `/landings/:landingId` | LandingEditor | Визуальный редактор лендинга |
| `/email-builder` | EmailBuilderList | Список email-писем |
| `/email-builder/:letterId` | EmailBuilder | 3-панельный конструктор писем |
| `/email-chains` | EmailChainList | Список email-цепочек |
| `/email-chains/:chainId` | EmailChainDetail | Цепочка с письмами (вебинарная: до/день/после; прогрев: 7 писем; закрытая заявка: 4 письма) |

### Admin-only маршруты

| Маршрут | Страница | Описание |
|---------|----------|---------|
| `/diagnostics` | Diagnostics | Список диагностик |
| `/diagnostics/:diagnosticId` | DiagnosticDetail | Детали диагностики (генерация, статус) |
| `/create-diagnostic` | CreateDiagnostic | Форма создания диагностики |
| `/offers/:offerType` | OfferTypeManagement | CRUD для офферов по типам |
| `/pdf-materials` | PdfMaterials | Список PDF-материалов |
| `/pdf-materials/:id` | PdfMaterialView | Просмотр PDF-материала |
| `/banner-library` | BannerLibrary | Библиотека баннеров (CRUD) |
| `/cases` | CaseManagement | Скан Яндекс.Диска, транскрибация, классификация |
| `/manage-programs` | ManagePrograms | CRUD платных программ |
| `/manage-programs/:programId` | ManageProgramDetail | Редактирование программы |
| `/programs/:programId/objections` | Objections | Возражения для программы |
| `/objections` | ObjectionsHub | Все возражения в системе |
| `/topics` | TopicTree | Иерархическое дерево тем |
| `/email-templates` | EmailTemplates | Шаблоны email-писем |
| `/email-settings` | EmailSettings | Заголовок и футер писем |
| `/chain-templates` | ChainTemplates | Шаблоны цепочек |
| `/prompts` | Prompts | CRUD промптов, версионирование |
| `/diagnostics` | Diagnostics | Список диагностик с инлайн-редактированием |
| `/prompt-variables` | PromptVariables | Глобальные переменные промптов |
| `/tags` | Tags | Теги аудитории |
| `/descriptions` | Descriptions | Описания программ/аудиторий |
| `/archive` | Archive | Архивированные проекты |
| `/users` | UsersAdmin | Управление пользователями |

---

## Post/Carousel split (апрель 2026)

Создание контента разделено на два независимых флоу: «Создание поста» (`/post`) и «Создание карусели» (`/carousel`). У каждого — своя страница со списком проектов и wizard для создания (по аналогии с Email конструктором). Формат проекта сохраняется в `projects.content_format` и пробрасывается в UI/edge-функции через `sub_type` промптов.

### Данные
- `projects.content_format text` (`'post' | 'carousel' | null`) — задаётся при создании проекта в wizard.
- `prompts.sub_type` (`'post' | 'carousel'`) — discriminator канальных промптов.

### Промпты по формату
- **post+carousel пары** (3 семьи × 3 канала = 18 пар):
  - `ref-material-{ig,tg,vk}-{post,carousel}` — различаются JSON-схемой (`static_image_prompt` vs `carousel_prompts`).
  - `text-{ig,tg,vk}-announcement-{post,carousel}` (lead_magnet) — секции CAROUSEL/STATIC и POST_TEXT_* вырезаны под формат.
  - `expert-content-{ig,tg,vk}-{post,carousel}` — добавлены через `INSERT...SELECT` с regex-трансформацией ФОРМАТ КАРТОЧКИ → 3-слайдовая карусель (cover/content/cta) и заменой JSON-схемы на `post_text_carousel + carousel_prompts`.
- **post-only** (12): `provocative/testimonial/myth-busting/objection-handling-{ig,tg,vk}-post`.
- **carousel-only** (3): `list-pipeline-{ig,tg,vk}-carousel`.
- Фикс stale field: 6 carousel-промптов имели `post_text_single` вместо `post_text_carousel` в JSON-схеме — заменено `REPLACE(...)`.
- `channel=''` → `NULL` для 7 общих промптов (`lead-magnets-default`, `ref-material-general`, `*-topics`, `testimonial-angles`).

### Frontend
- **`/post` и `/carousel`** → `src/pages/PostCarouselList.tsx` (generic, prop `format: "post" | "carousel"`). Список проектов отфильтрован по `content_format=format`, объединён с `offers(offer_type, program_id, paid_programs(title))`. Кнопка «Создать» открывает wizard.
- **`CreatePostCarouselWizard`** (`src/components/post-carousel/`) — 2-шаговый Dialog (по образцу `CreateLetterWizard`):
  1. Программа → тип оффера → оффер.
  2. Тип контента → авто/ручная тема → создать. Вызывает `generate-project-name`, инсертит проект с `content_format=format`, ставит `generate-lead-magnets` в очередь (кроме `testimonial_content`/`objection_handling`), переходит в ProjectDetail.
- **Сайдбар** (`AppSidebar`): пункты «Создание поста» → `/post`, «Создание карусели» → `/carousel`.
- **`usePromptInfo`**: фильтр по `sub_type` (часть queryKey).
- **`ProjectDetail`**: `formatLabel(ct.key, projectFormat)` динамически подставляет «Пост / Карусель в Telegram» и т.д.; `pipelineCounts` фильтруются по `sub_type=projectFormat`; `displayTitle` для очереди — «Генерация поста/карусели: …».
- **`ContentDetail`**: пробрасывает `sub_type` в `usePromptInfo` и `projectFormat` в `PipelineResultView`.
- **`PipelineResultView`**: карточка карусели скрыта при `projectFormat==='post'`, карточка одиночной картинки — при `projectFormat==='carousel'`.
- **`OfferDetail`**: список проектов фильтруется ещё и по `content_format=format` (исправляет проблему «открыл /carousel, попал на post-проект»).
- **`TaskQueue`**: бейдж типа задачи теперь показывает «Пост»/«Карусель» вместо общего «Контент». Логика `getDisplayType`: если `display_title` содержит «карусел/пост» — берётся он; иначе извлекается `project_id` из `target_url` (`/projects/<uuid>`), батчем подгружается `projects.content_format`, и формат маппится в `post`(оранжевый)/`carousel`(розовый). Фолбэк — «Контент».

### Edge functions
- `generate-pipeline` дополнительно фильтрует промпт по `sub_type = project.content_format` (или `body.content_format`).

## 6. Навигационный Сайдбар (5 групп + Landing)

### 1. Main
- Queue (Очередь)
- Создание поста (`/post`)
- Создание карусели (`/carousel`)
- Вертикальный контент (`/vertical-content`)
- Контент-план (`/content-plan`)
- Конструктор лендингов (Landing Builder)

### 1.5. Анализ конкурентов
- Письма конкурентов (`/competitor-emails`) — inbound email через Resend webhook
- Email Builder (Email конструктор)
- Email Chains (Email цепочки)

### 2. Offer Prep (Admin only)
- Diagnostics (Диагностики)
- Mini-course (Мини-курс)
- Webinar (Вебинар)
- PDF (PDF-материалы)
- Pre-list (Предварительный список)
- New Stream (Новый поток)
- Spot Available (Место доступно)
- Discount (Скидка)

### 3. Content Prep (Admin only)
- Banner Library (Библиотека баннеров)
- Case Management (Управление кейсами)
- Topic Tree (Структура тем)
- Objections (Возражения)

### 4. Admin
- Programs (Платные программы)
- Tags (Теги)
- Descriptions (Описания)
- Archive (Архив)
- Prompts (Промпты)
- Prompt Variables (Переменные промптов)
- Users (Пользователи)

### 5. Email Settings (Admin only)
- Templates (Шаблоны писем)
- Header/Footer (Заголовок/Футер)
- Chain Templates (Шаблоны цепочек)

---

## 7. Система Очереди Задач

### Архитектура

```
Клиент (useTaskQueue.enqueue)
    ↓
POST /functions/v1/enqueue-task
    ↓ auth via JWT
INSERT task_queue (status: pending)
    ↓
POST /functions/v1/process-queue
    ↓
claim_next_task(p_lane) — SQL RPC
    ↓ atomic claim (pending → processing)
POST /functions/v1/{function_name} — fire-and-forget
    ↓
Целевая функция выполняется
    ↓
completeTask(taskId, result) / failTask(taskId, errorMessage)
    ↓ update task_queue + POST process-queue
process-queue self-chain (если еще pending задачи)
```

### Lanes (3 полосы обработки)
- **claude** (concurrency: 3): Текстовая генерация (все функции с Anthropic Claude)
- **openrouter** (concurrency: 5): Генерация изображений (все функции с OpenRouter/Gemini)
- **google-ai** (concurrency: 3): Генерация видео (Veo 3.1 через Google Gemini API)

### Task Types (для фильтрации в UI)
- **landing**: Генерация лендинг-блоков
- **letter**: Генерация email-писем и блоков писем
- **content**: Генерация контента проектов
- **video**: Генерация фото/видео для вертикального контента
- **competitor**: Анализ писем конкурентов через Claude
- Передаётся через `taskType` параметр в `enqueue()` и сохраняется в `task_queue.task_type`

### Watchdog
Сбрасывает зависшие задачи (processing > 7 мин) → error

### pg_cron Автоматический Watchdog
- Миграция: `20260330100000_process_queue_cron.sql`
- Запускает `process-queue` Edge Function каждую минуту через pg_cron
- Автоматически триггерит обработку если есть pending/processing задачи
- Предотвращает зависание задач при сбое self-chain механизма

---

## 8. Edge Functions (35 функций)

### Управление очередью

| Функция | Назначение | Lane |
|---------|-----------|------|
| enqueue-task | Добавление задачи, auth via getUser (verify_jwt: false), trigger process-queue с serviceKey | — |
| process-queue | Диспетчер: watchdog + claim_next_task + fire-and-forget + self-chain | — |

### Генерация контента

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-content | Генерация маркетингового контента из шаблонов проекта, 15+ переменные подстановки | claude | Yes |
| generate-image | Генерация изображений проекта (карусель/пост/email) via OpenRouter | openrouter | Yes |
| generate-pipeline | Генерация контента для канала (Instagram/Email/Telegram/VK) | claude | Yes |
| generate-pipeline-images | Генерация карусельных/баннерных/статичных изображений для pipeline | openrouter | Yes |
| refine-post-image | Правка существующего изображения (post/carousel/banner/bot_message): fetch текущего URL → base64 → OpenRouter Gemini мультимодально (text+image) → upload в `generated-images` → update `content_pieces` или `bot_chain_messages.image_url`. Режимы: static / carousel (+slide_number) / banner / bot_message | openrouter | Yes |
| generate-lead-magnets | Генерация вариаций лид-магнитов (5 штук), маппинг content_type → prompt category | claude | Yes |
| generate-project-name | Авто-генерация названия проекта (3-6 слов на русском) | claude | No |

### Вертикальный контент (Видео)

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-video-content | Генерация фото (OpenRouter Gemini Flash) и видео (Google Gemini API Veo 3.1). Image-to-video через bytesBase64Encoded start frame. Async polling (predictLongRunning → poll every 10s → download → upload to Storage) | openrouter / google-ai | Yes |

### Email

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-email-block | Генерация блока письма (HTML или изображение), два режима | claude | Yes |
| generate-email-letter | Полная генерация письма: 35+ переменные шаблона (вкл. pre_list_*, mini_course_*, pdf_reg_*), авто-загрузка возражений для warming/closed_lead, retry-логика, JSON parsing с fallbacks | claude | Yes |
| refine-email-letter | Правки сгенерированного письма через Claude: принимает текущий `generated_html` (без header/footer), редактируемый system_prompt + user instructions → обновляет `email_letters.generated_html`. Сохраняет структуру, таблицы, inline-стили, токены. Возвращает `{letter_html}` | claude | Yes |
| send-test-email | Отправка тестового письма via Resend API с инъекцией preheader | — | No |

### Диагностики

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| run-diagnostic-pipeline | Оркестрация: quiz → card prompt → images chain | claude | Yes |
| generate-diagnostic | Генерация JSON квиза с {{IMAGE:PROMPT=...}} плейсхолдерами | claude | No |
| generate-card-prompt | Генерация prompt для карточки/обложки диагностики | claude | Yes |
| generate-diagnostic-images | Генерация отдельных изображений квиза | openrouter | Yes |
| process-diagnostic-image | Цепная обработка изображений диагностики (одно за одним) с отслеживанием прогресса | openrouter | Yes |

### PDF и Баннеры

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-pdf-material | Генерация контента PDF + опциональное фоновое изображение + landing HTML | claude+openrouter | Yes |
| generate-banner-image | Генерация декоративных баннеров с преамбулой (без текста/UI), авто-сохранение в библиотеку | openrouter | Yes |

### Лендинги

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-landing-block | AI-генерация текстового контента для блока лендинга по промпту landing_block_content | claude | Yes |
| generate-landing-image | Генерация изображений для блоков лендинга via OpenRouter (edit/generate/chromakey) | openrouter | Yes |
| export-landing | Экспорт лендинга в ZIP-архив (HTML + CSS + изображения) с JSZip | — | No |
| upload-landing-images | Временная функция: загрузка изображений в Storage по URL (verify_jwt: false, service role key) | — | No |

### Кейсы

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| scan-case-folder | Рекурсивный скан папки Яндекс.Диска, фильтр видеофайлов, дедупликация | — | No |
| transcribe-case-file | Отправка видео на Deepgram async с callback URL | — | No |
| deepgram-callback | Webhook: сохранение транскрипции, trigger классификации + следующий файл | — | No |
| classify-case | Анализ транскрипции via Claude, self-chain к следующему файлу | claude | No |

### Анализ конкурентов

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| inbound-competitor-email | Приём Resend webhook (email.received), svix-верификация, загрузка тела через Resend Receiving API (`/emails/receiving/{id}`), сохранение в competitor_emails. Пользователь запускает анализ вручную из UI | — | No (verify_jwt: false) |
| analyze-competitor-email | Анализ письма конкурента через Claude → структурированный JSON (competitor_name, email_type, summary, offers[], products[], promotions[], cta_list[], urgency_triggers[], key_messages[], tone, target_audience). Сохраняет competitor_name в competitor_emails. Обновляет task_queue статус (completed/error) | claude | Yes (verify_jwt: false) |

### Архитектура inbound email

```
Resend webhook (email.received) → contentgen.talentsy.ru MX records
    ↓
POST /functions/v1/inbound-competitor-email (verify_jwt: false)
    ↓ svix signature verification
    ↓ fetch body: GET https://api.resend.com/emails/receiving/{email_id}
    ↓ (webhook payload содержит ТОЛЬКО метаданные, тело — через отдельный API)
INSERT competitor_emails (status: fetched если есть тело, new если нет)
    ↓
Пользователь нажимает «Анализ» в UI
    ↓
POST /functions/v1/enqueue-task (verify_jwt: false, проверка auth через getUser)
    ↓
process-queue → analyze-competitor-email → Claude API → competitor_email_analyses
    ↓
competitor_emails.competitor_name = analysis.competitor_name
competitor_emails.status = "analyzed"
task_queue.status = "completed"
```

### Утилиты

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| fetch-google-doc | Универсальный фетч документов: Google Docs (export TXT), Talentsy KB (TipTap→text через Supabase cross-project API), Generic URLs (HTML→text). Вызывается всеми generate-* функциями для получения свежего контента по doc_url | — | No |
| refine-prompt | AI-улучшение промпта, архивирование версии, сохранение {{placehdolders}} | claude | Yes |
| import-prompts-txt | Bulk import промптов из TXT с NAME_ALIASES маппингом | — | No |

---

## 8.1. Паттерн свежего контента (doc_url) + сегмент аудитории

### Принцип: «Segment override → fetch fresh → update cache → fallback»

Все Edge Functions, использующие `audience_description`, следуют единому паттерну с поддержкой выбранного сегмента аудитории:

```typescript
// audienceSegment — ключ, выбранный пользователем в визарде
// (projects.audience_segment / email_letters.audience_segment)
let audienceDescription = "";
if (audienceSegment && gv[audienceSegment]) {
  // 1. Сегмент выбран и для него есть запись в prompt_global_variables →
  //    берём описание оттуда (фиксированные тексты для «С нуля — для себя»,
  //    «Переквалификация», «С дипломом» и т.д.)
  audienceDescription = gv[audienceSegment];
} else {
  // 2. Сегмент не выбран → всегда пытаемся получить свежий контент по URL
  if (program.audience_doc_url) {
    try {
      audienceDescription = await fetchDocContent(program.audience_doc_url);
      if (audienceDescription) {
        // обновляем кеш в БД
        await supabase.from("paid_programs")
          .update({ audience_description: audienceDescription })
          .eq("id", program.id);
      }
    } catch (docErr) { console.error("Error fetching audience doc:", docErr); }
  }
  // 3. Fallback: если URL не отдал контент, берём из кеша программы
  if (!audienceDescription) audienceDescription = program.audience_description || "";
}
```

### Две независимые переменные в user-промптах

| Переменная | Источник | Смысл |
|---|---|---|
| `{{audience_description}}` | `prompt_global_variables[segment]` ИЛИ `paid_programs.audience_doc_url`/`audience_description` | Развёрнутое описание ЦА — либо текст выбранного сегмента, либо общее описание программы |
| `{{audience_segment}}` | `projects.audience_segment` / `email_letters.audience_segment` | Ключ выбранного пользователем сегмента (например `audience_from_scratch_personal`). Добавляет фокус и явно сигнализирует LLM о целевом срезе |

**Правило:** обе переменные должны присутствовать в каждом user-промпте генерации контента. В шаблонах `{{audience_description}}` сопровождается строкой:

```
ФОКУС НА СЕГМЕНТЕ АУДИТОРИИ: {{audience_segment}}
```

Массовый апдейт БД (2026-04-08) добавил эту строку в 76 активных промптов: все цепочки писем (warming/closed/webinar), все content-промпты для Instagram/Telegram/VK (post + carousel × 7 направлений), `*-topics`, `testimonial-angles`, `list-pipeline-*`, `list-topics-generation`, `lead-magnets-default`, `ref-material-general`. Исключены: `landing-block-*`, `generate-pdf-material`, `diagn-card-prompt-generation-default`, `test-generation-default` (там сегмент не имеет смысла).

### Колонка `audience_segment` присутствует в:
- `projects.audience_segment` (text)
- `email_letters.audience_segment` (text)

Собирается в `CreatePostCarouselWizard` (step 2) и `CreateLetterWizard` (Audience step) из константы `AUDIENCE_SEGMENTS`.

### Функции с этим паттерном (все задеплоены с `verify_jwt=false`)
- `generate-content` (v5+), `generate-pipeline` (v8+)
- `generate-email-letter` (v15+)
- `generate-lead-magnets` (v11+)
- `generate-image`, `generate-email-block`
- `run-diagnostic-pipeline`, `generate-diagnostic`, `generate-card-prompt`

### Почему verify_jwt=false

После перехода Supabase на новый формат ключей `sb_secret_*` (не-JWT), `process-queue` вызывает worker-функции с `Authorization: Bearer ${SERVICE_ROLE_KEY}`, но шлюз с `verify_jwt=true` отклоняет такой токен как невалидный JWT с 401 — **до** запуска кода функции, поэтому `failTask` никогда не вызывается и задачи «виснут» в `processing` без `error_message`. Все worker-функции переведены на `verify_jwt=false` для согласования с `process-queue`. Функция `enqueue-task` также переведена на `verify_jwt=false` с проверкой auth через `getUser(token)` внутри функции, т.к. gateway отклонял валидные frontend-токены.

### fetch-google-doc: Определение типа URL
```typescript
function detectUrl(url: string) → "google_docs" | "talentsy_kb" | "generic"
```
- **Google Docs**: `docs.google.com/document/d/{id}` → export как text/plain
- **Talentsy KB**: `talentsy-kb.vercel.app/share/tk_*` → Supabase REST API → TipTap JSON → plain text через `tiptapToText()`
- **Generic**: любой другой URL → fetch HTML → extract text

### Известная ошибка (исправлена)
Ранее `fetch-google-doc` был задеплоен со старой версией, которая не поддерживала Talentsy KB URL и возвращала `{"error":"Invalid Google Docs URL"}`. Все doc_url ссылки на Talentsy KB молча падали. Исправлено деплоем v4.

---

## 9. Система Промптов

### Категории (21 категория)
- lead_magnets
- slide_structure
- text_instagram
- text_vk
- text_telegram
- text_email
- test_generation
- image_carousel
- image_post
- image_email
- reference_materials
- expert_content
- provocative_content
- list_content
- case_analysis
- testimonial_content
- myth_busting
- objection_handling
- email_builder
- pdf_generation
- landing_block_content

### Контентные типы (13 типов)
- lead_magnet, quiz, guide, workbook, slide, post, email, banner, diagnostic, case, pdf, competitor, custom

### Каналы (4 канала + 4 email-специфичных)
- Контентные: instagram, telegram, vk, email
- Email Builder: webinar_before, webinar_after, warming, closed_lead

### Версионирование
- Таблица `prompt_versions` с change_type (manual/ai_refine)
- Архивирование старых версий

### Глобальные переменные
- 9 переменных в `prompt_global_variables`
- {{program_title}}, {{audience_description}}, {{offer_title}}, {{image_style}}, {{color_scheme}}, {{case_text}}, {{objection_text}}, и др.

### Подстановки шаблонов
15+ переменные в content_pieces и email_letters:
- {{program_title}}, {{audience_description}}, {{offer_title}}, {{image_style}}, {{color_scheme}}, {{case_text}}, {{objection_text}}, {{topic_name}}, {{channel}}, {{language}}, {{expert_name}}, {{webinar_date}}, {{webinar_time}}, {{webinar_link}}, {{registration_link}}

---

## 10. Email Builder

### Архитектура
3-панельный редактор:
- **BlockLibrary**: Доступные типы блоков
- **BlockCanvas**: Визуальное рабочее пространство
- **BlockSettingsPanel**: Настройки выбранного блока

### Типы блоков
- testimonial_content
- objection_handling
- paid_programs_collection
- free_courses_grid
- diagnostics_grid (готовый блок «Подборка диагностик»: сетки 2×1/2×2/2×3, выбор записей из таблицы `diagnostics`, ячейка = image + name + ссылка «Пройти бесплатно →» на `doc_url`; заголовок «Пройдите бесплатное диагностическое тестирование»)
- offer_collection
- card
- text
- image
- cta
- divider

### Webinar Template Blocks
- hook_situation
- webinar_program
- speaker
- offer_cta
- hook_question
- insights
- speaker_short

### Компоненты Settings
- GeneratedBlockSettings
- UserBlockSettings
- CardBlockSettings
- OfferCollectionSettings
- PaidProgramsCollectionSettings
- FreeCoursesGridSettings

### CreateLetterWizard (адаптивное количество шагов)
Визард адаптируется под тип шаблона:
- **Service** (category=service, напр. «Мы до вас не дозвонились»): 1 шаг — выбор шаблона → сразу создание письма
- **3-step** (Прямой оффер, Вебинар, Доверимся ИИ, Мультиоффер): Template → Audience → Settings
- **4-step FreeForm** (С нуля): Template → Audience → Settings → Description
- **4-step Default** (История трансформации и др.): Template → Topic → Audience → Settings

### Плейсхолдеры изображений
- {{IMAGE:PROMPT=...}} в HTML
- Кнопки генерации появляются только если `image_placeholders` массив непустой

### CSS Reset для email-контента (BlockCanvas)
Email HTML рендерится в contentEditable контейнере. Чтобы таблицы не ломались:
- Контейнер: `style={{ maxWidth: "100%", overflow: "hidden" }}` — **НЕ** `wordBreak: "break-word"` (ломает таблицы, вертикальный текст)
- CSS Reset инжектируется в HTML: `table { table-layout: auto; max-width: 100%; }`, `td { word-break: normal !important; }`

### Autosave
- Debounce 2 сек при редактировании

---

## 11. Email Цепочки

### CreateChainWizard (4 шага)
1. Template — выбор шаблона цепочки (вебинарная, прогрев после заявки или закрытая заявка)
2. Webinar/Program — выбор вебинара (для вебинарной) или платной программы (для прогрева и закрытой заявки)
3. Optional Content — PDF-материал, кейс студента, мини-курс (необязательно) + оффер предзаписи (обязательно для closed_lead)
4. Settings — название цепочки, цветовая гамма, стиль изображений + сводка (вкл. предзапись для closed_lead)

**ВАЖНО**: Derived state (selectedTemplate, isWarming, isClosedLead, isProgramBased, selectedWebinar, selectedProgram) ДОЛЖЕН быть объявлен ПЕРЕД useQuery хуками, которые его используют в `enabled`. Иначе — Temporal Dead Zone crash при переходе на шаг 3.

### Три типа цепочек
- **Вебинарная** (`chain_type: "webinar"`) — 16 писем до/во время/после вебинара, привязка к webinar offer
- **Прогрев после заявки** (`chain_type: "warming"`) — 7 писем для нурминга лидов с заявок на платный продукт, привязка напрямую к программе (без вебинара)
- **Закрытая заявка** (`chain_type: "closed_lead"`) — 4 письма для лидов, чью заявку менеджер закрыл как нереализованную, привязка напрямую к программе

### Warming Chain — 7 писем (1 в день)
1. Welcome: Добро пожаловать в Talentsy
2. Экспертное: Профессия будущего
3. Кейс: История выпускника
4. Программа: Что вы получите (+ PDF)
5. Возражения: Честные ответы
6. Мотивация: Первый шаг сделан
7. Подарок: Курс в подарок (мини-курс)

### Closed Lead Chain — 4 письма
1. Мы закрыли вашу заявку, но… (+ PDF в подарок)
2. Бесплатный мини-курс в подарок (+ кейс студента)
3. Честные ответы + соцсети (отработка возражений, ссылки VK/Telegram/YouTube)
4. Предзапись на программу (преимущества программы → баннер → ценность предзаписи → CTA)

### Предзапись (письмо 4 closed_lead)
- На шаге 3 CreateChainWizard пользователь выбирает оффер типа `pre_list` для выбранной программы (обязательное поле)
- Данные оффера (title, description, landing_url) передаются через `pre_list_offer_id` в `email_chains` и `email_letters`
- Edge function `generate-email-letter` загружает данные и подставляет переменные: `{{pre_list_title}}`, `{{pre_list_description}}`, `{{pre_list_url}}`

### Отдельные шаблоны писем
- **Мы до вас не дозвонились** — универсальное триггерное сервисное письмо, без привязки к программе. Категория: `service`. В CreateLetterWizard — одношаговый флоу: выбрал шаблон → нажал «Создать письмо» → сразу переход в конструктор (без выбора программы, аудитории, офферов).

### Таблицы
- `email_chains` — цепочки (webinar_offer_id nullable для warming и closed_lead, pre_list_offer_id для closed_lead)
- `email_chain_letters` — связи письма-цепочка (slug → promptSlug для генерации)
- `email_chain_templates` — шаблоны цепочек (поле `chain_type`: "webinar" | "warming" | "closed_lead", `letters_config` JSON)
- `email_letters` — письма (pre_list_offer_id для предзаписи в closed_lead цепочках)

### Группировка писем (EmailChainDetail)
- before: До вебинара
- webinar_day: День вебинара
- after: После вебинара
- warming: Прогрев после заявки
- closed: Письма после закрытой заявки

---

## 12. Диагностики

### Pipeline
```
CreateDiagnostic → run-diagnostic-pipeline → generate-diagnostic →
generate-card-prompt → process-diagnostic-image (chain)
```

### Статусы
- draft → generating → quiz_generated → generating_images → ready

### Хранилище
- Bucket: quiz-images
- Таблица: diagnostics

---

## 13. PDF Материалы

### Типы
- checklists (Чек-листы)
- guides (Гайды)
- workbooks (Воркбуки)

### Поля
- landing_html
- landing_headline
- landing_slug
- landing_descriptor
- landing_button_text
- landing_modal_type_word
- pdf_reg_title
- pdf_reg_url

### Статусы
- generating → ready

---

## 14. Конструктор Лендингов (Landing Builder)

### Архитектура
Визуальный блочный конструктор лендингов для создания посадочных страниц из готовых HTML-блоков с AI-генерацией контента и экспортом в ZIP.

### Компоненты (`components/landing-builder/`)
- **BlockLibraryModal** — Модальное окно библиотеки блоков с мини-превью (scaled iframe)
- **CreateLandingWizard** — Визард создания нового лендинга (выбор шаблона, программы)
- **LandingBlockCanvas** — Визуальное рабочее пространство для размещения блоков
- **LandingBlockLibrary** — Каталог доступных блоков (по категориям)
- **LandingBlockSettingsPanel** — Панель настроек блока (editable_fields, ImagePositionControl, ImageScaleControl, цвета фона секции/карточек)
- **LandingInlinePreview** — Инлайн-превью лендинга
- **RichTextEditor** — Rich-текст редактор для контента блоков

### Страницы
- **LandingList** (`/landings`) — Список всех лендингов с создание/удалением
- **LandingEditor** (`/landings/:landingId`) — 3-панельный редактор (библиотека блоков + канвас + настройки), экспорт в ZIP

### Таблицы (5 таблиц)
- `landing_templates` — Шаблоны лендингов (slug, template_type, preview_image_url)
- `landing_block_definitions` — Библиотека HTML-блоков (block_type, category, html_template, editable_fields, default_settings)
- `landings` — Пользовательские лендинги (template_id, program_id, status: draft, accent_color)
- `landing_blocks` — Блоки на лендинге (block_definition_id, sort_order, settings, content_overrides, custom_css)
- `landing_template_blocks` — Предустановленные блоки для шаблонов

### Шаблоны лендингов (3 шаблона)
- **Профессия с нуля** (`profession`) — длинный лендинг платной программы (эталон — «Психолог-консультант»), 20+ блоков
- **Предзапись** (`preorder`) — короткий лендинг предзаписи: header → hero_preorder → preorder_benefits → megabonuses
- **Специализация** (`specialization`) — короткий лендинг специализации: header → hero_stats_gestalt

### Категории блоков (41+ определений)
- Шапка и навигация (promo_banner, header)
- Hero и УТП (hero_stats, hero_stats_gestalt, hero_preorder, preorder_benefits, audience_market, audience_market_2, social_proof_stat, social_proof_banner_2)
- Контентные блоки (materials_grid, megabonuses и др.)

### Ключевые механики конструктора
- **content_overrides**: JSONB с текстовыми подменами, `_image_overrides` (URL замены изображений), `_video_overrides` (URL замены видео), `_image_positions` (позиционные смещения), `_image_scales` (масштабирование)
- **_image_overrides**: Маппинг `{ "img/path/file.png": "https://supabase-url..." }` — заменяет src всех изображений + форматные варианты (jpg↔webp↔png)
- **_image_positions**: Маппинг `{ "img/path/file.png": { x: 0, y: -20 } }` — CSS `transform: translate()` для подгонки AI-сгенерированных изображений (только hero-блоки). Стрелки в панели настроек, шаг 5px, клавиатурное управление.
- **_image_scales**: Маппинг `{ "img/path/file.png": 1.2 }` — CSS `transform: scale()` для пропорционального масштабирования изображений (все блоки). Кнопки ZoomIn/ZoomOut, шаг 5%, диапазон 20%–300%. Совмещается с translate в одном transform.
- **Настройки оформления (settings)**: `background_color` (фон секции) и `card_color` (фон карточек). Применяются через CSS-инъекцию в превью. Текст и акцентный цвет удалены как избыточные.
- **Глобальный акцентный цвет лендинга** (`landings.accent_color`): Hex-значение, переопределяющее всю фиолетовую палитру шаблона на выбранную. Picker с пресетами + произвольный color picker в тулбаре LandingEditor. Применяется тремя способами одновременно: (1) hex-замена в HTML каждого блока (ловит инлайн-стили), (2) hex-замена в загруженных CSS-файлах шаблона (ловит псевдоэлементы), (3) CSS-переопределения с `!important` для CSS-переменных (`--color-purple`, `--color-purple-dark`, `--color-purple-gradient`) и 40+ классов. Из одного цвета генерируется палитра из 6 оттенков (primary/dark/hoverDark/light/muted/veryLight), которые заменяют 9 исходных hex-значений: #7835FF, #6957CE, #5443AF, #B1A4FF, #865ad0, #8147FF, #AE1AE8, #EAE5FF, #6525e0. Сохраняется в БД мгновенно при выборе и работает как в превью, так и при ZIP-экспорте.
- **Inline preview**: iframe с `srcdoc`, `buildPreviewHtml()` генерирует полный HTML, `applyContentOverrides()` подставляет значения, `postMessage` для click-to-edit
- **Библиотека блоков**: BlockLibraryModal с мини-превью (масштабированный iframe 1200→280px, scale 0.233), одна колонка, thumbnail + описание
- **Auto-save**: Debounced 2s через `triggerSave()` → `saveAllBlocks()` с `blocksRef.current`

### Edge Functions
- `generate-landing-block` — AI-генерация текстового контента (lane: claude)
- `generate-landing-image` — Генерация изображений для блоков (lane: openrouter)
- `export-landing` — Экспорт в ZIP (HTML + CSS + изображения) через JSZip
- `upload-landing-images` — Временная функция загрузки изображений в Storage (verify_jwt: false, service role key)

### Storage
- Bucket `landing-assets` — загруженные пользователем изображения блоков
- Bucket `generated-images` — AI-сгенерированные изображения (также для дефолтных изображений блоков в `generated-images/landing-blocks/`)

### Миграции
- `20260401120000_landing_constructor.sql` — 5 таблиц, RLS policies, индексы
- `20260401120001_landing_seed_data.sql` — Seed-данные: 38 определений блоков
- `20260401130000_landing_block_content_category.sql` — Добавление prompt_category 'landing_block_content'
- `20260402120000_landing_block_hero_preorder.sql` — Блок hero_preorder (предзапись с бонусами)
- `20260402130000_landing_block_preorder_benefits.sql` — Блок preorder_benefits (две карточки выгод)
- `20260402140000_landing_block_megabonuses.sql` — Блок megabonuses (6 мегабонусов)
- `add_accent_color_to_landings` (2026-04-06) — Колонка `accent_color text` в таблице `landings` для глобальной смены цветовой гаммы лендинга

---

## 15. Баннеры

### Типы
- header_banner (600×200)
- case_card (600×240)
- program_banner (600×220)
- custom (пользовательский размер)

### BANNER_PROMPT_TEMPLATES
- Шаблоны сцен и layouts
- Преамбула запрещает: текст, водяные знаки, UI элементы

### Маппинг плейсхолдеров
- image_placeholder_1 → header_banner
- image_placeholder_2 → case_card
- image_placeholder_3 → program_banner
- image_placeholder_4 → program_banner

---

## 15.1. Контент-План (Content Plan)

Календарный планировщик контента с поддержкой email, социальных сетей и событий.

### Страница
- Маршрут: `/content-plan`
- Компонент: `src/pages/ContentPlan.tsx`
- Диалог добавления: `src/components/AddToContentPlanDialog.tsx`

### Виды календаря
- **Месяц** — 7-колоночная сетка дней, записи отображаются как цветные бейджи
- **Неделя** — вертикальный список дней с детализацией записей

### Типы записей
- **Email** (синий) — привязка к email_letters, отслеживание сегмента аудитории
- **Social** (зелёный) — посты/карусели, привязка к social_accounts (Instagram, Telegram, VK, YouTube, TikTok, Facebook, X, Threads, Дзен)
- **Event** (оранжевый) — вебинары, марафоны, старт потоков, праздники, кастомные типы

### Статусы записей (email и social)
- `todo` — "Нужно подготовить"
- `ready` — "Готово к отправке / публикации"
- `done` — "Опубликовано / отправлено"

### Функциональность
- Создание, редактирование, удаление записей
- Drag & Drop перемещение между датами (HTML5 drag/drop)
- Фильтрация по типу, программе, соц. аккаунту, автору
- Привязка email-писем и постов к записям плана
- Кастомные типы событий с пользовательскими цветами
- Отображение авторов записей (связь с profiles)

### Таблицы БД
- `content_plan_items` — основная таблица записей (id, date, type, title, description, status, program_id, letter_id, post_id, social_type, event_type, custom_event_type_id, audience_segment, created_by)
- `content_plan_social_accounts` — junction-таблица (item_id → account_id)
- `social_accounts` — аккаунты соц. сетей (platform, account_name, is_active)
- `custom_event_types` — кастомные типы событий (name, color, icon)

### Интеграции
- Email Builder — добавление писем в план, открытие связанных писем
- Посты/Карусели — добавление в план через AddToContentPlanDialog
- Программы — фильтрация и привязка записей к paid_programs

---

## 16. Pipeline Управления Кейсами

```
scan-case-folder → case_jobs + case_files →
transcribe-case-file → Deepgram (async webhook) →
deepgram-callback → classify-case (Claude, self-chaining)
```

### Поддерживаемые видеоформаты
- mp4, mov, mkv, avi, webm

### Статусы файлов
- pending → downloading → transcribing → transcribed → classifying → classified / error

---

## 17. Аутентификация и Роли

### Supabase Auth
- Email + password
- Session management via AuthContext

### AuthContext
- `session`: Текущая сессия пользователя
- `user`: Данные пользователя Supabase
- `profile`: Расширенный профиль (имя, аватар и т.д.)
- `role`: Роль (admin/user)
- `isAdmin`: Булев флаг
- `loading`: Флаг загрузки
- `signOut()`: Выход

### Роли (app_role enum)
- admin
- user

### Функции безопасности
- `has_role()` SECURITY DEFINER для RLS-проверок
- `handle_new_user` trigger для авто-создания профиля

### Компоненты
- ProtectedRoute с adminOnly prop
- Редирект на /login для неаутентифицированных

---

## 18. Storage Buckets

| Bucket | Назначение |
|--------|-----------|
| generated-images | Генерируемые изображения контента + дефолтные изображения блоков лендинга |
| quiz-images | Изображения диагностических квизов |
| offer-images | Изображения-обложки офферов |
| landing-assets | Загруженные/AI-сгенерированные изображения блоков лендинга |

### Локальный генерируемый контент
- Папка: `public/generated_content/`
- Содержит примеры сгенерированного контента для 5 программ:
  - Гештальт-терапевт, Декоратор интерьера, Дизайнер одежды, Интегративный нутрициолог, КПТ-терапевт
- Файлы: `test_diagnostic.txt`, `pdf_lead_magnet.txt`, `diagnostic_image.png`

---

## 19. Цветовые Схемы и Стили Изображений

### Color Schemes (14 схем)
- Таблица: `color_schemes`
- Поля: name, description, preview_colors[], is_active
- Используются в Email Builder и контент-генерации

### Image Styles (3 стиля)
- Таблица: `image_styles`
- Поля: name, description, is_active
- Используются в промптах для стилизации изображений

---

## 20. Структура Тем (Topic Tree)

- Таблица: `topic_tree` (329 записей)
- Иерархия: parent_id self-reference
- Поля: name, description, sort_order, tags[]
- Используется для организации контента по темам

---

## 21. Возражения (Objections)

- Таблица: `objections` (20 записей)
- Поля: objection_text, program_id, tags[], created_by
- Используются в email-builder и контент-генерации для создания возражений-блоков

---

## 22. Полный Список Таблиц БД (47 таблиц)

| Таблица | Строк | Назначение |
|---------|-------|-----------|
| profiles | 1 | Профили пользователей |
| user_roles | 1 | Роли (admin/user) |
| paid_programs | 26 | Платные программы обучения |
| offers | 16 | Офферы (8 типов) |
| offer_tags | 0 | Связь offer-tag |
| projects | 37 | Проекты генерации контента |
| lead_magnets | 163 | Генерируемые лид-магниты |
| content_pieces | 70 | Генерируемые контентные части |
| generation_runs | 122 | Логи запусков генерации |
| prompts | 67 | AI-промпты |
| prompt_versions | 92 | История версий промптов |
| prompt_global_variables | 9 | Глобальные переменные шаблонов |
| diagnostics | 27 | Диагностические квизы |
| email_letters | 61 | Email-письма |
| email_letter_blocks | 9 | Блоки писем |
| email_templates | 7 | Шаблоны писем |
| email_settings | 2 | Заголовок и футер писем |
| email_chains | 1 | Email-цепочки |
| email_chain_letters | 17 | Связь цепочка-письмо |
| email_chain_templates | 3 | Шаблоны цепочек (вебинарная + прогрев + закрытая заявка) |
| pdf_materials | 8 | PDF-материалы |
| banners | 4 | Библиотека баннеров |
| color_schemes | 14 | Цветовые схемы |
| image_styles | 3 | Стили изображений |
| case_jobs | 3 | Задания транскрибации кейсов |
| case_files | 228 | Файлы кейсов |
| case_classifications | 206 | Классификации кейсов |
| objections | 20 | Возражения к программам |
| topic_tree | 329 | Иерархическая структура тем |
| tags | 3 | Теги аудитории |
| program_tags | 35 | Связь программа-тег |
| landing_templates | — | Шаблоны лендингов |
| landing_block_definitions | — | Библиотека HTML-блоков для конструктора |
| landings | — | Пользовательские лендинги |
| landing_blocks | — | Блоки размещённые на лендингах |
| landing_template_blocks | — | Предустановленные блоки шаблонов |
| task_queue | 37 | Очередь задач обработки |
| video_projects | — | Проекты вертикального видеоконтента |
| video_stages | — | Этапы (кадры/сцены) видеопроекта |
| content_plan_items | — | Записи контент-плана (email, social, event) |
| content_plan_social_accounts | — | Связь записей контент-плана с соц. аккаунтами |
| social_accounts | — | Аккаунты соц. сетей (Instagram, TG, VK, YouTube и др.) |
| custom_event_types | — | Пользовательские типы событий контент-плана |

---

## 23. SQL Functions (RPC)

| Функция | Аргументы | Возвращает | Security Definer |
|---------|-----------|-----------|-----------------|
| claim_next_task | p_lane text | SETOF task_queue | Yes |
| has_role | _user_id uuid, _role app_role | boolean | Yes |
| handle_new_user | — | trigger | Yes |
| update_updated_at_column | — | trigger | No |

---

## 24. Enum типы

| Enum | Значения |
|------|----------|
| app_role | admin, user |
| offer_type | mini_course, diagnostic, webinar, pre_list, new_stream, spot_available, discount, download_pdf |
| project_status | draft, generating_leads, leads_ready, lead_selected, generating_content, completed, error |
| prompt_category | lead_magnets, slide_structure, text_instagram, text_vk, text_telegram, text_email, test_generation, image_carousel, image_post, image_email, reference_materials, expert_content, provocative_content, list_content, case_analysis, testimonial_content, myth_busting, objection_handling, email_builder, pdf_generation, landing_block_content |

---

## 25. Triggers

| Trigger | Таблица | Функция |
|---------|--------|---------|
| update_color_schemes_updated_at | color_schemes | update_updated_at_column() |
| update_email_letter_blocks_updated_at | email_letter_blocks | update_updated_at_column() |
| update_email_letters_updated_at | email_letters | update_updated_at_column() |
| update_prompt_global_variables_updated_at | prompt_global_variables | update_updated_at_column() |
| update_prompts_updated_at | prompts | update_updated_at_column() |
| update_landing_templates_updated_at | landing_templates | update_updated_at_column() |
| update_landings_updated_at | landings | update_updated_at_column() |
| update_landing_blocks_updated_at | landing_blocks | update_updated_at_column() |

---

## 26. RLS Policies Паттерн

Все таблицы имеют RLS enabled. Общий паттерн:

### Стандартные таблицы
- **SELECT**: Все аутентифицированные могут читать (qual: true)
- **INSERT**: Проверка владельца (auth.uid() = created_by)
- **UPDATE/DELETE**: Владелец ИЛИ admin (auth.uid() = created_by OR has_role(auth.uid(), 'admin'))

### Иерархические таблицы
- `content_pieces`, `lead_magnets`, `generation_runs`: проверка владельца через parent project's created_by
- `email_letter_blocks`: проверка владельца через email_letters
- `case_files`: проверка владельца через case_jobs
- `email_chain_letters`: проверка владельца через email_chains
- `landing_blocks`: проверка владельца через landings

### Admin-only таблицы
- `prompts`, `color_schemes`, `image_styles`, `topic_tree`, `email_templates`, `email_chain_templates`, `landing_templates`, `landing_block_definitions`, `landing_template_blocks`
- Требуют: has_role(auth.uid(), 'admin')

---

## 27. Внешние API и Секреты

| Секрет | Назначение | Используется в |
|--------|-----------|-----------------|
| ANTHROPIC_API_KEY | Claude API (текстовая генерация) | 11 функций (generate-*, classify-case, refine-prompt) |
| OPENROUTER_API_KEY | OpenRouter/Gemini 3 Pro Image Preview (генерация изображений) | 6 функций (generate-image*, generate-banner-image, generate-pdf-material) |
| DEEPGRAM_API_KEY | Deepgram API (транскрибация) | transcribe-case-file |
| RESEND_API_KEY | Resend email API (отправка писем) | send-test-email |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin key | Все Edge Functions |
| SUPABASE_URL | Project URL | Все Edge Functions |
| SUPABASE_ANON_KEY | Anon key для self-chain | process-queue |
| GOOGLE_AI_API_KEY | Google Generative AI API (Veo 3.1 видео, Gemini) | generate-video-content |
| RESEND_WEBHOOK_SECRET | Svix signing secret для верификации Resend webhook | inbound-competitor-email |

---

## 28. Ключевые Паттерны и Соглашения

### TanStack React Query
- Запросы: useQuery({ queryKey: ["table_name"] или ["table_name", id] })
- Мутации: useMutation + queryClient.invalidateQueries
- Автоматическое кеширование и синхронизация

### Уведомления
- Sonner: toast.success, toast.error, toast.loading
- Автоматические уведомления при завершении операций

### Формы
- Простые: useState
- Сложные: React Hook Form + Zod для валидации
- Кастомные компоненты: controlled inputs с value/onChange

### Стили
- Tailwind CSS с семантическими tokens (css-переменные)
- shadcn/ui с class-variance-authority для вариативных компонентов

### Edge Functions Шаблон
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { _task_id, ...payload } = await req.json();

  try {
    // Основная логика
    const result = { /* результат */ };

    if (_task_id) {
      await completeTask(_task_id, result);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (_task_id) {
      await failTask(_task_id, error.message);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 29. Информация о Supabase Проекте

| Параметр | Значение |
|----------|----------|
| Project ID | szlvnesyoydwvtqieazo |
| Region | eu-central-2 |
| DB Host | db.szlvnesyoydwvtqieazo.supabase.co |
| PostgreSQL | 17.6.1.084 |
| Status | ACTIVE_HEALTHY |
| GitHub | https://github.com/alexbest47/contentgen |

---

## 30. Описания Основных Страниц

### TaskQueue
Мониторинг очереди задач с фильтрацией по статусу и lane (claude/openrouter). Показывает прогресс выполнения, ошибки и позволяет навигировать к целевым URL'ам.

### Programs
Список всех платных программ для инициирования workflow'ов создания контента. Навигация к деталям программы и её офферам.

### ProgramDetail
Детали выбранной программы (название, описание, аудитория) со списком всех офферов разных типов. Точка входа для выбора нужного типа оффера.

### OfferTypeDetail
Офферы одного типа (например, все вебинары) с проектами генерации контента. Позволяет просматривать статус и результаты проектов.

### OfferDetail
Детали оффера с интегрированными workflow'ами:
- Выбор лид-магнитов (lead_magnets)
- Выбор тем из Topic Tree
- Выбор или создание проекта контента

### ProjectDetail
Главная страница для генерации контента. Отображает шаблоны проекта, проводит 15+ подстановок переменных, показывает прогресс генерации и результаты.

### ContentDetail
Просмотр сгенерированного контента:
- Карусельные изображения (image_carousel)
- Статичные изображения (image_post, image_email)
- Баннеры (image_placeholder_* → banner_image)

### LandingList
Список всех лендингов с возможностью:
- Создания нового лендинга (CreateLandingWizard: выбор шаблона и программы)
- Удаления лендинга
- Навигации в Landing Editor

### LandingEditor
Визуальный 3-панельный конструктор лендинга:
- **LandingBlockLibrary**: Библиотека доступных HTML-блоков по категориям
- **LandingBlockCanvas**: Рабочее пространство с drag-and-drop блоками
- **LandingBlockSettingsPanel**: Настройки выбранного блока (editable_fields из block definition), универсальный редактор изображений с AI-генерацией (edit/generate режимы, chromakey), позиционные стрелки для hero-блоков
- AI-генерация текстового контента через generate-landing-block
- AI-генерация изображений через generate-landing-image (edit/generate, chromakey удаление фона)
- RichTextEditor для редактирования контента блоков
- Инлайн-превью (LandingInlinePreview) с click-to-edit, block actions (move/duplicate/delete), add-block gaps
- Экспорт в ZIP через export-landing (HTML + CSS + изображения)

### ContentPlan
Календарный контент-план с двумя видами (месяц/неделя):
- Три типа записей: Email (синий), Social (зелёный), Event (оранжевый)
- Статусы: todo → ready → done
- Drag & Drop перемещение записей между датами
- Фильтрация по типу, программе, соц. аккаунту, автору
- Привязка email-писем и постов к записям через AddToContentPlanDialog
- Кастомные типы событий с пользовательскими цветами
- Интеграция с social_accounts (Instagram, Telegram, VK, YouTube, TikTok, Facebook, X, Threads, Дзен)

### EmailBuilderList
Список всех email-писем с возможностью:
- Дублирования письма
- Удаления письма
- Редактирования в Email Builder

### EmailBuilder
Визуальный конструктор email-писем с:
- BlockLibrary (10 типов блоков)
- BlockCanvas (рабочее пространство)
- BlockSettingsPanel (настройки блока)
- Автосохранением с debounce 2сек
- Генерацией блоков через AI

### EmailChainList
Список email-цепочек с агрегированным статусом писем, количеством букв и временем последней модификации.

### EmailChainDetail
Цепочка писем, сгруппированных по фазам:
- before: До вебинара
- webinar_day: День вебинара
- after: После вебинара
- warming: Прогрев после заявки

Позволяет просматривать статус писем, навигировать в Email Builder, регенерировать при ошибке.

### CreateDiagnostic
Форма создания диагностики:
- Выбор программы
- Название квиза
- URL Google Docs с контентом
- Выбор промпта для карточки
- Запуск run-diagnostic-pipeline

### DiagnosticDetail
Мониторинг pipeline диагностики:
- Статусы: draft → generating → quiz_generated → generating_images → ready
- Polling для отслеживания прогресса
- Retry-механизм при ошибках
- Скачивание JSON квиза

### Diagnostics
Список всех диагностик с инлайн-редактированием:
- Название, программа, статус
- Быстрый доступ к редактированию

### PdfMaterials
Список PDF-материалов (чек-листы, гайды, воркбуки) с отображением статуса генерации и landing-страницы.

### PdfMaterialView
Просмотр отдельного PDF-материала:
- Landing page HTML с превью
- PDF-контент
- Формы регистрации

### CaseManagement
Pipeline управления кейсами:
1. Сканирование папки Яндекс.Диска
2. Загрузка видеофайлов (mp4, mov, mkv, avi, webm)
3. Транскрибация via Deepgram (webhook callback)
4. Классификация транскриптов через Claude (self-chaining)

Отображает статусы файлов, прогресс обработки, ошибки.

### Prompts
Admin CRUD для промптов:
- Создание/редактирование промптов
- Управление версиями (manual/ai_refine)
- Фильтр по content_type/channel/category
- Bulk-операции (import/export)
- Email Builder таб группирует промпты: «Генерация писем» (общие), «Письма ДО и ПОСЛЕ вебинара» (webinar_before/webinar_after), «Прогрев после заявки» (warming, 7 промптов)

### BannerLibrary
Управление библиотекой баннеров:
- CRUD баннеров (4 типа: header, case_card, program_banner, custom)
- Генерация новых баннеров (6 вариантов per type)
- Предпросмотр с плейсхолдерами (image_placeholder_1-4)

### TopicTree
Иерархическое дерево всех тем (329 записей):
- Drag-drop для реорганизации
- Родительские топики (parent_id)
- Теги для каждой темы
- Поиск и фильтр

### ObjectionsHub
Все возражения (20 записей) к программам:
- Таблица возражений
- Быстрый поиск
- Добавление новых возражений

### Objections (per program)
Возражения для конкретной программы с:
- Фильтр и поиск
- Управление уникальными возражениями
- Использование в email-builder (objection_handling блок)

### EmailTemplates
CRUD шаблонов email-писем (admin):
- Создание/редактирование шаблонов
- Выбор при CreateLetterWizard

### EmailSettings
Управление header и footer для всех писем:
- HTML-редактор заголовка
- HTML-редактор футера
- Глобальное применение ко всем письмам

### ChainTemplates
Шаблоны для email-цепочек (admin):
- Предустановленные цепочки
- Выбор при CreateChainWizard

### PromptVariables
Управление 9 глобальными переменными промптов:
- {{program_title}}, {{audience_description}}, {{offer_title}}, {{image_style}}, {{color_scheme}}, {{case_text}}, {{objection_text}}, и др.
- Используются для подстановки во все промпты

### Tags
Управление тегами аудитории (3 записи):
- CRUD тегов
- Использование в program_tags для фильтрации аудитории

### Descriptions
Управление описаниями:
- Описания программ
- Описания аудиторий
- Используются в {{audience_description}}, {{program_title}} и т.д.

### Archive
Архивированные проекты:
- Список завершённых/отменённых проектов
- Восстановление из архива
- Просмотр истории

### UsersAdmin
Управление пользователями (admin):
- Список всех пользователей
- Управление ролями (admin/user)
- Удаление пользователей

---

## 31. Интеграции и Внешние Сервисы

### Google Docs
- Фетч контента через fetch-google-doc
- Используется для описания программ/аудиторий
- Export в TXT для обработки

### Talentsy KB
- URL формат: `https://talentsy-kb.vercel.app/share/tk_{id}`
- Cross-project Supabase REST API запрос к `documents` таблице KB проекта (mclszzrjwhrhfqtonuiw)
- Контент хранится в ProseMirror/TipTap JSON формате
- Конвертация через `tiptapToText()` в `fetch-google-doc` edge function
- Используется для описаний программ, аудиторий, тестов и других динамических контентных полей
- Контент всегда загружается свежий при каждой генерации (не кешируется навсегда)

### Yandex Disk
- Публичные папки для хранения видеокейсов
- Рекурсивный скан через scan-case-folder
- Фильтрация видеоформатов

### Deepgram
- Асинхронная транскрибация (nova-2, ru)
- Webhook callback для получения результата
- Поддержка batch-обработки файлов

### Resend
- Отправка тестовых писем
- Инъекция preheader для улучшения preview
- Rich HTML support

### Anthropic Claude
- Текстовая генерация во всех функциях
- Классификация кейсов (claude, self-chaining)
- Улучшение промптов (refine-prompt)

### OpenRouter + Google Gemini 3 Pro
- Генерация всех изображений (content, banners, diagnostics, PDF)
- Поддержка различных стилей и размеров

---

## 32. Ключевые Файлы и Пути

### Frontend Core
- `/src/App.tsx` — Роутинг и провайдеры
- `/src/contexts/AuthContext.tsx` — Аутентификация
- `/src/hooks/useTaskQueue.ts` — Интеграция с очередью

### Landing Builder (ключевые файлы)
- `/src/pages/LandingEditor.tsx` — Главный редактор: updateBlock, auto-save, block CRUD
- `/src/components/landing-builder/LandingBlockSettingsPanel.tsx` — Панель настроек: editable fields, ImageCard с AI-генерацией, ImagePositionControl (hero), ImageScaleControl (все блоки), цвета фона
- `/src/components/landing-builder/BlockLibraryModal.tsx` — Библиотека блоков с мини-превью (scaled iframe)
- `/src/components/landing-builder/LandingInlinePreview.tsx` — iframe preview с postMessage событиями
- `/src/hooks/useLandingPreviewHtml.ts` — buildPreviewHtml(), applyContentOverrides(), absolutifyPaths(), inlined CSS, buildAccentPalette(), buildAccentColorCSS(), replaceHexInHtml() для глобального акцентного цвета

### Backend
- `/supabase/functions/enqueue-task/` — Добавление в очередь
- `/supabase/functions/process-queue/` — Диспетчер
- `/supabase/functions/generate-*` — Функции генерации
- `/supabase/functions/upload-landing-images/` — Загрузка изображений (временная)

### Типы
- `/src/integrations/supabase/types.ts` — TypeScript типы (auto-generated)
- `/src/integrations/supabase/client.ts` — Supabase клиент (auto-generated)

### Константы
- `/src/lib/promptConstants.ts` — Категории и типы промптов
- `/src/lib/offerTypes.ts` — Типы и группировка офферов
- `/src/lib/bannerConstants.ts` — Типы баннеров и шаблоны

---

## 33. Best Practices

### Безопасность
- RLS policies на всех таблицах
- JWT-аутентификация для Edge Functions
- SECURITY DEFINER для критических операций (has_role, handle_new_user)
- Service Role Key только в Edge Functions (server-side)

### Performance
- TanStack React Query с кешированием
- Debounce для autosave (2сек)
- Lazy loading компонентов (React.lazy + Suspense)
- Оптимизация изображений (webp, оптимальные размеры)

### Error Handling
- Try-catch в Edge Functions с failTask()
- Graceful degradation в UI
- User-friendly error messages в toast'ах
- Retry-логика для네트워크ошибок

### Code Organization
- Feature-based структура (pages, components, hooks)
- Одноответственность компонентов
- Переиспользуемые utilities и hooks
- Типизация всех props и state

---

## 34. Миграция и Версионирование

### Структура миграций
- Находятся в `/supabase/migrations/`
- Именуются по timestamp: YYYYMMDDHHMMSS_description.sql

### Версионирование промптов
- Таблица `prompt_versions` с change_type (manual/ai_refine)
- Старые версии архивируются
- Возможность rollback к предыдущей версии

### Обновления типов
- Авто-генерация типов из БД: `supabase gen types typescript > src/integrations/supabase/types.ts`
- Выполняется при изменении схемы БД

---

## 35. Development Workflow

### Локальная разработка
1. Clone репозитория: `https://github.com/alexbest47/contentgen`
2. Установка зависимостей: `npm install`
3. Запуск dev-сервера: `npm run dev`
4. Supabase local development (если нужно)

### Деплой
- Frontend: Vercel (CI/CD из GitHub) — https://contentgen-five.vercel.app
- Backend: Edge Functions деплоятся через Supabase MCP (`deploy_edge_function`) — **НЕ автоматически из GitHub**
- Vercel Project: `contentgen` (team: alexbest47s-projects)
- **ВАЖНО**: Supabase CLI (`.exe`) не работает в sandbox-среде Cowork. Использовать Supabase MCP для деплоя edge functions

### Тестирование
- Unit-тесты: Jest (если настроены)
- Integration-тесты: Playwright (если настроены)
- Manual QA: Staging environment

---

## 36. Troubleshooting

### Типичные проблемы

**RLS Ошибки**: Проверить has_role() функцию и policies на таблице

**Task Queue Зависание**: Смотреть process-queue watchdog (3 мин timeout), проверить Edge Function логи

**Image Generation Ошибки**: Проверить OPENROUTER_API_KEY, квоту, rate limits

**Email Отправка**: Проверить RESEND_API_KEY, тестовый email в send-test-email

**Transcription Fails**: Проверить DEEPGRAM_API_KEY, формат видео, callback URL

**doc_url контент не обновляется**: Проверить, что `fetch-google-doc` задеплоена актуальная версия (v4+). Старая версия не поддерживает Talentsy KB URL и возвращает "Invalid Google Docs URL". Также убедиться, что в generate-* функциях используется паттерн "always fetch fresh" (см. секцию 8.1), а не `if (!audienceDescription)` с кешем

**CreateChainWizard crash при переходе к шагу 3**: Temporal Dead Zone (TDZ) — derived state (isClosedLead и др.) объявлен после useQuery hooks, которые ссылаются на него в `enabled`. Решение: объявить derived state ПЕРЕД useQuery

**Вертикальный текст в email preview**: CSS `word-break: break-word` на contentEditable наследуется в table cells email'а. Решение: НЕ использовать `wordBreak` на контейнере, вместо этого инжектировать CSS Reset с `td { word-break: normal !important }`

**Горизонтальная прокрутка в email preview**: Фиксированный `width: 600px` + `overflow-x: auto` создаёт scrollbar. Решение: использовать `max-width: 100%` + `overflow: hidden`

### Логи
- Edge Functions: Dashboard → Functions → Logs
- Frontend: Browser Console
- Supabase: Dashboard → Database → Query Performance / Logs

---

## 37. Дополнительные Ресурсы

- **Supabase Docs**: https://supabase.com/docs
- **React Router**: https://reactrouter.com/
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Deno Docs**: https://deno.com/manual
- **Anthropic Claude API**: https://docs.anthropic.com/
- **OpenRouter**: https://openrouter.ai/docs
- **Deepgram**: https://developers.deepgram.com/
- **Resend**: https://resend.com/docs

---

**Документация актуальна на**: 2026-04-06

---

## 38. Версии Edge Functions (актуальные деплои)

| Функция | Версия | Дата последнего деплоя | Ключевые изменения |
|---------|--------|----------------------|-------------------|
| fetch-google-doc | v4 | 2026-04-02 | Добавлена поддержка Talentsy KB URL и generic URL |
| generate-email-letter | v15 | 2026-04-08 | audience_segment override, verify_jwt=false |
| generate-landing-block | v12 | 2026-04-01 | AI-генерация контента лендинг-блоков |
| generate-landing-image | v7 | 2026-04-01 | Edit/generate/chromakey режимы |
| generate-pipeline | v16 | 2026-04-08 | + trust_ai / webinar_invite / webinar_invite_2 / direct_offer / multi_offer / transformation_story: skipLeadRequirement; инжекция `{{letter_theme_title}}` из `projects.topic_description`; инжекция `{{offers_data}}` для multi_offer (primary + `extra_offer_ids`, с подгрузкой doc_url); audience_segment; objection_handling без lead; verify_jwt=false |
| generate-lead-magnets | v11 | 2026-04-08 | audience_segment override, verify_jwt=false |
| generate-content | v5 | 2026-04-08 | audience_segment override, verify_jwt=false |
| generate-bot-message | v4 | 2026-04-08 | + program_title / program_description / program_doc_description в templateVars (подгружается из paid_programs.program_doc_url через fetchDocContent); работает с chain без webinar_offer_id (warming-кейс). v3: verify_jwt=false, AbortController timeouts (fetchDocContent 20s, Anthropic 110s × 3 попытки), ранний апдейт bot_chain_messages.status=processing, error-path пишет error_message в bot_chain_messages |
| process-queue | v3 | 2026-04-02 | taskType support, dispatch с SERVICE_ROLE_KEY |
| enqueue-task | v2 | 2026-04-02 | taskType support |
| fetch-google-doc | v4 | 2026-04-02 | Поддержка Talentsy KB URL и generic URL |
| generate-diagnostic | v2 | 2026-04-03 | Fresh audience/test_description fetch from URL |
| run-diagnostic-pipeline | v2 | 2026-04-03 | Fresh audience_description + fetchDocContent |
| generate-card-prompt | v2 | 2026-04-03 | Fresh audience_description + fetchDocContent |
| generate-image | v2 | 2026-04-03 | Fresh audience_description from URL |
| generate-email-block | v2 | 2026-04-03 | Fresh audience_description from URL |

### Изменения 2026-04-08 (новые типы контента post/carousel)

Добавлены новые автономные типы контента в `CreatePostCarouselWizard` (по аналогии с email wizard). Все они пропускают шаг angles/lead-magnet — проект создаётся со `status='lead_selected'`, генерация запускается напрямую через `generate-pipeline`:

| `content_type` | Пост | Карусель | Гейт | Ключевые входы |
|---|---|---|---|---|
| `from_scratch` (С нуля по описанию) | ✓ | ✓ | — | `topic_description`, `slide_count` |
| `trust_ai` (Доверимся ИИ) | ✓ | ✓ | — | только программа/оффер/сегмент |
| `webinar_invite` (Приглашение на вебинар) | ✓ | ✓ | `offer_type='webinar'` | `{{webinar_data}}` |
| `webinar_invite_2` (Приглашение на вебинар — Письмо 2) | ✓ | ✓ | `offer_type='webinar'` | `{{webinar_data}}`, 2–3 инсайта по теме, НЕ повторяет анонс |
| `direct_offer` (Прямой оффер) | ✓ | ✓ | — | `{{offer_description}}` как главный источник |
| `multi_offer` (Мультиоффер) | — | ✓ | — | `letter_theme_title` (в `topic_description`), `extra_offer_ids uuid[]`, рендерится в `{{offers_data}}` |
| `transformation_story` (История трансформации) | — | ✓ | — | theme auto/manual/tree → `{{letter_theme_title}}`, архетип из `{{audience_description}}` + инструмент из `{{program_doc_description}}`, без кейса |

Промпты (все в 3 каналах ig/tg/vk, sub_type post и/или carousel) создавались клонированием ближайшего существующего шаблона с доминирующим override-блоком в начале `system_prompt`, чтобы перекрыть инерцию «визуал = лид-магнит» клонированного контекста:
- **multi_offer carousel**: «один оффер = один слайд, реальные названия и ссылки из `{{offers_data}}`, никаких выдумок, запрет на обобщения типа "5 способов"».
- **trust_ai post/carousel**: «это НЕ лид-магнит, сам выбери жанр на основе программы/оффера/сегмента, контент самодостаточный, визуал = иллюстрация к смыслу».
- **direct_offer post/carousel**: «прямая продажа оффера, структура заход → мост → презентация оффера → возражения → CTA, факты строго из `{{offer_description}}`».
- **transformation_story carousel**: «история по архетипу (ДО → поворот → ПОСЛЕ → инструмент из программы → CTA), без case_data, герой — собирательный образ из `{{audience_description}}`».
- **webinar_invite_2 post/carousel**: «второе касание в стиле Письма 2 — 2–3 инсайта по теме, познавательный тон, не повторять анонс».

Схема БД:
- `ALTER TABLE projects ADD COLUMN extra_offer_ids uuid[] NOT NULL DEFAULT '{}'` — для multi_offer.
- `projects.topic_description` переиспользуется как универсальное поле «тема» (from_scratch, multi_offer, transformation_story) и маппится в промптах как `{{topic_description}}` и `{{letter_theme_title}}`.

Edge fn `generate-pipeline` v16:
- `isWebinarInvite` ловит оба `webinar_invite` и `webinar_invite_2`.
- `skipLeadRequirement = objection_handling+carousel || from_scratch || trust_ai || webinar_invite(_2) || direct_offer || multi_offer || transformation_story`.
- Инжекция `{{letter_theme_title}}` из `projects.topic_description`.
- Для `multi_offer`: подгружает основной оффер + `extra_offer_ids`, резолвит `doc_url` каждого через `fetch-google-doc`, форматирует в блок `ОФФЕР N:\nТип/Название/Описание/Ссылка` и подставляет в `{{offers_data}}`.

Frontend:
- `CreatePostCarouselWizard`: новые пункты в `CONTENT_TYPES`, `isAutonomous` расширен, гейты `format==='carousel'` для multi_offer/transformation_story, `ExtraOfferRow` подкомпонент для multi_offer (до 2 дополнительных офферов с собственным type+offer picker).
- `src/pages/Prompts.tsx` `CONTENT_TYPE_ORDER` и `src/lib/promptConstants.ts` `contentTypeLabels` обновлены.

### Изменения 2026-04-08 (экспорт диагностик в ZIP)

`src/pages/Diagnostics.tsx`: кнопка «Выгрузить все (ZIP)» в шапке списка. Тянет все диагностики с `quiz_json` и/или `card_prompt`, отдельным запросом подгружает `paid_programs(id, title)` (inline-join падал на `PGRST200: Could not find a relationship between 'diagnostics' and 'paid_programs' in the schema cache`), группирует по названию программы и через `jszip` собирает архив `diagnostics-YYYY-MM-DD.zip` со структурой `<program_title>/тест.json` + `<program_title>/карта.json`. Если у одной программы несколько диагностик — вкладываются подпапками по имени диагностики. Санитизация имён папок: запрещённые символы ФС → `_`, лимит 120 символов.

### Изменения 2026-04-08 (audience_segment rollout)
1. Миграция: `ALTER TABLE projects ADD COLUMN audience_segment text` (`email_letters.audience_segment` уже существовал).
2. `CreatePostCarouselWizard` (step 2): добавлен селектор `AUDIENCE_SEGMENTS`, обязательный для `canCreate`, сохраняется в `projects.audience_segment`.
3. Все 4 worker-функции (`generate-pipeline`, `generate-content`, `generate-lead-magnets`, `generate-email-letter`) передают `{{audience_segment}}` в `templateVars` и применяют override `audience_description = gv[segment]` при наличии записи в `prompt_global_variables`.
4. Массовый SQL-апдейт 76 активных промптов: после `{{audience_description}}` добавлена строка `ФОКУС НА СЕГМЕНТЕ АУДИТОРИИ: {{audience_segment}}` (см. секцию 8.1).
5. Все worker-функции переведены на `verify_jwt=false` — фикс зависаний задач в `processing` из-за новых ключей `sb_secret_*`.
### Изменения 2026-04-08 (bot-chain feature + фикс зависаний generate-bot-message)

**Новая фича — цепочки сообщений для бота (bot chains)**, по аналогии с email-цепочками, но для Telegram-бота.

Схема БД:
- `bot_chains` (id, title, program_id, offer_id, audience_segment, status, created_at, ...) — шапка цепочки.
- `bot_chain_messages` (id, chain_id, position, kind `text|image`, prompt_id, doc_url, content, image_url, status `pending|processing|ready|error`, error_message, ...) — отдельные сообщения.

Frontend:
- `CreateBotChainWizard` — визард создания цепочки (программа → оффер → сегмент → набор сообщений с типом text/image и привязкой к промпту).
- `src/pages/BotChainDetail.tsx` — детальная страница цепочки (две вкладки: список сообщений + настройки), кнопка «Сгенерировать всё» ставит все `bot_chain_messages` в очередь через `enqueue-task` с `function_name='generate-bot-message'`.
- `src/pages/BotMessageDetail.tsx` — редактор одного сообщения (текст или промпт-картинки), ручной перезапуск генерации.
- Маршруты в `App.tsx`:
  - `/bot-chains/:chainId` → `BotChainDetail`
  - `/bot-chains/:chainId/messages/:messageId` → `BotMessageDetail`

Edge function `generate-bot-message`:
- Режимы: `text` (Anthropic claude-sonnet-4 по шаблону промпта + `{{audience_description}}`, `{{audience_segment}}`, `{{program_doc_description}}`, `{{offer_description}}`, опциональный `doc_url` → `fetchDocContent`) и `image` (OpenRouter `google/gemini-3-pro-image-preview`, сохранение в Storage).
- Пишет результат в `bot_chain_messages.content`/`image_url`, помечает `status='ready'`; при ошибке — `status='error'` + `error_message`.

**Инцидент: зависание задач `generate-bot-message` в очереди.** Симптом: все 15 задач цепочки `99ca79c7-...` застревали в `task_queue.status='processing'`, пока watchdog `process-queue` не убивал их через 3 минуты с таймаутом. Прямой вызов функции через `curl` отрабатывал за ~17–30с. Причина: `generate-bot-message` был задеплоен с `verify_jwt: true`, тогда как все остальные worker-функции в проекте — с `verify_jwt: false`. Fire-and-forget `fetch` из `process-queue` с `SERVICE_ROLE_KEY` в таком сочетании с новыми ключами `sb_secret_*` не достигал функции — задача оставалась `processing` без логов. Починка:
1. Передеплой `generate-bot-message` v3 с `verify_jwt: false`.
2. Добавлены таймауты через `AbortController`: `fetchDocContent` — 20s, вызов Anthropic — 110s на попытку × 3 попытки.
3. Апдейт `bot_chain_messages.status='processing'` перенесён в начало обработчика (до загрузки chain/prompt/docs), чтобы UI видел прогресс и ранние ошибки трассировались.
4. `catch`-блок теперь также помечает `bot_chain_messages` как `error` с `error_message`.
5. Сброс очереди: `task_queue` и `bot_chain_messages` вернули в `pending`, триггернули `process-queue` — все 15 сообщений дошли до `status='ready'` за ~90с.

**Конвенция (важно)**: любая edge function, вызываемая из `process-queue`, должна быть задеплоена с `verify_jwt: false`. Иначе fire-and-forget dispatch молча не достигает функции, а `task_queue` копит `processing` → timeout → `error` без полезных логов в самой функции.

### Изменения 2026-04-08 (бот-цепочка «Прогрев после заявки»)

Адаптация email-цепочки `warming` под бот по тому же принципу, что и `bot-webinar-before-after`.

БД: 7 новых промптов `bot-warming-letter-1 … bot-warming-letter-7`, `channel='bot_warming'`, `category=content_type='bot_builder'`, `step_order=1..7`. Названия: Welcome после заявки → Экспертный контент → Кейс выпускника → Что внутри программы → Честные ответы на возражения → Первый шаг уже сделан → Подарок. Каждый возвращает строгий JSON (`message_text` + `buttons` + `image.imagen_prompt`) в том же формате, что `bot-webinar-letter-*`. Ограничения под бот: plain text, 2–5 абзацев, лимит эмодзи, `{{brand_voice}}` / `{{antiAI_rules}}`. Imagen-промпт по структуре «преамбула + {{image_style}} + сцена + TEXT BLOCK + layout». Последнее письмо (подарок) содержит плейсхолдеры `{mini_course_title}` / `{mini_course_url}` для ручной подстановки.

Переменные, которые используют bot-warming-промпты: `{{program_title}}`, `{{program_description}}`, `{{audience_segment}}`, `{{brand_style}}`, `{{brand_voice}}`, `{{antiAI_rules}}`, `{{talentsy}}`, `{{image_style}}`.

Edge fn `generate-bot-message` v4:
- В `templateVars` добавлены `program_title`, `program_description`, `program_doc_description` (резолв через `fetchDocContent(paid_programs.program_doc_url)`).
- Ветка с `chain.webinar_offer_id` делается опциональной — для warming-кейса `webinar_offer_id=null`, `offer_title/offer_description/webinar_data` остаются пустыми, остальные переменные резолвятся из `paid_programs` и `prompt_global_variables` как обычно.

Frontend:
- `src/pages/Prompts.tsx` вкладка «Конструктор ботов»: добавлен отдельный блок «Прогрев после заявки (бот)» с `PipelineGroup groupKey="bot_warming"` (фильтр `channel==='bot_warming'`, сортировка по `step_order`).
- `src/components/chains/CreateBotChainWizard.tsx`:
  - `BOT_TEMPLATES` получил поле `kind: "webinar" | "warming"`. Новый шаблон `bot-warming-after-application` (7 сообщений на слаги `bot-warming-letter-1..7`, `channel='bot_warming'`).
  - Шаг 2 ветвится: для `kind==='webinar'` — прежний селектор вебинара, для `kind==='warming'` — селектор `paid_programs` (запрос `bot_warming_programs`).
  - `handleCreate`: для warming-шаблона `program_id = programId` напрямую, `webinar_offer_id = null`. Гейт «Далее» и сводка на шаге 4 также разветвлены по `isWarmingKind`. Остальные шаги (audience_segment / title / color scheme / image_style) одни и те же.

### Изменения 2026-04-09 (image/email refine flow + Бренд-карточка style + bot_message task type)

**Новый image style «Бренд-карточка»** (`image_styles`): добавлен стиль в духе edtech-брендов (бежевый фон, pill-лейблы, curvy doodles, rounded portraits, 3D-элементы). Все цвета тянутся из переменной `{{brand_style}}` — хардкод цветов запрещён. Доступен везде, где используется `{{image_style}}`.

**Email refine — кнопка «Сделать правки»** в `EmailBuilderHeader` рядом с «Сгенерировать письмо». Диалог с редактируемым пресет system_prompt (запрет менять верстку, таблицы, inline-стили, токены цвета, структуру, padding, шрифты, border-radius; не трогать `<img src="{{placeholder_id}}">`) и полем user instructions. Задача идёт через `process-queue` (lane=claude, taskType=letter) → новая edge-функция `refine-email-letter` загружает `generated_html` (без header/footer — они добавляются `buildFullHtml()` в рантайме), шлёт в Claude Sonnet 4, парсит `{letter_html}`, обновляет `email_letters.generated_html`. Фронт поллит `task_queue` и перерисовывает письмо.

**Image refine — кнопка «Правка изображения»** в `ContentDetail.tsx` (post / carousel / banner) и `BotMessageDetail.tsx` (картинка бот-сообщения). Для карусели сначала выбирается номер слайда через Select. Задача идёт через очередь (lane=openrouter) → новая edge-функция `refine-post-image`:
- Режимы: `static` (→ `content_pieces.category = static_image_${ct}`), `carousel` (→ `carousel_${ct}_${N}`), `banner` (→ `banner_${ct}`), `bot_message` (→ `bot_chain_messages.image_url`).
- Загружает текущий URL, fetch → base64 data URL, шлёт в OpenRouter `google/gemini-3-pro-image-preview` мультимодально (`content: [{type:"text"}, {type:"image_url"}]`) с редактируемым system_prompt + user edits.
- Аплоадит результат в bucket `generated-images` (`${project_id}/${category}_refine_${Date.now()}.png` или `bot_messages/${id}_refine_*.png`), апдейтит соответствующую строку БД.
- Полная интеграция с очередью: `_task_id` из body, `completeTask/failTask`, `verify_jwt=false` в `config.toml`.

**Task Queue — лейбл «Сообщение в бот»**: в `TaskQueue.tsx` добавлены `taskTypeLabels.bot_message = "Сообщение в бот"` и соответствующий color. Во всех местах, где бот-сообщения enqueue'ятся (`BotMessageDetail`, `BotChainDetail`, `CreateBotChainWizard`), `taskType: "content"` заменён на `taskType: "bot_message"`. Добавлен fallback `getDisplayType` для легаси-задач с `task_type="content"` и `display_title` начинающимся на "Бот".

**GitHub**: https://github.com/alexbest47/contentgen
**Vercel**: https://contentgen-five.vercel.app
**Supabase Project ID**: szlvnesyoydwvtqieazo

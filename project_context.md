# ContentGen — Полное описание системы

## 1. Общее описание

**ContentGen** — платформа автоматизации создания маркетингового контента для платных образовательных программ (онлайн-курсы, наставничество, групповые программы). Система позволяет:

- Создавать и управлять офферами (лид-магниты, диагностики, вебинары и т.д.)
- Генерировать контент для 4 каналов: Instagram, Telegram, VK, Email
- Собирать email-письма в блочном конструкторе с AI-генерацией
- Собирать email-цепочки из нескольких писем по шаблону
- Генерировать диагностические квизы с изображениями
- Транскрибировать и классифицировать кейсы клиентов
- Создавать PDF-материалы и баннеры
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
| Backend | Supabase (PostgreSQL 17, Auth, Storage, 25 Edge Functions на Deno) |
| AI-генерация текста | Anthropic Claude (claude-sonnet-4-20250514) |
| AI-генерация изображений | OpenRouter → Google Gemini 3 Pro Image Preview |
| Транскрибация | Deepgram (модель nova-2, язык: ru, async webhook) |
| Отправка писем | Resend API |
| Внешние сервисы | Yandex Disk (публичные папки для кейсов), Google Docs, Talentsy KB (TipTap JSON via Supabase cross-project query) |

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
│   ├── chains/                      # CreateChainWizard (5 шагов)
│   ├── email-builder/               # 15+ компонентов блочного конструктора писем
│   ├── offer/                       # ImageUploadField, TopicChoiceDialog
│   ├── pdf/                         # CreatePdfWizard
│   ├── project/                     # PipelineResultView
│   ├── prompts/                     # PromptFormDialog, PromptStepCard, PipelineGroup, и др.
│   └── ui/                          # shadcn/ui компоненты (40+)
├── pages/                           # 34 страницы
└── integrations/supabase/
    ├── client.ts                    # Supabase клиент (авто-генерация)
    └── types.ts                     # TypeScript типы БД (авто-генерация)

supabase/
├── config.toml                      # Конфигурация проекта (verify_jwt = false)
└── functions/                       # 25 Edge Functions (Deno)
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
├── Промпты (prompts) — 67 записей
│   ├── Версии промптов (prompt_versions) — 92 записи
│   └── Глобальные переменные (prompt_global_variables) — 9 переменных
├── Диагностики (diagnostics) — 27 записей
├── Email-письма (email_letters) — 61 письмо
│   ├── Блоки писем (email_letter_blocks) — 9 блоков
│   └── Шаблоны писем (email_templates) — 7 шаблонов
├── Email-цепочки (email_chains)
│   ├── Письма в цепочке (email_chain_letters) — 17 связей
│   └── Шаблоны цепочек (email_chain_templates) — 1 шаблон
├── PDF-материалы (pdf_materials) — 8 материалов
├── Баннеры (banners) — 4 баннера
├── Кейсы (case_files) — 228 файлов
│   ├── Задания транскрибации (case_jobs) — 3 задания
│   └── Классификации (case_classifications) — 206 записей
├── Цвет-схемы (color_schemes) — 14 схем
├── Стили изображений (image_styles) — 3 стиля
└── Структура тем (topic_tree) — 329 записей

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
| `/email-builder` | EmailBuilderList | Список email-писем |
| `/email-builder/:letterId` | EmailBuilder | 3-панельный конструктор писем |
| `/email-chains` | EmailChainList | Список email-цепочек |
| `/email-chains/:chainId` | EmailChainDetail | Цепочка с письмами (до/во время/после вебинара) |

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
| `/prompt-variables` | PromptVariables | Глобальные переменные промптов |
| `/tags` | Tags | Теги аудитории |
| `/descriptions` | Descriptions | Описания программ/аудиторий |
| `/archive` | Archive | Архивированные проекты |
| `/users` | UsersAdmin | Управление пользователями |

---

## 6. Навигационный Сайдбар (5 групп)

### 1. Main
- Queue (Очередь)
- Content Creation (Создание контента)
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

### Lanes (2 полосы обработки)
- **claude**: Текстовая генерация (все функции с Anthropic Claude)
- **openrouter**: Генерация изображений (все функции с OpenRouter/Gemini)

### Watchdog
Сбрасывает зависшие задачи (processing > 3 мин) → error

---

## 8. Edge Functions (25 функций)

### Управление очередью

| Функция | Назначение | Lane |
|---------|-----------|------|
| enqueue-task | Добавление задачи, auth via JWT, trigger process-queue | — |
| process-queue | Диспетчер: watchdog + claim_next_task + fire-and-forget + self-chain | — |

### Генерация контента

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-content | Генерация маркетингового контента из шаблонов проекта, 15+ переменные подстановки | claude | Yes |
| generate-image | Генерация изображений проекта (карусель/пост/email) via OpenRouter | openrouter | Yes |
| generate-pipeline | Генерация контента для канала (Instagram/Email/Telegram/VK) | claude | Yes |
| generate-pipeline-images | Генерация карусельных/баннерных/статичных изображений для pipeline | openrouter | Yes |
| generate-lead-magnets | Генерация вариаций лид-магнитов (5 штук), маппинг content_type → prompt category | claude | Yes |
| generate-project-name | Авто-генерация названия проекта (3-6 слов на русском) | claude | No |

### Email

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| generate-email-block | Генерация блока письма (HTML или изображение), два режима | claude | Yes |
| generate-email-letter | Полная генерация письма: 30+ переменные шаблона, retry-логика, JSON parsing с fallbacks | claude | Yes |
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

### Кейсы

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| scan-case-folder | Рекурсивный скан папки Яндекс.Диска, фильтр видеофайлов, дедупликация | — | No |
| transcribe-case-file | Отправка видео на Deepgram async с callback URL | — | No |
| deepgram-callback | Webhook: сохранение транскрипции, trigger классификации + следующий файл | — | No |
| classify-case | Анализ транскрипции via Claude, self-chain к следующему файлу | claude | No |

### Утилиты

| Функция | Назначение | Lane | _task_id |
|---------|-----------|------|----------|
| fetch-google-doc | Фетч Google Docs (export TXT) или Talentsy KB (TipTap→text) | — | No |
| refine-prompt | AI-улучшение промпта, архивирование версии, сохранение {{placehdolders}} | claude | Yes |
| import-prompts-txt | Bulk import промптов из TXT с NAME_ALIASES маппингом | — | No |

---

## 9. Система Промптов

### Категории (20 категорий)
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

### Контентные типы (12 типов)
- lead_magnet, quiz, guide, workbook, slide, post, email, banner, diagnostic, case, pdf, custom

### Каналы (4 канала)
- instagram, telegram, vk, email

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

### CreateLetterWizard (5 шагов)
1. Template (выбор шаблона)
2. Theme (выбор цветовой схемы)
3. Audience (выбор аудитории)
4. Settings (дополнительные параметры)
5. Description (описание письма)

### Плейсхолдеры изображений
- {{IMAGE:PROMPT=...}} в HTML

### Autosave
- Debounce 2 сек при редактировании

---

## 11. Email Цепочки

### CreateChainWizard (5 шагов)
1. Template (выбор шаблона)
2. Settings (параметры цепочки)
3. Letters (выбор писем)
4. Timing (временные промежутки)
5. Review (подтверждение)

### Таблицы
- `email_chains` — цепочки
- `email_chain_letters` — связи письма-цепочка
- `email_chain_templates` — шаблоны цепочек

### Группировка писем
- before: До вебинара
- during: Во время вебинара
- after: После вебинара

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

## 14. Баннеры

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

## 15. Pipeline Управления Кейсами

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

## 16. Аутентификация и Роли

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

## 17. Storage Buckets

| Bucket | Назначение |
|--------|-----------|
| generated-images | Генерируемые изображения контента |
| quiz-images | Изображения диагностических квизов |
| offer-images | Изображения-обложки офферов |

---

## 18. Цветовые Схемы и Стили Изображений

### Color Schemes (14 схем)
- Таблица: `color_schemes`
- Поля: name, description, preview_colors[], is_active
- Используются в Email Builder и контент-генерации

### Image Styles (3 стиля)
- Таблица: `image_styles`
- Поля: name, description, is_active
- Используются в промптах для стилизации изображений

---

## 19. Структура Тем (Topic Tree)

- Таблица: `topic_tree` (329 записей)
- Иерархия: parent_id self-reference
- Поля: name, description, sort_order, tags[]
- Используется для организации контента по темам

---

## 20. Возражения (Objections)

- Таблица: `objections` (20 записей)
- Поля: objection_text, program_id, tags[], created_by
- Используются в email-builder и контент-генерации для создания возражений-блоков

---

## 21. Полный Список Таблиц БД (33 таблицы)

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
| email_chain_templates | 1 | Шаблоны цепочек |
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
| task_queue | 37 | Очередь задач обработки |

---

## 22. SQL Functions (RPC)

| Функция | Аргументы | Возвращает | Security Definer |
|---------|-----------|-----------|-----------------|
| claim_next_task | p_lane text | SETOF task_queue | Yes |
| has_role | _user_id uuid, _role app_role | boolean | Yes |
| handle_new_user | — | trigger | Yes |
| update_updated_at_column | — | trigger | No |

---

## 23. Enum типы

| Enum | Значения |
|------|----------|
| app_role | admin, user |
| offer_type | mini_course, diagnostic, webinar, pre_list, new_stream, spot_available, discount, download_pdf |
| project_status | draft, generating_leads, leads_ready, lead_selected, generating_content, completed, error |
| prompt_category | lead_magnets, slide_structure, text_instagram, text_vk, text_telegram, text_email, test_generation, image_carousel, image_post, image_email, reference_materials, expert_content, provocative_content, list_content, case_analysis, testimonial_content, myth_busting, objection_handling, email_builder, pdf_generation |

---

## 24. Triggers

| Trigger | Таблица | Функция |
|---------|--------|---------|
| update_color_schemes_updated_at | color_schemes | update_updated_at_column() |
| update_email_letter_blocks_updated_at | email_letter_blocks | update_updated_at_column() |
| update_email_letters_updated_at | email_letters | update_updated_at_column() |
| update_prompt_global_variables_updated_at | prompt_global_variables | update_updated_at_column() |
| update_prompts_updated_at | prompts | update_updated_at_column() |

---

## 25. RLS Policies Паттерн

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

### Admin-only таблицы
- `prompts`, `color_schemes`, `image_styles`, `topic_tree`, `email_templates`, `email_chain_templates`
- Требуют: has_role(auth.uid(), 'admin')

---

## 26. Внешние API и Секреты

| Секрет | Назначение | Используется в |
|--------|-----------|-----------------|
| ANTHROPIC_API_KEY | Claude API (текстовая генерация) | 11 функций (generate-*, classify-case, refine-prompt) |
| OPENROUTER_API_KEY | OpenRouter/Gemini 3 Pro Image Preview (генерация изображений) | 6 функций (generate-image*, generate-banner-image, generate-pdf-material) |
| DEEPGRAM_API_KEY | Deepgram API (транскрибация) | transcribe-case-file |
| RESEND_API_KEY | Resend email API (отправка писем) | send-test-email |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin key | Все Edge Functions |
| SUPABASE_URL | Project URL | Все Edge Functions |
| SUPABASE_ANON_KEY | Anon key для self-chain | process-queue |

---

## 27. Ключевые Паттерны и Соглашения

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

## 28. Информация о Supabase Проекте

| Параметр | Значение |
|----------|----------|
| Project ID | szlvnesyoydwvtqieazo |
| Region | eu-central-2 |
| DB Host | db.szlvnesyoydwvtqieazo.supabase.co |
| PostgreSQL | 17.6.1.084 |
| Status | ACTIVE_HEALTHY |
| GitHub | https://github.com/alexbest47/contentgen |

---

## 29. Описания Основных Страниц

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
- during: Во время вебинара
- after: После вебинара

Позволяет переупорядочивать письма, добавлять новые, регенерировать существующие.

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

## 30. Интеграции и Внешние Сервисы

### Google Docs
- Фетч контента через fetch-google-doc
- Используется для описания программ/аудиторий
- Export в TXT для обработки

### Talentsy KB
- Cross-project Supabase query для TipTap JSON
- Используется для获取 справочных материалов
- Конвертация TipTap → text

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

## 31. Ключевые Файлы и Пути

### Frontend Core
- `/src/App.tsx` — Роутинг и провайдеры
- `/src/contexts/AuthContext.tsx` — Аутентификация
- `/src/hooks/useTaskQueue.ts` — Интеграция с очередью

### Backend
- `/supabase/functions/enqueue-task/` — Добавление в очередь
- `/supabase/functions/process-queue/` — Диспетчер
- `/supabase/functions/generate-*` — Функции генерации

### Типы
- `/src/integrations/supabase/types.ts` — TypeScript типы (auto-generated)
- `/src/integrations/supabase/client.ts` — Supabase клиент (auto-generated)

### Константы
- `/src/lib/promptConstants.ts` — Категории и типы промптов
- `/src/lib/offerTypes.ts` — Типы и группировка офферов
- `/src/lib/bannerConstants.ts` — Типы баннеров и шаблоны

---

## 32. Best Practices

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

## 33. Миграция и Версионирование

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

## 34. Development Workflow

### Локальная разработка
1. Clone репозитория: `https://github.com/alexbest47/contentgen`
2. Установка зависимостей: `npm install`
3. Запуск dev-сервера: `npm run dev`
4. Supabase local development (если нужно)

### Деплой
- Frontend: Vercel/Netlify (CI/CD из GitHub)
- Backend: Supabase автоматически деплоит функции из `/supabase/functions/`

### Тестирование
- Unit-тесты: Jest (если настроены)
- Integration-тесты: Playwright (если настроены)
- Manual QA: Staging environment

---

## 35. Troubleshooting

### Типичные проблемы

**RLS Ошибки**: Проверить has_role() функцию и policies на таблице

**Task Queue Зависание**: Смотреть process-queue watchdog (3 мин timeout), проверить Edge Function логи

**Image Generation Ошибки**: Проверить OPENROUTER_API_KEY, квоту, rate limits

**Email Отправка**: Проверить RESEND_API_KEY, тестовый email в send-test-email

**Transcription Fails**: Проверить DEEPGRAM_API_KEY, формат видео, callback URL

### Логи
- Edge Functions: Dashboard → Functions → Logs
- Frontend: Browser Console
- Supabase: Dashboard → Database → Query Performance / Logs

---

## 36. Дополнительные Ресурсы

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

**Документация актуальна на**: 2026-04-01
**GitHub**: https://github.com/alexbest47/contentgen
**Supabase Project ID**: szlvnesyoydwvtqieazo

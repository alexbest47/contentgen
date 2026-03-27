# ContentGen — Описание системы

## 1. Общее описание

**ContentGen** — платформа автоматизации создания маркетингового контента для платных образовательных программ (онлайн-курсы, наставничество, групповые программы). Система позволяет:

- Создавать и управлять офферами (лид-магниты, диагностики, вебинары и т.д.)
- Генерировать контент для 4 каналов: Instagram, Telegram, VK, Email
- Собирать email-письма в блочном конструкторе с AI-генерацией
- Генерировать диагностические квизы с изображениями
- Транскрибировать и классифицировать кейсы клиентов
- Создавать PDF-материалы и баннеры

---

## 2. Технологический стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Роутинг | React Router v6 |
| Состояние | TanStack React Query, React Context (Auth) |
| Backend | Lovable Cloud (Supabase) — БД PostgreSQL, Auth, Storage, Edge Functions |
| AI-генерация текста | Anthropic Claude (через API) |
| AI-генерация изображений | OpenRouter → Google Gemini 3 Pro Image Preview |
| Транскрибация | Deepgram (модель nova-2, язык: ru) |
| Внешние хранилища | Yandex Disk (публичные папки для кейсов) |

---

## 3. Иерархия данных

```
Платная программа (paid_programs)
├── Теги аудитории (program_tags → tags)
├── Возражения (objections)
├── Офферы (offers)
│   ├── Контентные: mini_course, diagnostic, webinar, download_pdf
│   └── Продающие: pre_list, new_stream, spot_available*, discount
│       └── Проект (projects)
│           ├── Лид-магниты (lead_magnets)
│           └── Контент (content_pieces) по каналам и категориям
├── Диагностики (diagnostics)
├── PDF-материалы (pdf_materials)
└── Email-письма (email_letters)
    └── Блоки письма (email_letter_blocks)
```

> *`spot_available` — не привязан к конкретной программе (program_id = null), может использоваться для любой программы.

### 8 типов офферов

| Ключ | Название | Группа |
|------|---------|--------|
| `mini_course` | Мини-курс | Контентный |
| `diagnostic` | Диагностика | Контентный |
| `webinar` | Вебинар | Контентный |
| `download_pdf` | Скачай PDF | Контентный |
| `pre_list` | Предсписок | Продающий |
| `new_stream` | Старт нового потока | Продающий |
| `spot_available` | Освободилось место | Продающий |
| `discount` | Промокод | Продающий |

---

## 4. Типы контента

Контент генерируется по категориям промптов. Каждый тип контента имеет свои шаги генерации (промпты с `step_order`).

| Ключ | Название |
|------|---------|
| `lead_magnet` | Лидмагнит |
| `reference_material` | Справочный материал |
| `expert_content` | Экспертный контент |
| `provocative_content` | Провокационный контент |
| `list_content` | Список |
| `testimonial_content` | Контент-отзыв |
| `myth_busting` | Разбор мифа |
| `objection_handling` | Отработка возражения |
| `case_analysis` | Кейсы |
| `diagnostic` | Диагностика |
| `email_builder` | Конструктор email |
| `pdf_material` | PDF-материал |

### Каналы дистрибуции

- **Instagram** — текст + карусели + посты
- **Telegram** — текст
- **VK (ВКонтакте)** — текст
- **Email** — текст + изображения (через конструктор писем)

---

## 5. Модули системы

### Основное
- **Очередь задач** (`/queue`) — мониторинг и управление асинхронными задачами
- **Создание контента** (`/programs`) — выбор программы → оффер → проект → генерация контента
- **Конструктор писем** (`/email-builder`) — блочный редактор email-писем

### Подготовка офферов (по типам)
- **Диагностики** (`/diagnostics`) — создание и генерация квизов
- **Мини-курс, Вебинар, PDF, Предсписок, Новый поток, Место, Промокод** (`/offer-types/:type`) — управление офферами каждого типа

### Подготовка контента
- **Баннеры** (`/banners`) — библиотека баннеров с AI-генерацией
- **Программы** (`/manage-programs`) — управление платными программами
- **Кейсы** (`/cases`) — сканирование, транскрибация, классификация кейсов
- **Темы** (`/topics`) — дерево тем контента
- **Возражения** (`/objections`) — управление возражениями по программам

### Настройка email
- **Шаблоны** (`/email-templates`) — шаблоны структуры писем
- **Хедер/футер** (`/email-settings`) — настройки HTML хедера и футера

### Администрирование
- **Теги** (`/tags`) — теги аудитории (привязываются к программам)
- **Описания** (`/descriptions`) — справочные описания типов контента
- **Архив** (`/archive`) — архивные проекты
- **Промпты** (`/prompts`) — управление промптами для AI-генерации
- **Переменные** (`/prompt-variables`) — глобальные переменные для промптов
- **Пользователи** (`/users`) — управление пользователями и ролями

---

## 6. Система очередей задач

### Архитектура

```
Клиент → enqueue-task → INSERT в task_queue → POST process-queue
                                                    ↓
                                              claim_next_task (RPC)
                                                    ↓
                                              POST целевая функция
                                                    ↓
                                              completeTask / failTask
                                                    ↓
                                              POST process-queue (self-chain)
```

### Компоненты

1. **`enqueue-task`** — Edge Function, принимает `function_name`, `payload`, `lane`, `display_title`. Аутентифицирует пользователя, вставляет задачу в `task_queue`, запускает `process-queue`.

2. **`task_queue`** — таблица БД: `id`, `status` (pending/processing/completed/error), `lane` (claude/openrouter), `function_name`, `payload`, `result`, `error_message`, `priority`, `target_url`, `display_title`.

3. **`process-queue`** — Edge Function, обрабатывает очередь:
   - Watchdog: сбрасывает задачи в статусе `processing` дольше 10 минут → `error`
   - Для каждого лейна: вызывает `claim_next_task` (SQL-функция с атомарным захватом)
   - Fire-and-forget: вызывает целевую функцию с `_task_id` в payload
   - Self-chaining: если есть ещё pending задачи, вызывает себя через 1 сек

4. **`claim_next_task`** — SQL-функция (RPC), атомарно захватывает следующую pending задачу в лейне (если нет уже processing задач в этом лейне).

### Два лейна

| Лейн | Назначение |
|------|-----------|
| `claude` | Задачи генерации текста через Anthropic Claude |
| `openrouter` | Задачи генерации изображений через OpenRouter/Gemini |

### Протокол завершения

Каждая целевая функция, получив `_task_id`, вызывает:
- `completeTask(taskId, result)` — статус `completed`, записывает `result`
- `failTask(taskId, errorMessage)` — статус `error`, записывает `error_message`
- После обоих — триггерит `process-queue` для обработки следующей задачи

---

## 7. Edge-функции

| Функция | Назначение |
|---------|-----------|
| `enqueue-task` | Постановка задачи в очередь |
| `process-queue` | Диспетчер очереди задач |
| `generate-content` | Генерация текстового контента (Claude) |
| `generate-image` | Генерация изображения для проекта (OpenRouter/Gemini) |
| `generate-pipeline` | Генерация полного пайплайна контента (многошаговый) |
| `generate-pipeline-images` | Генерация изображений для пайплайна |
| `generate-lead-magnets` | Генерация лид-магнитов для проекта |
| `generate-project-name` | Генерация названия проекта |
| `generate-diagnostic` | Генерация квиза диагностики (Claude) |
| `generate-diagnostic-images` | Генерация изображений для квиза (OpenRouter/Gemini) |
| `run-diagnostic-pipeline` | Каскадный пайплайн: квиз → card prompt → изображения |
| `generate-card-prompt` | Генерация card prompt для диагностики |
| `process-diagnostic-image` | Обработка одного изображения диагностики |
| `generate-banner-image` | Генерация баннера (OpenRouter/Gemini) |
| `generate-email-block` | Генерация одного блока email-письма (Claude) |
| `generate-email-letter` | Полная генерация email-письма (Claude) |
| `generate-pdf-material` | Генерация PDF-материала |
| `send-test-email` | Отправка тестового email |
| `scan-case-folder` | Сканирование папки Yandex Disk для кейсов |
| `transcribe-case-file` | Транскрибация аудио/видео через Deepgram |
| `deepgram-callback` | Webhook-коллбэк от Deepgram с результатом транскрибации |
| `classify-case` | Классификация кейса через Claude |
| `fetch-google-doc` | Получение текста из Google Docs |
| `refine-prompt` | Улучшение промпта через AI |
| `import-prompts-txt` | Импорт промптов из TXT-файла |

---

## 8. Система промптов

### Структура

Каждый промпт (`prompts`) содержит:
- `name`, `slug` — идентификация
- `category` (enum `prompt_category`) — к какому типу генерации относится
- `content_type` — тип контента (lead_magnet, expert_content и т.д.)
- `channel` — канал (instagram, telegram, vk, email) или null
- `offer_type` — тип оффера (для фильтрации) или null
- `step_order` — порядок шага в пайплайне
- `provider` / `model` — какую AI-модель использовать
- `system_prompt` — системный промпт
- `user_prompt_template` — шаблон пользовательского промпта с плейсхолдерами
- `output_format_hint` — подсказка формата вывода

### 20 категорий промптов

`lead_magnets`, `reference_materials`, `slide_structure`, `text_instagram`, `text_vk`, `text_telegram`, `text_email`, `test_generation`, `image_carousel`, `image_post`, `image_email`, `expert_content`, `provocative_content`, `list_content`, `case_analysis`, `testimonial_content`, `myth_busting`, `objection_handling`, `email_builder`, `pdf_generation`

### Версионирование

Таблица `prompt_versions` хранит историю изменений промптов: `version_number`, `change_type`, `system_prompt`, `user_prompt_template`, `provider`, `model`.

### Глобальные переменные

Таблица `prompt_global_variables` хранит пары `key` → `value` (например, `brand_voice`, `image_style`). Подставляются в промпты через `{{key}}`.

### Шаблонные подстановки

В `user_prompt_template` используются плейсхолдеры вида `{{variable}}`:
- `{{program_title}}`, `{{program_description}}` — данные программы
- `{{audience_description}}` — описание аудитории (из Google Doc)
- `{{offer_title}}`, `{{offer_description}}` — данные оффера
- `{{lead_magnet_title}}` — выбранный лид-магнит
- `{{content_type}}`, `{{channel}}` — тип контента и канал
- Глобальные переменные (`{{brand_voice}}`, `{{image_style}}` и др.)

---

## 9. Конструктор email

### Возможности

- **Блочный редактор** — drag & drop блоков разных типов
- **Типы блоков**: текст, заголовок, кнопка CTA, изображение, разделитель, карточка оффера, коллекция бесплатных курсов, коллекция офферов, коллекция платных программ, пользовательский блок, сгенерированный блок
- **AI-генерация**: генерация отдельных блоков и полного письма через Claude
- **Настройки блоков**: визуальные настройки (цвета, отступы, шрифты) через панель справа
- **Экспорт**: копирование HTML, скачивание как .html файл
- **Тестовая отправка**: отправка на указанный email
- **Шаблоны**: сохранение и загрузка шаблонов структуры писем
- **Цветовые схемы**: привязка к `color_schemes`
- **Хедер/футер**: глобальные настройки из `email_settings`

### Таблицы

- `email_letters` — метаданные письма (тема, прехедер, оффер, программа, кейс, возражения)
- `email_letter_blocks` — блоки письма (тип, конфиг, HTML, порядок)
- `email_templates` — шаблоны структуры
- `email_settings` — глобальные настройки (хедер HTML, футер HTML)

---

## 10. Диагностики

### Пайплайн генерации

```
Создание диагностики
    ↓
run-diagnostic-pipeline
    ├── Шаг 1: generate-diagnostic → quiz_json (Claude)
    ├── Шаг 2: generate-card-prompt → card_prompt (Claude)
    └── Шаг 3: generate-diagnostic-images × N (OpenRouter/Gemini)
                (для каждого {{IMAGE:PROMPT=...}} плейсхолдера)
```

### Данные

- `diagnostics` — метаданные квиза: `name`, `description`, `audience_tags`, `quiz_json`, `card_prompt`, `image_url`, `status`, `generation_progress`
- Статусы: `draft` → `generating` → `quiz_generated` → `generating_images` → `ready`
- Изображения загружаются в бакет `quiz-images`

---

## 11. Управление кейсами

### Пайплайн

```
Ввод URL папки Yandex Disk
    ↓
scan-case-folder → case_jobs + case_files
    ↓
transcribe-case-file → Deepgram API (async)
    ↓
deepgram-callback → transcript_text, transcript_json
    ↓
classify-case → classification_json (Claude)
```

### Таблицы

- `case_jobs` — задания на обработку папки: `folder_url`, `status`, `name`
- `case_files` — файлы в задании: `file_name`, `file_path`, `status`, `transcript_text`, `transcript_json`
- `case_classifications` — результат классификации: `classification_json`, `source_url`

### Статусы файлов

`pending` → `downloading` → `transcribing` → `transcribed` → `classifying` → `classified` / `error`

---

## 12. Аутентификация и роли

### Аутентификация

- Email + пароль через Supabase Auth
- Страница `/auth` с формами входа и регистрации
- `AuthContext` предоставляет `user`, `isAdmin`, `loading`
- Подтверждение email НЕ требуется (auto-confirm включен)

### Роли

- Enum `app_role`: `admin`, `user`
- Таблица `user_roles`: `user_id` → `role`
- SQL-функция `has_role(_user_id, _role)` — SECURITY DEFINER, используется в RLS
- При регистрации создаётся профиль в `profiles` через триггер
- Админ-роуты защищены через `ProtectedRoute` с `adminOnly={true}`

### Защищённые маршруты (только admin)

Теги, описания, промпты, переменные промптов, пользователи, архив, диагностики, PDF-материалы, email-шаблоны, настройки email, баннеры, кейсы, темы, возражения.

---

## 13. Хранилище (Storage)

| Бакет | Назначение |
|-------|-----------|
| `generated-images` | Изображения контента (карусели, посты, баннеры) |
| `quiz-images` | Изображения для диагностических квизов |
| `offer-images` | Изображения офферов (загруженные пользователем) |

---

## 14. Таблицы БД

| Таблица | Назначение |
|---------|-----------|
| `profiles` | Профили пользователей (id, full_name) |
| `user_roles` | Роли пользователей (admin/user) |
| `paid_programs` | Платные программы |
| `program_tags` | Связь программ с тегами |
| `tags` | Теги аудитории |
| `offers` | Офферы (8 типов) |
| `offer_tags` | Связь офферов с тегами (не используется) |
| `projects` | Проекты генерации контента |
| `lead_magnets` | Лид-магниты проектов |
| `content_pieces` | Сгенерированный контент |
| `generation_runs` | Логи запусков генерации |
| `prompts` | Промпты для AI-генерации |
| `prompt_versions` | История версий промптов |
| `prompt_global_variables` | Глобальные переменные промптов |
| `diagnostics` | Диагностические квизы |
| `email_letters` | Email-письма |
| `email_letter_blocks` | Блоки email-писем |
| `email_templates` | Шаблоны email |
| `email_settings` | Настройки email (хедер/футер) |
| `banners` | Библиотека баннеров |
| `color_schemes` | Цветовые схемы |
| `case_jobs` | Задания на обработку кейсов |
| `case_files` | Файлы кейсов |
| `case_classifications` | Классификации кейсов |
| `objections` | Возражения по программам |
| `topic_tree` | Дерево тем контента |
| `task_queue` | Очередь асинхронных задач |
| `pdf_materials` | PDF-материалы |

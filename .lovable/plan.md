

## «Подготовка PDF» — новый раздел

### Суть
Полноценный модуль генерации PDF-материалов с лендингом: навигация, страница-список, wizard создания, edge function для Claude API, публичный лендинг, страница просмотра PDF.

### Изменения

**1. Миграция БД**
- Добавить значение `pdf_generation` в enum `prompt_category`
- Создать таблицу `pdf_materials` (id, created_at, created_by, title, subtitle, material_type, program_id, program_name, audience_name, brand_style_name, html_content, sections_count, word_count, landing_headline, landing_descriptor, landing_button_text, landing_modal_type_word, landing_html, imagen_prompt, background_image_url, landing_slug UNIQUE, status DEFAULT 'generating')
- RLS: authenticated SELECT all, owner/admin INSERT/UPDATE/DELETE
- Вставить промпт в таблицу `prompts` с category=`pdf_generation`, system prompt из ТЗ

**2. `src/components/AppSidebar.tsx`**
- Добавить пункт `{ title: "Подготовка PDF", url: "/pdf-materials", icon: FileText }` первым в `contentPrepNav` (перед «Управление кейсами»)
- Импортировать иконку (FileText уже импортирован, использовать другую — например `FileDown` или `FilePlus2`)

**3. `src/pages/PdfMaterials.tsx`** — новая страница списка
- Заголовок: «Подготовка PDF» + описание
- Кнопка «+ Создать PDF» → открывает wizard
- Таблица: Название, Тип, Программа, Статус (badge), Дата, Действия (глобус→лендинг, скачать→/pdf-materials/:id, копировать ссылку, удалить)
- Пустое состояние: «Нет PDF-материалов. Создайте первый.»

**4. `src/components/pdf/CreatePdfWizard.tsx`** — wizard 3 шага
- Шаг 1: Название, Тип (6 вариантов), Программа (select из paid_programs), Аудитория (4 сегмента, появляется после выбора программы)
- Шаг 2: Бренд-стиль (select из color_schemes), Голос бренда (read-only из prompt_global_variables brand_voice)
- Шаг 3: Сводка + кнопка «Сгенерировать»
- При генерации: создать запись в pdf_materials со status=generating, вызвать edge function, обновить запись

**5. `supabase/functions/generate-pdf-material/index.ts`** — edge function
- Загружает промпт из `prompts` с category=`pdf_generation`
- Подставляет переменные: pdf_title, material_type, program_name, program_doc_description, audience_name, audience_description, brand_style, brand_voice
- Вызывает Anthropic API (claude-sonnet-4-20250514, max_tokens: 12000)
- Парсит JSON, генерирует landing_slug (транслитерация + 4 символа)
- Обновляет pdf_materials с результатом, ставит status=ready

**6. `src/pages/PdfMaterialView.tsx`** — страница просмотра PDF
- Рендерит html_content в iframe
- Кнопки: «Скачать PDF» (window.print) и «Назад»

**7. `src/pages/PublicLanding.tsx`** — публичный лендинг /l/:slug
- Без авторизации
- Загружает pdf_materials по landing_slug
- Заменяет BACKGROUND_IMAGE_URL на реальный URL
- dangerouslySetInnerHTML
- Обработчик download-btn: скачивание html_content как .html файл

**8. `src/App.tsx`** — маршруты
- `/pdf-materials` → PdfMaterials (admin)
- `/pdf-materials/:id` → PdfMaterialView (admin)
- `/l/:slug` → PublicLanding (публичный, вне AppLayout)

**9. `src/lib/promptConstants.ts`**
- Добавить `pdf_generation: "Генерация PDF"` в categoryLabels
- Добавить `pdf_material: "PDF-материал"` в contentTypeLabels
- Добавить маппинг в deriveCategory

**10. UX генерации**
- Прогресс-сообщения каждые 8 секунд (4 фразы)
- Toast с действиями при успехе
- Toast ошибки при неудаче

### Файлы
- 1 миграция (enum + таблица + промпт + RLS)
- 1 edge function (`generate-pdf-material`)
- 3 новые страницы (PdfMaterials, PdfMaterialView, PublicLanding)
- 1 компонент (CreatePdfWizard)
- 3 файла изменены (AppSidebar, App.tsx, promptConstants.ts)


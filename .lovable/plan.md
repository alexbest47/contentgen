

## Убираем sub_type (стратегии) из системы

Суть: вместо 3 стратегий (Анонс/Прогрев/Конверсия) на каждый канал — один промпт на канал. Категории content_pieces меняются с `pipeline_json_{subType}` на `pipeline_json_{contentType}`.

### 1. `src/lib/promptConstants.ts`
- Убрать `subTypeLabels`, `subTypeKeys`
- Убрать `sub_type` из `PromptForm` и `emptyForm`

### 2. `src/components/prompts/PromptFormDialog.tsx`
- Убрать поле выбора «Подтип (стратегия)»

### 3. `src/pages/Prompts.tsx` — Управление промптами
- Убрать группировку по sub_type. Вместо «Пайплайн: Instagram → Анонс / Прогрев / Конверсия» показывать просто «Пайплайн: Instagram» с одним промптом (или списком, если несколько)
- Группировка: только по `content_type`

### 4. `src/components/prompts/PipelineGroup.tsx`
- Остаётся, но теперь отображает промпты одного content_type без вложенности по sub_type

### 5. `src/pages/ProjectDetail.tsx` — Создание контента
- Убрать таблицу с 3 строками (Анонс/Прогрев/Конверсия) из каждого канала
- Вместо таблицы — одна кнопка «Создать»/«Обновить» на каждый канал + статус «Готово»
- При клике на карточку с готовым контентом — переход на `/content/:contentType` (без subType)
- `generatePipelineMutation` отправляет только `content_type` (без `sub_type`)
- `pipelineCounts` проверяет по `content_type` + `offer_type`, без `sub_type`
- `getPipelineJson` ищет `pipeline_json_{contentType}`

### 6. `src/pages/ContentDetail.tsx`
- Убрать `subType` из useParams, заголовка, и всех вызовов
- Категории: `pipeline_json_{contentType}`, `carousel_{contentType}_{n}`, `static_image_{contentType}`, `banner_{contentType}`
- Вызовы edge-функций без `sub_type`

### 7. `src/App.tsx` — Маршрут
- Изменить `/content/:contentType/:subType` на `/content/:contentType`

### 8. `supabase/functions/generate-pipeline/index.ts`
- Убрать `sub_type` из обязательных параметров
- Запрос промптов: `.eq("content_type", content_type).eq("offer_type", ...)` без `.eq("sub_type", ...)`
- Категория сохранения: `pipeline_json_${content_type}`

### 9. `supabase/functions/generate-pipeline-images/index.ts`
- Убрать `sub_type` из параметров
- Все категории: `pipeline_json_${content_type}`, `carousel_${content_type}_{n}`, `static_image_${content_type}`, `banner_${content_type}`
- Имена файлов: без `sub_type`

### Итого: 9 файлов


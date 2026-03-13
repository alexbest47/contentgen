

## Убрать категорию из формы промптов, авто-вычислять при сохранении

### Суть
Поле «Категория промпта» избыточно — оно однозначно определяется каналом (`content_type`). Убираем из UI, автоматически вычисляем при сохранении.

### Маппинг content_type → category
```text
instagram    → text_instagram
telegram     → text_telegram
vk           → text_vk
email        → text_email
(пусто)      → lead_magnets (по умолчанию)
```
Для диагностик (`test_generation`) — промпты уже существуют и не редактируются через эту форму.

### Файлы

**`src/lib/promptConstants.ts`**:
- Убрать `category` из `PromptForm` и `emptyForm`
- Добавить функцию `deriveCategory(contentType: string): PromptCategory` с маппингом выше
- Оставить экспорт `categoryLabels` и `categories` (используются в CSV-импорте и других местах)

**`src/components/prompts/PromptFormDialog.tsx`**:
- Убрать селектор «Категория промпта»
- Убрать импорт `categories`, `categoryLabels`

**`src/pages/Prompts.tsx`**:
- В `saveMutation` вычислять `category` через `deriveCategory(form.content_type)` перед отправкой в БД

**`src/components/prompts/CsvImportButton.tsx`**:
- Убрать `category` из CSV_HEADERS и экспорта/импорта
- При импорте автоматически вычислять category через `deriveCategory`
- Убрать валидацию категории

Edge-функции и БД — без изменений, колонка `category` остаётся, заполняется автоматически.


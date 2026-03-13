

## Добавить кнопку «Экспорт CSV» для промптов текущего типа оффера

### Суть
Рядом с существующими кнопками «Шаблон CSV» и «Импорт CSV» добавить кнопку «Экспорт CSV», которая выгружает все промпты текущего типа оффера (например, все 5 промптов мини-курса) в один CSV-файл с теми же колонками, что используются при импорте.

### Изменения

**`src/components/prompts/CsvImportButton.tsx`**:
- Добавить пропс `prompts` (массив промптов текущего offer type)
- Добавить функцию `exportCsv`, которая:
  - Берёт `CSV_HEADERS` как заголовок
  - Для каждого промпта формирует строку, используя уже существующую `escapeCsvField`
  - Создаёт Blob и скачивает файл `prompts_export_{offerTypeKey}.csv`
- Добавить кнопку `<Download /> Экспорт CSV` рядом с «Шаблон CSV»

**`src/pages/Prompts.tsx`**:
- Передать в `CsvImportButton` пропс `prompts` — отфильтрованный массив промптов для текущего `activeTab`

### Формат CSV
Те же 12 колонок что и при импорте: `name, slug, category, content_type, step_order, provider, model, description, system_prompt, user_prompt_template, output_format_hint, is_active`. Файл с BOM для корректного открытия в Excel.


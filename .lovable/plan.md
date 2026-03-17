

## Заменить CSV экспорт/импорт на экспорт всех промптов в TXT

### Что делаем

Убираем три кнопки (Экспорт CSV, Шаблон CSV, Импорт CSV) и весь связанный код. Вместо них — одна кнопка «Экспорт TXT», которая выгружает **все** промпты системы в текстовый файл.

### Формат TXT-файла

```text
=== Тип контента: Лидмагнит ===

--- Генерация лид-магнитов ---
[System Prompt]
...текст системного промпта...

[User Prompt Template]
...текст пользовательского промпта...

--- Текст поста + все Imagen-промпты: Instagram ---
[System Prompt]
...

[User Prompt Template]
...

=== Тип контента: Справочный материал ===
...
```

Промпты группируются по `content_type` в порядке: lead_magnet, reference_material, expert_content, provocative_content, list_content, testimonial_content (+ любые будущие типы). Внутри группы — по `step_order`.

### Изменения

**`src/components/prompts/CsvImportButton.tsx`** → полностью переписать в `src/components/prompts/ExportTxtButton.tsx`:
- Одна кнопка «Экспорт TXT»
- Принимает `prompts: any[]`
- Группирует по `content_type`, используя `contentTypeLabels` для заголовков
- Формирует текстовый файл и скачивает как `.txt`
- Убрать весь CSV-код, импорт, шаблоны, AlertDialog

**`src/pages/Prompts.tsx`**:
- Заменить `<CsvImportButton>` на `<ExportTxtButton prompts={prompts ?? []} />`
- Убрать импорт старого компонента

**Удалить**: `src/components/prompts/CsvImportButton.tsx`




## Добавить колонку «Описание программы» в таблицу описаний

В `src/pages/Descriptions.tsx` добавить новую колонку «Описание программы» между «Описание аудитории» и «Тип оффера», отображающую ссылку на `program_doc_url` из `paid_programs`.

### Изменения

**`src/pages/Descriptions.tsx`**:
- В запросе уже загружается `paid_programs(id, title, audience_doc_url)` — добавить `program_doc_url` в select
- Добавить `<TableHead>Описание программы</TableHead>` после «Описание аудитории»
- Добавить `<TableCell>` с аналогичной ссылкой «Открыть» на `program.program_doc_url`


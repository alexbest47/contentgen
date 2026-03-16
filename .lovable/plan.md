

## Удаление заданий + дедупликация файлов

### 1. Удаление задания (UI)
В `CaseManagement.tsx` добавить кнопку удаления задания с подтверждением (`AlertDialog`). При удалении:
- Удаляем `case_jobs` запись (каскадно удалятся `case_files` и `case_classifications` по FK)
- Инвалидируем все связанные queries

### 2. Дедупликация на уровне scan-case-folder
В `scan-case-folder/index.ts` после сбора видео, перед вставкой файлов:
- Запросить все существующие `case_files` с такими же `file_name` + `file_size`, у которых статус НЕ `error`
- Отфильтровать уже обработанные файлы из списка на вставку
- Вставить только новые файлы, пометить пропущенные как `skipped`

### 3. Дедупликация на уровне classify-case
В `classify-case/index.ts` перед классификацией:
- Проверить, есть ли уже запись в `case_classifications` с таким же `file_name` (от другого job)
- Если да — пропустить, поставить статус `classified` (или `skipped`) и перейти к следующему

### 4. Добавить статус `skipped` в UI
В `STATUS_MAP` добавить `skipped: { label: "Пропущен (дубль)", variant: "secondary" }`.

### Файлы
- `src/pages/CaseManagement.tsx` — кнопка удаления + статус skipped
- `supabase/functions/scan-case-folder/index.ts` — дедупликация по file_name
- `supabase/functions/classify-case/index.ts` — дедупликация перед классификацией


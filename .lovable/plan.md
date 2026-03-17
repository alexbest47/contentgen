

## Экспорт только промптов текущей вкладки

### Изменения

1. **`src/pages/Prompts.tsx`**: Добавить state `activeTab` для отслеживания текущей вкладки (`Tabs` → `onValueChange`). Передать в `ExportTxtButton` отфильтрованный массив промптов по `content_type === activeTab` (для `lead_magnet` — включая промпты с `content_type=lead_magnet` независимо от channel).

2. **`src/components/prompts/ExportTxtButton.tsx`**: Имя файла сделать динамическим — `prompts_export_{content_type}.txt`. Остальная логика без изменений.

### Результат

На вкладке «Лидмагнит» экспортируются только промпты с `content_type=lead_magnet` (генерация + 4 канала = ~5-6 промптов). На вкладке «Кейсы» — только `case_analysis` и т.д.




## Добавить ссылку на полное описание программы + переменную `{{program_doc_description}}`

### 1. Миграция БД
Добавить колонку `program_doc_url` в `paid_programs`:
```sql
ALTER TABLE paid_programs ADD COLUMN program_doc_url text;
```

### 2. `src/pages/ProgramDetail.tsx`
- Добавить состояние `editProgramDocUrl`
- Добавить поле ввода «Ссылка на Google Doc описания программы» в форму редактирования
- Сохранять `program_doc_url` в мутации обновления
- Показать ссылку рядом с ссылкой на аудиторию в шапке

### 3. `src/pages/Programs.tsx`
- Добавить состояние `programDocUrl` и поле ввода в диалог создания
- Передавать `program_doc_url` при insert

### 4. Edge-функции — добавить подстановку `{{program_doc_description}}`
Во всех функциях, которые делают подстановку переменных, добавить:
- Загрузку текста из `program_doc_url` (аналогично `audience_doc_url`)
- `.replace(/\{\{program_doc_description\}\}/g, programDocDescription)`

Файлы:
- `generate-lead-magnets/index.ts`
- `generate-content/index.ts`
- `generate-pipeline/index.ts`
- `generate-diagnostic/index.ts`
- `run-diagnostic-pipeline/index.ts`

### 5. `src/pages/PromptVariables.tsx`
Добавить строку в массив `variables`:
```ts
{ name: "{{program_doc_description}}", description: "Полное описание программы (загружается из Google Docs)", source: "Google Docs → paid_programs.program_doc_url" }
```


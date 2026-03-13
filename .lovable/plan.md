

## План: Список диагностик + редактирование драфтов + переименование переменных

### 1. Новая страница `src/pages/Diagnostics.tsx` — список всех диагностик

Таблица со столбцами: Программа | Название диагностики | Статус | Действия (кнопки «Редактировать» / «Открыть»).

Загружает все записи из `diagnostics` с джойном на `paid_programs.title`. Клик по строке или кнопке ведет на `/diagnostics/:id`.

### 2. Редактирование драфта на `DiagnosticDetail.tsx`

Для статуса `draft` — показывать редактируемые поля (название, описание, программа, теги, промпт) прямо на странице диагностики. Кнопка «Сохранить изменения» обновляет запись в БД. Для остальных статусов — только просмотр + генерация/результат (как сейчас).

### 3. Обновление сайдбара

Заменить пункт «Создать диагностику» на «Диагностики» (`/diagnostics`), ведущий на список. На странице списка — кнопка «Создать диагностику» для перехода на `/create-diagnostic`.

### 4. Маршрут в `App.tsx`

Добавить `/diagnostics` → `<Diagnostics />` (adminOnly).

### 5. Переименование переменных (из предыдущего утвержденного плана)

- **`supabase/functions/generate-diagnostic/index.ts`**: `{{quiz_name}}` → `{{test_name}}`, `{{quiz_description}}` → `{{test_description}}`
- **`src/pages/PromptVariables.tsx`**: добавить `{{test_name}}`, `{{test_description}}`, `{{audience_tags}}`

### Файлы

| Файл | Действие |
|---|---|
| `src/pages/Diagnostics.tsx` | Создать — список диагностик |
| `src/pages/DiagnosticDetail.tsx` | Добавить режим редактирования для draft |
| `src/components/AppSidebar.tsx` | «Создать диагностику» → «Диагностики» `/diagnostics` |
| `src/App.tsx` | Добавить маршрут `/diagnostics` |
| `supabase/functions/generate-diagnostic/index.ts` | Переименовать переменные |
| `src/pages/PromptVariables.tsx` | Добавить 3 переменные |


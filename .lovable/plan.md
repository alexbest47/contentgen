

## План: Страница справочника переменных промптов

Создать новую страницу `/prompt-variables` в разделе администрирования, отображающую все доступные шаблонные переменные с описанием и источником данных.

### Изменения

**1. Новый файл `src/pages/PromptVariables.tsx`**

Страница с таблицей переменных:

| Переменная | Описание | Источник |
|---|---|---|
| `{{program_title}}` | Название платной программы | `paid_programs.title` |
| `{{audience_description}}` | Описание аудитории | Google Docs → `paid_programs.audience_description` |
| `{{offer_type}}` | Тип оффера (мини-курс, вебинар и т.д.) | `offers.offer_type` |
| `{{offer_title}}` | Название оффера | `offers.title` |
| `{{offer_description}}` | Описание оффера | Google Docs → `offers.doc_url` |
| `{{lead_magnet}}` | Полный контекст лид-магнита | Сгенерированные данные |
| `{{lead_magnet_title}}` | Название лид-магнита | `lead_magnets.title` |
| `{{lead_magnet_description}}` | Описание лид-магнита | `lead_magnets.description` |

Используем `Card` + `Table` компоненты. Статическая страница, без запросов к БД.

**2. `src/App.tsx`** — добавить маршрут `/prompt-variables` с `adminOnly`.

**3. `src/components/AppSidebar.tsx`** — добавить пункт «Переменные промптов» в секцию «Администрирование» (иконка `Variable` или `Braces`).




## План: Обновление шаблонных переменных промптов

### Проблема

В подсказке к шаблону промпта (`Prompts.tsx`) указаны старые переменные: `{{mini_course_title}}`, `{{mini_course_description}}`. Нужно привести их в соответствие с новой архитектурой.

### Актуальные переменные (уже поддерживаются edge-функциями)

| Переменная | Значение |
|---|---|
| `{{program_title}}` | Название платной программы |
| `{{audience_description}}` | Описание аудитории программы |
| `{{offer_type}}` | Тип оффера |
| `{{offer_title}}` | Название оффера |
| `{{offer_description}}` | Описание оффера из Google Docs |
| `{{lead_magnet}}` | Полный контекст лид-магнита |
| `{{lead_magnet_title}}` | Название лид-магнита |
| `{{lead_magnet_description}}` | Описание лид-магнита |

### Изменения

**`src/pages/Prompts.tsx`** — обновить подсказку под полем «Шаблон пользовательского промпта»:

Заменить текущий текст переменных на:
`{{program_title}}, {{audience_description}}, {{offer_type}}, {{offer_title}}, {{offer_description}}, {{lead_magnet}}, {{lead_magnet_title}}, {{lead_magnet_description}}`

**Edge-функции** — убрать legacy-замены `{{mini_course_title}}` и `{{mini_course_description}}` из обеих функций (`generate-lead-magnets` и `generate-content`), оставив только актуальные переменные.


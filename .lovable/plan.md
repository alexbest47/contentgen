

## Проблема

Edge-функция `generate-email-block` не подставляет ключевые переменные в промпт:

| Переменная | Статус |
|---|---|
| `{{lead_magnet}}` | ❌ Не загружается и не подставляется |
| `{{audience_description}}` | ❌ Не подставляется |
| `{{program_doc_description}}` | ❌ Не подставляется |
| `{{offer_type}}` | ❌ Не подставляется |
| `{{program_title}}` | ✅ Работает |
| `{{offer_title}}` | ✅ Работает |
| `{{brand_voice}}`, `{{offer_rules}}`, `{{antiAI_rules}}` | ✅ Работает |

Фронтенд передаёт `config.selected_variant_id`, но edge-функция его не использует — не загружает выбранный лид-магнит из БД.

## Решение

Обновить `supabase/functions/generate-email-block/index.ts`:

1. **Загрузить выбранный вариант** из `lead_magnets` по `config.selected_variant_id` и подставить как `{{lead_magnet}}` (JSON-объект с title, visual_format, visual_content, instant_value и т.д.)

2. **Загрузить audience_description** из `paid_programs` (включая загрузку Google Doc по `audience_doc_url`, если есть) и подставить как `{{audience_description}}`

3. **Загрузить program_doc_description** из Google Doc по `program_doc_url` (если есть) и подставить как `{{program_doc_description}}`

4. **Подставить `{{offer_type}}`** — загрузить тип оффера и преобразовать в русский лейбл (как в `generate-lead-magnets`)

5. **Добавить подстановки** для контекстных переменных других типов блоков: `{{reference_material}}`, `{{expert_post_topic}}`, `{{provocation_topic}}`, `{{list_topic}}`, `{{myth_topic}}`, `{{case_angle}}`, `{{objection_angle}}` — все из того же `selected_variant_id`

Логика подстановки будет аналогична `generate-pipeline/index.ts`, где контекст выбранного варианта формируется как JSON-объект с полями, специфичными для типа блока.

## Файлы
- `supabase/functions/generate-email-block/index.ts` — единственный файл, фронтенд уже передаёт все нужные данные в `config`


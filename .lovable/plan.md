

## Добавить 15 промптов «Письма ДО и ПОСЛЕ вебинара» в раздел «Конструктор email»

### 1. SQL — вставка 15 промптов-заглушек

Вставить 15 записей в таблицу `prompts` с параметрами:
- `content_type = 'email_builder'`
- `category = 'email_builder'`
- `channel = 'webinar_before'` (письма 1–8) и `channel = 'webinar_after'` (письма 9–15)
- `step_order` = номер письма (1–15)
- `system_prompt` и `user_prompt_template` — пустые строки
- `is_active = true`
- Slug: `email-webinar-letter-1` … `email-webinar-letter-15`

### 2. UI — подразделы внутри вкладки «Конструктор email» (`Prompts.tsx`)

Заменить текущий inline-рендер вкладки `email_builder` (строки 577–590) на функцию `renderEmailBuilderTab()`:

- Существующие промпты (без `channel`) — показать как сейчас, заголовок «Генерация писем»
- Промпты с `channel = 'webinar_before'` — группа «Письма ДО вебинара»
- Промпты с `channel = 'webinar_after'` — группа «Письма ПОСЛЕ вебинара»
- Обе группы под общим заголовком-разделителем «Письма ДО и ПОСЛЕ вебинара»

Используется тот же паттерн PipelineGroup что и в других вкладках.

### Файлы

| Файл | Изменение |
|------|-----------|
| SQL миграция (insert) | 15 INSERT в `prompts` |
| `src/pages/Prompts.tsx` | Новая функция `renderEmailBuilderTab()` с группировкой |


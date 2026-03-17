

## Импорт промптов из TXT-файла

### Что в файле

Файл содержит обновлённые `system_prompt` и `user_prompt_template` для **20 промптов**:

| Секция в файле | Промпт в БД (id) |
|---|---|
| Генерация лид-магнитов | c3749d2b |
| Лидмагнит: Instagram | 269ce23e |
| Лидмагнит: Telegram | 581e3375 |
| Лидмагнит: VK | 12942409 |
| Лидмагнит: Email | 9dae47db |
| Генерация справочного материала | 612f8dab |
| Справочный материал: Instagram | b94aa5ed |
| Справочный материал: Telegram | ed0f35a4 |
| Справочный материал: VK | 561ad052 |
| Справочный материал: Email | 7d5727fd |
| Генерация тем экспертного контента | 365ed024 |
| Экспертный контент: Email | e537b934 |
| Генерация тем провокационного контента | 073a5e7a |
| Генерация вариантов списка | 04dccb9f |
| Генерация углов подачи кейса | 677324fd |

Промпты, **не входящие** в файл (не трогаем): диагностики, expert_content каналы (instagram/telegram/vk), provocative каналы, list каналы, testimonial_content.

### Подход

Создать **edge-функцию `import-prompts-txt`**, которая:
1. Принимает текст TXT-файла в body
2. Парсит секции по маркерам `--- название ---`, `[System Prompt]`, `[User Prompt Template]`
3. Сопоставляет каждую секцию с промптом в БД по имени (fuzzy match по ключевым словам content_type + channel)
4. Обновляет `system_prompt` и `user_prompt_template` для каждого найденного промпта
5. Возвращает отчёт: сколько обновлено, какие не найдены

Добавить **кнопку «Импорт TXT»** на страницу промптов рядом с «Экспорт TXT»:
- File input для выбора `.txt` файла
- Отправка содержимого в edge-функцию
- Toast с результатом

### Маппинг секций к промптам

Логика сопоставления по заголовку секции `--- название ---`:

```text
"Генерация лид-магнитов"                    → content_type=lead_magnet, channel=null
"Лидмагнит: Instagram"                      → content_type=lead_magnet, channel=instagram
"Лидмагнит: Telegram"                       → content_type=lead_magnet, channel=telegram
"Лидмагнит: VK"                             → content_type=lead_magnet, channel=vk
"Лидмагнит: Email"                          → content_type=lead_magnet, channel=email
"Генерация справочного материала"            → content_type=reference_material, channel=null
"Справочный материал: Instagram"             → content_type=reference_material, channel=instagram
"Справочный материал: Telegram"              → content_type=reference_material, channel=telegram
"Справочный материал: VK"                    → content_type=reference_material, channel=vk
"Справочный материал: Email"                 → content_type=reference_material, channel=email
"Генерация тем экспертного контента"         → content_type=expert_content, channel=null
"Экспертный контент: Email"                  → content_type=expert_content, channel=email
"Генерация тем провокационного контента"     → content_type=provocative_content, channel=null
"Генерация вариантов списка"                 → content_type=list_content, channel=null
"Генерация углов подачи кейса"               → content_type=case_analysis, channel=null
```

### Файлы

| Файл | Действие |
|---|---|
| `supabase/functions/import-prompts-txt/index.ts` | Новая edge-функция для парсинга и обновления |
| `src/components/prompts/ImportTxtButton.tsx` | Новый компонент с кнопкой импорта |
| `src/pages/Prompts.tsx` | Добавить `ImportTxtButton` рядом с `ExportTxtButton` |

### После реализации

Вызвать edge-функцию с содержимым загруженного файла для обновления всех 15+ промптов.


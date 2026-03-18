

## Задача

1. Удалить из БД 7 устаревших промптов конструктора email (блоки лид-магнита, справочного материала, экспертного контента, провокационного контента, поста-списка, разбора мифа, отработки возражения).
2. Создать болванку промпта «Генерация письма» (`slug: email-builder-full-letter`, `content_type: email_builder`).

---

## Реализация — 1 миграция

```sql
-- Удалить устаревшие блочные промпты конструктора email
DELETE FROM public.prompts
WHERE content_type = 'email_builder'
  AND slug IN (
    'email-builder-lead-magnet',
    'email-builder-reference-material',
    'email-builder-expert-content',
    'email-builder-provocative-content',
    'email-builder-list-content',
    'email-builder-myth-busting',
    'email-builder-objection-handling'
  );

-- Создать болванку промпта «Генерация письма»
INSERT INTO public.prompts (
  name, slug, description, provider, model,
  system_prompt, user_prompt_template,
  is_active, content_type, channel, step_order, category
) VALUES (
  'Генерация письма',
  'email-builder-full-letter',
  'Генерация полного HTML письма по теме, шаблону, программе, офферу и кейсу',
  'anthropic',
  'claude-sonnet-4-20250514',
  'Ты генератор email-писем. Возвращай JSON с полями html и image_placeholders.',
  '',
  true,
  'email_builder',
  NULL,
  2,
  'email_builder'
);
```

Удаление идёт по `slug` — это безопаснее чем по `name`, так как slug уникален. Если slug'и в БД отличаются от ожидаемых, удаление просто не затронет записи (без ошибок).

После миграции во вкладке «Конструктор email» останутся:
1. Тема и прехедер письма
2. **Генерация письма** (новый)
3. Блок кейса / отзыва
4. Блок подборки офферов

Файлы кода не затрагиваются — edge-функция `generate-email-letter` уже ищет промпт по `slug: email-builder-full-letter`.


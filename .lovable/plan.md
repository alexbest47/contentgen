

## Проблема

Миграция пыталась удалить промпты по slug с дефисами (`email-builder-lead-magnet`), но реальные slug'и в базе содержат подчёркивания (`email-builder-lead_magnet`). Поэтому DELETE не нашёл ни одной записи.

## Решение

Удалить 7 промптов по их реальным slug'ам. Это операция с данными (DELETE), не миграция схемы — используем insert tool.

```sql
DELETE FROM public.prompts
WHERE slug IN (
  'email-builder-lead_magnet',
  'email-builder-reference_material',
  'email-builder-expert_content',
  'email-builder-provocative_content',
  'email-builder-list_content',
  'email-builder-myth_busting',
  'email-builder-objection_handling'
);
```

После этого во вкладке «Конструктор email» останутся 4 промпта:
1. Тема и прехедер письма
2. Генерация письма
3. Блок кейса / отзыва
4. Блок отработки возражения — нет, этот тоже удалится

Останутся 3:
1. Тема и прехедер письма
2. Генерация письма
3. Блок кейса / отзыва

Подождите — по плану нужно оставить ещё «Блок подборки офферов», но его нет в базе. Нужно проверить, есть ли он, или его тоже нужно создать.

Итого — 1 DELETE-запрос через insert tool. Код не затрагивается.


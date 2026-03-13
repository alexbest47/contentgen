

## Исправить edge-функцию generate-lead-magnets для поддержки диагностик

### Найденные проблемы

1. **Нет фильтра по `offer_type`** — запрос промпта берёт первый попавшийся `lead_magnets`, без учёта типа оффера
2. **Промпт диагностик использует другие переменные** — `{{test_name}}` и `{{test_description}}` вместо `{{offer_title}}`/`{{offer_description}}`, но функция их не подставляет
3. **Промпт возвращает `transition_to_test`**, а код маппит только `transition_to_course` — поле не сохранится
4. **Промпт содержит поле `id`** в ответе, но мы его игнорируем — это нормально, но нужно учесть `transition_to_test`

### Изменения в `supabase/functions/generate-lead-magnets/index.ts`

**1. Фильтр промпта по offer_type (строки 97-109)**

Добавить `.eq("offer_type", offer.offer_type)`. Без fallback — если не найден, ошибка.

**2. Загрузка диагностики для offer_type=diagnostic (после строки 33)**

Если `offer.offer_type === "diagnostic"`, загрузить запись из таблицы `diagnostics` по `offer_id = offer.id`, чтобы получить `name` (test_name) и `description` (test_description).

**3. Добавить подстановку переменных `{{test_name}}` и `{{test_description}}` (строки 112-118)**

Добавить в цепочку `.replace()`:
- `{{test_name}}` → `diagnostic.name`
- `{{test_description}}` → `diagnostic.description`

Для не-диагностик эти переменные просто не встретятся в шаблоне.

**4. Маппинг `transition_to_test` при сохранении (строки 162-171)**

Изменить маппинг поля:
```
transition_to_course: lm.transition_to_test || lm.transition_to_course || ""
```

Так поддерживаются оба формата ответа — и для мини-курсов (`transition_to_course`), и для диагностик (`transition_to_test`).


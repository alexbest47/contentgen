

## Исправление маппинга полей для экспертного контента

### Проблема
Промпт для экспертного контента возвращает JSON с полями `topic_title`, `topic_angle`, `hook`, `category`, `transition_to_offer` — но Edge-функция ожидает `title`, `visual_format`, `visual_content`, `instant_value`, `save_reason`, `transition_to_course`, `cta_text`. Данные теряются при записи в `lead_magnets`.

### Решение

Добавить в `generate-lead-magnets/index.ts` отдельный маппинг для `expert_content`, переиспользуя существующие поля таблицы `lead_magnets`:

| Поле промпта | Поле таблицы | Логика |
|---|---|---|
| `topic_title` | `title` | Заголовок темы |
| `category` | `visual_format` | Категория по Хормози (переиспользуем поле) |
| `topic_angle` | `visual_content` | Угол подачи |
| `hook` | `instant_value` | Крючок |
| `transition_to_offer` | `transition_to_course` | Переход к офферу |
| — | `save_reason` | Пустое |
| — | `cta_text` | Пустое |

Также промпт возвращает **10 тем** (а не 3), поэтому нужно убрать `slice(0, 3)` для `expert_content` — аналогично `reference_material`.

### Изменения

**`supabase/functions/generate-lead-magnets/index.ts`** (строки 148-183):
- Добавить ветку `expert_content` в парсинге (ожидаем массив — текущая логика подходит)
- Добавить маппинг полей для `expert_content` в блоке `inserts`
- Не обрезать до 3 элементов для `expert_content`

### Отображение на фронтенде

Нужно также проверить, как `lead_magnets` отображаются на странице `OfferDetail.tsx` — убедиться, что для `expert_content` показываются правильные лейблы полей (например, «Угол подачи» вместо «Визуальный контент»).

**`src/pages/OfferDetail.tsx`**: Адаптировать отображение карточек lead_magnets для типа `expert_content` — показывать `category` (из `visual_format`), `topic_angle` (из `visual_content`), `hook` (из `instant_value`), скрывать нерелевантные поля.

Итого: 2 файла — Edge-функция + страница оффера.


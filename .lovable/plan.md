

## Исправление: промпты не находятся после разделения content_type и channel

### Проблема
После миграции все канальные промпты имеют `content_type = 'lead_magnet'` и канал в колонке `channel`. Но три места в коде по-прежнему ищут промпты по `content_type` = "instagram"/"telegram"/"vk"/"email":

1. **`src/pages/ProjectDetail.tsx`** (строки 82-96) — `pipelineCounts` группирует промпты по `content_type`, а должен по `channel`
2. **`src/pages/ProjectDetail.tsx`** (строка 245) — поиск имени промпта по `content_type === ct.key`, а нужно по `channel`
3. **`supabase/functions/generate-pipeline/index.ts`** (строка 87) — `.eq("content_type", content_type)` ищет промпт по каналу в поле content_type

### Изменения

**1. `src/pages/ProjectDetail.tsx`**
- Запрос `pipelineCounts` (строки 82-96): выбирать `channel` вместо `content_type`, группировать по `channel`
- Строка 245: искать промпт по `channel` вместо `content_type`
- Обновить `usePromptInfo` — добавить выборку поля `channel`

**2. `src/hooks/usePromptInfo.ts`**
- Добавить `channel` в select и в фильтры
- Добавить параметр `channel` в интерфейс фильтров

**3. `supabase/functions/generate-pipeline/index.ts`**
- Строка 87: заменить `.eq("content_type", content_type)` на `.eq("channel", content_type)` (переменная `content_type` из запроса — это канал: instagram/telegram/vk/email)


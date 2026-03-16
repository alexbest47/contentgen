

## Добавление нового типа контента «Экспертный контент»

### Что нужно сделать

1. **Миграция БД** — добавить значение `expert_content` в enum `prompt_category` (для хранения категории промптов экспертного контента). Поле `content_type` в таблицах `projects` и `prompts` — обычный `text`, новых значений enum добавлять не нужно.

2. **Вставка 5 пустых промптов-болванок** в таблицу `prompts` через миграцию:
   - `content_type: "expert_content"`, без канала, step_order=1 — «Генерация тем экспертного контента»
   - `content_type: "expert_content"`, channel: `instagram`, step_order=1 — «Текст поста + Imagen-промпты: Instagram»
   - `content_type: "expert_content"`, channel: `telegram`, step_order=1 — «Текст поста + Imagen-промпты: Telegram»
   - `content_type: "expert_content"`, channel: `vk`, step_order=1 — «Текст поста + Imagen-промпты: VK»
   - `content_type: "expert_content"`, channel: `email`, step_order=1 — «Текст письма + Imagen-промпт баннера: Email»

3. **`src/lib/promptConstants.ts`**:
   - Добавить `expert_content: "Экспертный контент"` в `contentTypeLabels`
   - Обновить `deriveCategory` для обработки `expert_content`

4. **`src/pages/Prompts.tsx`**:
   - Добавить фильтр `expertContentPrompts` и новую вкладку «Экспертный контент» с той же структурой (общие + по каналам)

5. **`src/pages/OfferDetail.tsx`**:
   - Добавить кнопку «Сгенерировать экспертный контент» рядом с существующими
   - Расширить `generateMutation` для поддержки `content_type: "expert_content"`
   - Добавить метку «Экспертный контент» в бейдж типа проекта
   - Добавить статусные лейблы для `expert_content`

6. **`src/pages/ProjectDetail.tsx`**:
   - Добавить статусные лейблы для `expert_content`

7. **`src/components/prompts/PromptFormDialog.tsx`**:
   - Показывать выбор канала также для `expert_content` (не только `lead_magnet`)

8. **Edge-функция `generate-lead-magnets`**:
   - Добавить маппинг `expert_content` → соответствующую `promptCategory` в строке 15

### Файлы для изменения
- 1 миграция SQL (enum + seed данные)
- `src/lib/promptConstants.ts`
- `src/pages/Prompts.tsx`
- `src/pages/OfferDetail.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/components/prompts/PromptFormDialog.tsx`
- `supabase/functions/generate-lead-magnets/index.ts`


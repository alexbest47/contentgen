

## Доработка промптов с помощью AI

### Что будет сделано

Кнопка «Доработать с AI» (иконка Sparkles) на каждой карточке промпта. При нажатии — диалог с textarea для инструкций. Система отправляет текущие system_prompt и user_prompt_template вместе с инструкцией пользователя в Claude, получает обновлённые тексты и сохраняет их в БД.

### Изменения по файлам

**`supabase/functions/refine-prompt/index.ts`** (новый):
- Edge function, использует `ANTHROPIC_API_KEY` (как все остальные функции)
- Принимает `{ prompt_id, instruction }`, загружает промпт из БД
- Отправляет в Claude системное сообщение: «Ты — эксперт по промпт-инжинирингу. Тебе дан промпт (системный + пользовательский шаблон). Пользователь просит доработать его. Верни JSON с полями system_prompt и user_prompt_template.»
- User message: текущие промпты + инструкция пользователя
- Парсит JSON из ответа, обновляет `prompts` таблицу (`system_prompt`, `user_prompt_template`)
- Возвращает обновлённые тексты

**`src/components/prompts/RefinePromptDialog.tsx`** (новый):
- Dialog с textarea для инструкции
- Кнопка «Доработать» вызывает edge function через `supabase.functions.invoke("refine-prompt", ...)`
- После успеха — invalidate `["prompts"]`, toast, закрытие диалога

**`src/components/prompts/PromptStepCard.tsx`** (изменение):
- Добавить кнопку с иконкой `Sparkles` рядом с кнопками дублирования/редактирования
- Prop `onRefine: (prompt: any) => void`
- Вызов `onRefine(p)` при клике

**`src/pages/Prompts.tsx`** (изменение):
- Добавить state для `refinePrompt` (текущий промпт для доработки)
- Передать `onRefine` в `PromptStepCard` и `PipelineGroup`
- Рендер `RefinePromptDialog`

**`src/components/prompts/PipelineGroup.tsx`** (изменение):
- Прокинуть `onRefine` prop вниз в `PromptStepCard`




## Добавить кнопку «Дублировать» для промптов

### Изменения

**`src/components/prompts/PromptStepCard.tsx`**:
- Добавить проп `onDuplicate: (prompt: any) => void`
- Добавить кнопку `Copy` (иконка из lucide-react) рядом с кнопкой редактирования

**`src/components/prompts/PipelineGroup.tsx`**:
- Прокинуть новый проп `onDuplicate` в `PromptStepCard`

**`src/pages/Prompts.tsx`**:
- Добавить функцию `openDuplicate(prompt)` — аналог `openEdit`, но без `setEditId` (editId остаётся null), и с модифицированным `name` (добавить " (копия)") и новым `slug` (добавить "-copy")
- Так диалог откроется в режиме создания нового промпта, но с заполненными полями из оригинала
- Прокинуть `onDuplicate` во все места, где используется `PromptStepCard` и `PipelineGroup`




## Убрать функцию «Доработать с AI» из управления промптами

Удалить кнопку Sparkles (доработка AI) с карточек промптов и убрать связанный диалог.

### Изменения

**1. `src/components/prompts/PromptStepCard.tsx`**
- Удалить prop `onRefine` и кнопку с иконкой `Sparkles`.
- Убрать импорт `Sparkles`.

**2. `src/components/prompts/PipelineGroup.tsx`**
- Удалить prop `onRefine` и его передачу в `PromptStepCard`.

**3. `src/pages/Prompts.tsx`**
- Удалить состояние `refineTarget` и `RefinePromptDialog`.
- Убрать передачу `onRefine` в компоненты.

### Файлы
- `src/components/prompts/PromptStepCard.tsx`
- `src/components/prompts/PipelineGroup.tsx`
- `src/pages/Prompts.tsx`


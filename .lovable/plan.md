

## Проблема: промпт карты не обновляется при регенерации

### Корневая причина

В `handleGenerate` на странице `DiagnosticDetail.tsx` (строка 286) при запуске генерации **не очищаются** поля `card_prompt` и `quiz_json`:

```typescript
// Текущий код — НЕ очищает card_prompt и quiz_json
.update({ status: "generating", generation_progress: null })
```

При этом в `Diagnostics.tsx` → `handleRegenerate` (строка 99) всё правильно:
```typescript
// Правильный код
.update({ status: "generating", generation_progress: null, quiz_json: null, thank_you_json: null, card_prompt: null })
```

Результат: старый `card_prompt` остаётся в БД, поллинг видит его и сразу отмечает шаг как "done". Новый промпт карты мог вообще не сгенерироваться (Claude мог тайм-аутнуть — в логах нет "Step 2a: Card prompt saved"), но UI этого не заметил.

### Дополнительная проблема

Логи показывают **два одновременных запуска** пайплайна для одной диагностики (два boot'а, два Step 1). Возможно, `handleGenerate` был вызван дважды.

### Изменения

**1. `src/pages/DiagnosticDetail.tsx`** — `handleGenerate`

Добавить очистку `card_prompt` и `quiz_json` при запуске генерации (как в `Diagnostics.tsx`):

```typescript
.update({ status: "generating", generation_progress: null, quiz_json: null, card_prompt: null })
```

Также добавить защиту от двойного вызова (disable кнопку сразу или проверять `isGenerating`).

**2. `supabase/functions/run-diagnostic-pipeline/index.ts`**

Добавить логирование результата Step 2a более явно — если Claude вернул ошибку или тайм-аут, логировать это. Сейчас ошибка поглощается `catch` на строке 243-245 без деталей.


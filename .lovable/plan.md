

## Проблема: таймаут card prompt в run-diagnostic-pipeline

Edge-функция `run-diagnostic-pipeline` имеет лимит ~150 сек. После генерации квиза (~60 сек) остаётся ~90 сек. Claude для промпта карты может занимать 60-130 сек — функция убивается до получения ответа.

Изображения не страдают, т.к. запускаются как отдельные edge-функции (fire-and-forget). Промпт карты же выполняется **внутри** основной функции и гибнет вместе с ней.

Когда `process-diagnostic-image` завершает последнее изображение, оно ставит `status: "ready"`. Поллинг на фронтенде видит `ready` → помечает ВСЕ шаги как done, включая промпт карты (хотя он так и не был сгенерирован).

## Решение: вынести генерацию промпта карты в отдельную edge-функцию

### 1. Создать `supabase/functions/generate-card-prompt/index.ts`

Отдельная edge-функция, которая:
- Принимает `{ diagnostic_id, program_id, name, description, audience_tags }`
- Загружает prompt2 (с именем "карт") из БД
- Вызывает Claude
- Сохраняет `card_prompt` в `diagnostics`
- Имеет свой собственный таймаут (~150 сек), полностью независимый

### 2. Обновить `run-diagnostic-pipeline/index.ts`

Заменить inline `cardPromptPromise` на fire-and-forget fetch:

```typescript
// Вместо await cardPromptPromise — fire-and-forget
fetch(`${SUPABASE_URL}/functions/v1/generate-card-prompt`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  body: JSON.stringify({ diagnostic_id, program_id, name, description, audience_tags }),
}).catch(e => console.error("[pipeline] Failed to trigger card prompt:", e));
```

Удалить `cardPromptPromise` и все `await cardPromptPromise`.

### 3. Обновить `supabase/config.toml`

Добавить секцию для новой функции:
```toml
[functions.generate-card-prompt]
verify_jwt = false
```

### 4. Обновить `process-diagnostic-image` — финализация статуса

Сейчас последнее изображение ставит `status: "ready"`. Нужно проверять, есть ли уже `card_prompt`:
- Если `card_prompt` уже есть → `status: "ready"`  
- Если нет → `status: "generating_images"` (оставить, пусть card prompt потом финализирует)

Аналогично в `generate-card-prompt`: после сохранения проверить, завершены ли изображения:
- Если статус `ready` или все изображения done → оставить `ready`
- Если изображения ещё идут → не менять статус

### 5. Обновить фронтенд — финализация "Готово"

В `updateStepsFromStatus`: статус `ready` помечает "Готово" только если `card_prompt` существует. Иначе шаг "Генерация промпта карты" остаётся `active`.

### Итоговый поток

```text
run-diagnostic-pipeline:
  Step 1: Claude → quiz_json (внутри функции)
  Fire-and-forget → generate-card-prompt (отдельная функция)
  Fire-and-forget → process-diagnostic-image (отдельная функция)
  Return ← функция завершается быстро

generate-card-prompt:        process-diagnostic-image:
  Claude → card_prompt         Image 0 → Image 1 → ... → Image N
  Проверить images done?       Проверить card_prompt есть?
  Если да → status: ready      Если да → status: ready
```


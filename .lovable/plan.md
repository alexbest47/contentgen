

## Проблема: таймаут edge-функции при генерации изображений

### Диагностика

Логи `run-diagnostic-pipeline`:
```
11:49:45 — Step 1: Calling Claude
11:51:32 — Step 1 done (23983 chars, 13 placeholders)
11:51:32 — Step 1.5: Calling Claude for card prompt
11:52:58 — Step 1.5 done (10808 chars)
11:52:59 — Generating image 1/13
(тишина — функция убита по таймауту)
```

Edge-функции имеют ограничение по времени выполнения. Два вызова Claude заняли ~3 минуты, после чего на изображения времени не осталось.

### Решение: вынести генерацию изображений в отдельные вызовы

Разделить пайплайн на две фазы:

**Фаза 1** (edge-функция `run-diagnostic-pipeline`): только Claude-вызовы (quiz + card prompt). После завершения — статус `card_prompt_generated`. Убрать весь код генерации изображений из этой функции.

**Фаза 2** (фронтенд `DiagnosticDetail.tsx`): после получения статуса `card_prompt_generated` — запускать генерацию изображений по одному через существующую edge-функцию `generate-diagnostic-images`. Каждое изображение = отдельный вызов, отдельный таймаут.

### Изменения

#### 1. `run-diagnostic-pipeline/index.ts`
- Удалить весь блок генерации изображений (шаг 2, ~100 строк).
- После card_prompt вместо `generating_images` ставить статус `images_pending`.
- Сохранять массив image placeholders в `generation_progress.placeholders` для фронтенда.

#### 2. `DiagnosticDetail.tsx`
- При обнаружении статуса `images_pending` или `card_prompt_generated` — запускать цикл генерации изображений с фронтенда.
- Для каждого placeholder вызывать `supabase.functions.invoke("generate-diagnostic-images", { body: { diagnostic_id, image_description: prompt, placeholder_index: i } })`.
- После каждого успешного вызова — обновлять `quiz_json` (заменять placeholder на URL) и `generation_progress`.
- По завершении всех — ставить статус `ready`.

#### 3. `generate-diagnostic-images/index.ts`
- Уже существует и генерирует одно изображение за вызов. Проверить, что она принимает `image_description` и возвращает `image_url`.

### Преимущества
- Каждый вызов укладывается в таймаут (одно изображение ~30-60 сек).
- Прогресс обновляется в реальном времени после каждого изображения.
- Остановка работает мгновенно (фронтенд просто прекращает вызовы).
- Retry отдельных изображений становится тривиальным.


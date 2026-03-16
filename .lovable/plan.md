

## Диагностика: проблема архитектуры в выборе промпта

### Найденная проблема

Это **архитектурный баг**, а не проблема промпта.

В Edge-функции `generate-pipeline` при выборе промпта фильтрация идёт **только по каналу** (`channel = 'instagram'`) и `is_active = true`, с `limit(1)`:

```
.eq("channel", content_type)   // content_type здесь = "instagram"
.eq("is_active", true)
.limit(1)
```

При этом для Instagram существуют **два активных промпта**:
1. `content_type: lead_magnet` — «Текст поста + все Imagen-промпты: Instagram»
2. `content_type: reference_material` — тот же канал, но другой шаблон

Функция **не учитывает `content_type` проекта** и всегда берёт первый попавшийся промпт. Для проекта со справочным материалом мог быть подхвачен промпт для лид-магнита (или наоборот).

Что касается «диагностической карты» в тексте — это, скорее всего, артефакт промпта или контекста оффера. Сам оффер имеет `offer_type: mini_course`, так что переменная `{{offer_type}}` передаётся корректно как `mini_course`. Но если был подхвачен не тот промпт, его system prompt мог направить Claude в другую сторону.

### Решение

**`generate-pipeline/index.ts`** — добавить фильтрацию по `content_type` проекта при выборе промпта:

```typescript
// Определяем content_type проекта для выбора правильного промпта
const projectContentType = project.content_type || "lead_magnet";

const { data: pipelineSteps } = await supabase
  .from("prompts")
  .select("*")
  .eq("channel", content_type)        // канал (instagram, telegram...)
  .eq("content_type", projectContentType)  // ← НОВЫЙ ФИЛЬТР
  .eq("is_active", true)
  .order("step_order", { ascending: true })
  .limit(1);
```

Аналогичное исправление нужно в **`generate-pipeline-images/index.ts`** и **`generate-image/index.ts`**, если они тоже выбирают промпты без учёта `content_type`.

Итого: исправление фильтрации в 1-3 Edge-функциях. Одна строка `.eq("content_type", projectContentType)` в каждой.


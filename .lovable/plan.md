

## Адаптация edge-функции для справочного материала (1 результат вместо 3)

### Проблема
Промпт для справочного материала возвращает **один JSON-объект** `{...}`, а не массив `[{}, {}, {}]`. Текущий парсинг ищет массив через `/\[[\s\S]*\]/` и делает `.slice(0, 3)` — это сломается.

### Изменение в `supabase/functions/generate-lead-magnets/index.ts`

Обновить блок парсинга (строки 148-160) и вставки (строки 164-175):

```typescript
let leadMagnets;
try {
  if (content_type === "reference_material") {
    // Single object expected
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      leadMagnets = [JSON.parse(jsonMatch[0])];
    } else {
      throw new Error("No JSON object found in response");
    }
  } else {
    // Array expected
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      leadMagnets = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON array found in response");
    }
  }
} catch (parseErr) { ... }
```

Для вставки: убрать `.slice(0, 3)` для reference_material (массив уже содержит 1 элемент), оставить для lead_magnet:

```typescript
const items = content_type === "reference_material" ? leadMagnets : leadMagnets.slice(0, 3);
const inserts = items.map((lm: any) => ({ ... }));
```

Одно изменение в одном файле. Всё остальное (таблица, UI, маппинг полей) уже совместимо.




## Удаление оффера «Распродажа» и переименование «Скидка» → «Промокод»

В БД нет офферов с типом `sale`, поэтому удаление безопасно. Тип `discount` остаётся, меняется только label.

### 1. Фронтенд: `src/lib/offerTypes.ts`

- Удалить строку `{ key: "sale", label: "Распродажа", icon: ShoppingCart }` и импорт `ShoppingCart`.
- Изменить label у `discount`: `"Скидка"` → `"Промокод"`.
- Убрать `"sale"` из `SALES_OFFER_KEYS`.

### 2. БД: удалить `sale` из enum `offer_type_enum`

Миграция: убрать значение `sale` из enum (создать новый enum без `sale`, пересоздать колонку).

### 3. Edge functions: обновить `OFFER_TYPE_LABELS` в 6 файлах

В каждом из этих файлов убрать `sale: "Распродажа"` и заменить `discount: "Скидка"` → `discount: "Промокод"`:

- `generate-content/index.ts`
- `generate-image/index.ts`
- `generate-email-block/index.ts`
- `generate-email-letter/index.ts`
- `generate-lead-magnets/index.ts`
- `generate-pipeline/index.ts`


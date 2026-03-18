

## Задача

Заменить двухвариантный переключатель режима блока на три варианта и обновить логику передачи режима в промпт.

## Изменения

### 1. `src/components/email-builder/GeneratedBlockSettings.tsx`

**Строки ~286-295** — заменить RadioGroup с двумя вариантами на три:

- `text_only` — «Только текст» (описание: без изображения, весь контент в тексте)
- `header_image` — «Заголовок + текст» (баннер с заголовком на цветном фоне, контент в тексте под баннером)
- `schema_image` — «Текст + схема» (баннер со схемой/пунктами, текст сокращённый: крючок + CTA)

**Строки ~463** — условие показа кнопки генерации изображения: заменить `config.mode === "text_image"` на `config.mode === "header_image" || config.mode === "schema_image"`.

### 2. `src/components/email-builder/BlockCanvas.tsx`

**Строка 50** — заменить `block.config.mode === "text_image"` на `block.config.mode === "header_image" || block.config.mode === "schema_image"` для определения `isTextImage` (показ заглушки/баннера).

### 3. `supabase/functions/generate-email-block/index.ts`

**Строка 232** — переменная `{{mode}}` уже подставляется как `mode || "text_only"`. Добавить подстановку `{{block_mode}}` с тем же значением для совместимости с промптами:

```typescript
.replace(/\{\{block_mode\}\}/g, mode || "text_only")
```

### 4. `src/pages/EmailBuilder.tsx`

**Строка ~173** в `generateBlock` — значение `mode` уже берётся из `block.config.mode`. Убедиться, что оно передаётся корректно (уже работает, изменений не требуется).

### 5. Экспорт HTML (`handleExport`)

**Строки ~213-215** — обновить условие вставки баннера: заменить проверку на `banner_image_url` (уже безусловная) — изменений не требуется, баннер вставляется если `banner_image_url` есть.

## Файлы
- `src/components/email-builder/GeneratedBlockSettings.tsx` — три варианта RadioGroup + условие кнопки
- `src/components/email-builder/BlockCanvas.tsx` — условие показа заглушки
- `supabase/functions/generate-email-block/index.ts` — добавить `{{block_mode}}`


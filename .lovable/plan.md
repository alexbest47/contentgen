

## Проблема

На скриншоте видно два дефекта:

1. **Сломанная картинка в HTML** — AI-модель возвращает HTML с тегом `<img>` без валидного src (показывается как сломанная иконка). Баннер должен управляться отдельно через `banner_image_url`, а не встраиваться в `block_html`.

2. **Заглушка без кнопки** — когда режим «Текст + изображение» и изображение не сгенерировано, на холсте показывается только текст «Изображение не сгенерировано» без кнопки генерации. Кнопка доступна только в правой панели настроек.

## Решение

### 1. Edge-функция: убрать `<img>` из сгенерированного HTML

В `supabase/functions/generate-email-block/index.ts`, после парсинга `block_html`, удалять все `<img>` теги из результата когда режим `text_image`. Баннер управляется отдельно через `banner_image_prompt` → `banner_image_url`.

```typescript
// После парсинга JSON, перед сохранением:
if (mode === "text_image") {
  block_html = block_html.replace(/<img[^>]*>/gi, "");
}
```

### 2. BlockCanvas: заглушка с кнопкой «Сгенерировать изображение»

В `BlockCanvas.tsx`:
- Добавить пропсы `onGenerateImage`, `generatingImageBlockId`
- Заменить текстовую заглушку (строки 117-121) на карточку с иконкой и кнопкой:

```
┌──────────────────────────────┐
│     🖼  Изображение          │
│  [Сгенерировать изображение] │
└──────────────────────────────┘
```

- Показывать заглушку **над текстом** (перед `generated_html`), а не после.

### 3. EmailBuilder: прокинуть пропсы

В `EmailBuilder.tsx`, передать `BlockCanvas` два новых пропса:
- `onGenerateImage={generateImage}`
- `generatingImageBlockId={generatingImageBlockId}`

### Файлы
- `supabase/functions/generate-email-block/index.ts` — удалить img-теги из HTML
- `src/components/email-builder/BlockCanvas.tsx` — заглушка с кнопкой генерации изображения над текстом
- `src/pages/EmailBuilder.tsx` — прокинуть пропсы в BlockCanvas


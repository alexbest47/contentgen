

## Обновление парсера изображений диагностик под новый формат `{{IMAGE:PROMPT=...}}`

### Что меняется

Сейчас парсер извлекает короткое описание из `{{IMAGE:описание}}` и отправляет его в edge-функцию вместе с шаблоном промпта из БД. Новый формат — `{{IMAGE:PROMPT=готовый промпт}}`, шаблон из БД больше не нужен.

### Файлы и изменения

**1. `supabase/functions/generate-diagnostic/index.ts`** (строки 114-120)
- Обновить regex для поиска плейсхолдеров: `/\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g`
- Извлекать значение после `PROMPT=` (полный промпт для Imagen)

**2. `supabase/functions/generate-diagnostic-images/index.ts`** (строки 66, 79-86)
- Убрать параметр `image_prompt_template` из входных данных
- Убрать логику подстановки шаблона (`if (image_prompt_template) { ... }`)
- `image_description` теперь содержит готовый промпт — отправлять напрямую в `generateImage()`

**3. `src/pages/DiagnosticDetail.tsx`** (строки 227-268)
- Убрать запрос `imagePrompts` (строки 117-129) — больше не нужен
- Убрать `const imageTemplate = imagePrompts?.[0]?.user_prompt_template` (строка 234)
- Убрать передачу `image_prompt_template` в body вызова `generate-diagnostic-images` (строка 247)
- Обновить формирование плейсхолдера для замены (строка 259): `{{IMAGE:PROMPT=${placeholders[i]}}}` вместо `{{IMAGE:${placeholders[i]}}}`

### Итоговый флоу

```text
Claude → JSON с {{IMAGE:PROMPT=полный промпт}}
       → generate-diagnostic извлекает PROMPT= значения
       → generate-diagnostic-images получает готовый промпт
       → отправляет напрямую в OpenRouter/Imagen
       → URL → замена в JSON → сохранение
```


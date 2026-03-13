

## Исправление генерации баннера Email

### Проблема
Edge-функция `generate-pipeline-images` ищет поле `banner_prompt` в JSON, но pipeline генерирует поле `banner_image_prompt`. Несовпадение имён → ошибка «В JSON нет banner_prompt».

### Решение
В `generate-pipeline-images/index.ts` (строка 161) добавить fallback на `banner_image_prompt`:

```typescript
const prompt = pipelineJson.banner_prompt || pipelineJson.banner_image_prompt;
if (!prompt) throw new Error("В JSON нет banner_prompt / banner_image_prompt");
```

Один файл, одна строка.




## Добавить переменную `image_style` в «Переменные промптов»

### Изменения

**`src/pages/PromptVariables.tsx`**

1. Добавить `image_style` в массив `GLOBAL_VARS`:
   ```
   { key: "image_style", name: "{{image_style}}", description: "Стиль изображений для всех imagen-промптов" }
   ```

2. Компонент `GlobalVariablesCard` уже поддерживает все ключи из `GLOBAL_VARS` — новая переменная автоматически получит textarea + кнопку «Сохранить». Она появится рядом с `brand_voice` (последним в списке), визуально рядом с `brand_style`.

**Миграция (insert) — значение по умолчанию**

Вставить запись в `prompt_global_variables`:
```sql
INSERT INTO prompt_global_variables (key, label, value) VALUES
('image_style', 'Стиль изображений',
 '[CORE STYLE]: Modern flat vector art style with clean, crisp, uniform dark outlines on all elements. The color palette must be limited, soft, matte, and muted earth-tones (e.g., dusty greens, warm beiges, terracotta, muted pinks, navy blues). Use only solid color fills; do not include complex gradients or textures.
[PERFORMANCE]: Characters are simplified human figures with basic facial features (dot eyes, simple lines) and stylized hair. Poses and expressions are clear but simplified. The background composition is clean, ordered, and composed of stylized geometric forms (like shelves or furniture).
[SPECIAL EFFECT]: Include clean, straight, geometric light rays or shafts of light cutting diagonally across the scene, creating flat, contrasting patterns of light and shadow on surfaces, adding geometry to the composition. No soft shadows.');
```

**Каталог переменных** — добавить в секцию «Оффер» (рядом с `brand_style`):
```
{ name: "{{image_style}}", description: "Визуальный стиль для всех imagen-промптов", source: "prompt_global_variables (image_style)" }
```

### Итого
- 1 файл (`PromptVariables.tsx`), ~3 строки добавлено
- 1 insert в `prompt_global_variables`


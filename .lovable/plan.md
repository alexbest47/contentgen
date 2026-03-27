

## Исправить подстановку стиля изображений в generate-email-letter

### Проблема
В `supabase/functions/generate-email-letter/index.ts` порядок замен неверный:

```text
Строка 326-328: for (const [k, v] of Object.entries(gv)) { ... }  
  → заменяет {{image_style}} на ГЛОБАЛЬНОЕ значение

Строка 330: userPrompt.replace(/\{\{image_style\}\}/g, imageStyleText)  
  → пытается заменить {{image_style}}, но плейсхолдер УЖЕ заменён
```

Результат: всегда используется глобальная переменная, выбранный пользователем стиль игнорируется.

### Решение

**`supabase/functions/generate-email-letter/index.ts`** — переместить замену `{{image_style}}` **до** цикла глобальных переменных:

```text
// Сначала заменяем image_style выбранным стилем
userPrompt = userPrompt.replace(/\{\{image_style\}\}/g, imageStyleText);

// Потом глобальные переменные (image_style уже заменён, повторно не перезапишется)
for (const [k, v] of Object.entries(gv)) {
  userPrompt = userPrompt.replace(...);
}
// Удалить строку 330 (дублирующую замену после цикла)
```

Аналогично проверить `supabase/functions/generate-email-block/index.ts` на тот же баг.

### Файлы
- `supabase/functions/generate-email-letter/index.ts` — переместить замену `{{image_style}}`
- `supabase/functions/generate-email-block/index.ts` — проверить и исправить аналогично


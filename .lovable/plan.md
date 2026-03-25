

## Ограничить ширину статических блоков до 600px

### Проблема
Внутренние белые карточки статических блоков имеют `width="100%"` без ограничения `max-width`, в то время как карточки и ИИ-блоки используют `max-width:600px;margin:0 auto`. Из-за этого статические блоки растягиваются на всю ширину.

### Решение
Добавить `max-width:600px;margin:0 auto` к внутренней белой таблице-карточке в `buildHtml()` обоих компонентов.

**`src/components/email-builder/PaidProgramsCollectionSettings.tsx`** (строка 94):
```
// Было:
style="background:#FFFFFF;border-radius:12px;overflow:hidden;"
// Стало:
style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;"
```

**`src/components/email-builder/FreeCoursesGridSettings.tsx`** (аналогичная строка):
```
// Было:
style="background:#FFFFFF;border-radius:12px;overflow:hidden;"
// Стало:
style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;"
```

Два однострочных изменения — после них ширина совпадёт с остальными блоками письма.


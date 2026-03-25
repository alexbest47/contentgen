

## Унифицировать кнопки управления изображениями — всегда справа

### Проблема
Для **unfilled** (пустых) заглушек кнопки рендерятся по центру поверх баннера (большие, с текстом). Для **filled** (заполненных) — маленькие иконки справа. Нужно сделать одинаково: всегда справа, маленькие иконки.

### Технические изменения

**Файл: `src/components/email-builder/BlockCanvas.tsx`**

1. **Удалить блок «Overlay buttons for UNFILLED placeholders (centered)»** (строки 429–489) — большие кнопки по центру с фоном и dashed border.

2. **Расширить блок «Floating buttons for FILLED placeholders (right side)»** (строки 491–552) — сделать его универсальным для ВСЕХ placeholder'ов (и filled, и unfilled):
   - Итерировать по `placeholderRects`, находить placeholder в общем списке `imagePlaceholders` (не только в `filledPlaceholders`).
   - Для unfilled: показывать кнопки «Сгенерировать» (ImageIcon), «Из библиотеки» (FolderOpen), «Загрузить» (Upload).
   - Для filled: показывать «Перегенерировать» (RefreshCcw), «Загрузить» (Upload), «Из библиотеки» (FolderOpen), «Сохранить в библиотеку» (BookmarkPlus).
   - Все кнопки — `size="icon"`, `h-8 w-8`, позиционирование `top: rect.top + 4, left: rect.left + rect.width + 8`.

3. **Оставить минимальную визуальную метку** для unfilled-заглушок — пунктирный border и текст с типом/размером остаются через CSS в `preprocessHtmlWithPlaceholders`, но без overlay-кнопок по центру.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx`


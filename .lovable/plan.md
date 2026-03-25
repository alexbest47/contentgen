

## Добавить панель форматирования текста в конструкторе писем

### Что делаем
Добавляем плавающую панель инструментов над contentEditable-блоком с кнопками: **жирный**, **курсив**, **подчёркивание**, **увеличить шрифт**, **уменьшить шрифт**, **выделение цветом** (highlight).

### Как это работает
Используем стандартный `document.execCommand()` — он работает в contentEditable и генерирует inline HTML-теги (`<b>`, `<i>`, `<u>`, `<span style="font-size:...">`, `<span style="background-color:...">`), которые сохраняются при onBlur и корректно экспортируются в email HTML.

### Технические изменения

**Файл: `src/components/email-builder/BlockCanvas.tsx`**

1. **Новый компонент `FormattingToolbar`** (внутри файла или отдельный):
   - Горизонтальная панель с 6 кнопками-иконками:
     - **B** (жирный) → `document.execCommand('bold')`
     - **I** (курсив) → `document.execCommand('italic')`
     - **U** (подчёркивание) → `document.execCommand('underline')`
     - **A+** (увеличить шрифт) → `document.execCommand('fontSize', false, '5')` или инкремент через `fontSize`
     - **A−** (уменьшить шрифт) → `document.execCommand('fontSize', false, '2')`
     - **🎨** (выделение цветом) → `document.execCommand('hiliteColor', false, color)` с выбором цвета через `<input type="color">`
   - Панель фиксируется над contentEditable-блоком (sticky/absolute), видна только в full letter mode
   - `onMouseDown={(e) => e.preventDefault()}` на каждой кнопке, чтобы не терять выделение текста при клике

2. **Размещение** — прямо перед `<div ref={contentRef} contentEditable ...>` внутри `<div className="relative">`, визуально как компактная toolbar с border-bottom.

3. **Размер шрифта** — реализуем через `execCommand('fontSize')` с значениями 1–7 (стандарт HTML), с текущим значением по умолчанию 3. Кнопки A+ и A− будут переключать между уровнями.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx` — добавить toolbar-компонент и разместить его в JSX


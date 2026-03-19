

## Задача

Сделать блоки шаблона (экспертный контент, лид-магнит, разбор мифа) нередактируемыми через правую панель. Только «Кейс / отзыв» (testimonial_content) остаётся редактируемым. Визуально отобразить разницу на холсте.

## Изменения

### 1. `src/components/email-builder/BlockLibrary.tsx`

Добавить экспортируемую функцию `isTemplateLocked(type)` — возвращает `true` для блоков, контент которых определяется промптом и не редактируется пользователем:

```ts
export const isTemplateLocked = (type: string) =>
  ["expert_content", "lead_magnet", "reference_material", 
   "provocative_content", "list_content", "myth_busting", 
   "objection_handling"].includes(type);
```

Эти типы отличаются от `testimonial_content`, который пользователь может настраивать (выбор кейса).

### 2. `src/components/email-builder/BlockCanvas.tsx`

Для блоков с `isTemplateLocked(block.block_type)`:
- Убрать кнопку настроек (шестерёнку) из hover-контролов — оставить только перемещение и удаление
- Добавить визуальную метку: полупрозрачная иконка замка + бейдж «Определяется промптом» в placeholder-состоянии
- Сделать клик по блоку не вызывающим `onSelectBlock` (не открывает правую панель)
- Стиль блока: слегка приглушённый бордер (например `border-muted-foreground/20`) без `ring` при выделении

### 3. `src/pages/EmailBuilder.tsx`

В обработчике `onSelectBlock` проверять: если тип блока `isTemplateLocked`, не устанавливать `selectedBlockId`. Это предотвратит показ `BlockSettingsPanel` для таких блоков.

### 4. `src/components/email-builder/BlockSettingsPanel.tsx`

Без изменений — защита реализована на уровне выше (блок просто не будет выбран).

### Визуальный результат

- **Редактируемые блоки** (testimonial_content, text, image, cta, divider, paid_programs_collection, free_courses_grid): кликабельные, с шестерёнкой, открывают правую панель
- **Заблокированные блоки** (expert_content, lead_magnet, myth_busting и др.): иконка замка, текст «Контент определяется промптом», без шестерёнки, клик не выделяет, визуально приглушены


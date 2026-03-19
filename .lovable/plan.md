

## Проблема

На скриншоте видно две проблемы:

1. **Пустое место** между сгенерированным блоком (фиолетовый) и пользовательским (белый «Программы»): вызвано `mt-4` и `space-y-2` на контейнере пользовательских блоков в `BlockCanvas.tsx` (строка 347).

2. **Квадратные углы** у пользовательских блоков: в HTML-шаблонах `PaidProgramsCollectionSettings` и `FreeCoursesGridSettings` внешний `<table>` не имеет `border-radius`, тогда как таблицы в AI-контенте имеют скругления.

## Изменения

### 1. `src/components/email-builder/BlockCanvas.tsx` (строка 347)

Убрать `mt-4` в full letter mode, оставить `space-y-0` чтобы блоки шли вплотную:

```
// Было:
<div className={`space-y-2 ${isFullLetterMode ? "mt-4" : ""}`}>

// Станет:
<div className={isFullLetterMode ? "" : "space-y-2"}>
```

### 2. `src/components/email-builder/PaidProgramsCollectionSettings.tsx`

В `buildHtml()` добавить `border-radius:12px;overflow:hidden;` на внешнюю `<table>`:

```html
<table width="100%" cellpadding="0" cellspacing="0"
  style="background:#FFFFFF;border-radius:12px;overflow:hidden;">
```

### 3. `src/components/email-builder/FreeCoursesGridSettings.tsx`

Аналогично — добавить `border-radius:12px;overflow:hidden;` на внешнюю `<table>`.

3 файла, по 1 строке в каждом.


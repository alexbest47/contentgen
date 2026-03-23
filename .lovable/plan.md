

## Исправить редактирование текста в конструкторе писем

### Причина бага
В `BlockCanvas.tsx` на каждом рендере создаётся новый массив `filledPlaceholders` (строка 149). Он указан как зависимость `useCallback` для `measurePlaceholders` (строка 197). Из-за новой ссылки массива `measurePlaceholders` получает новую ссылку каждый рендер. Это вызывает повторный запуск `useEffect` (строка 200), который сбрасывает `innerHTML` через `contentRef.current.innerHTML = processedHtml` — курсор теряется, редактирование невозможно.

### Исправление

**`src/components/email-builder/BlockCanvas.tsx`**

1. Разделить useEffect на два: один для установки innerHTML (зависит только от `processedHtml`), второй для измерения позиций placeholder'ов
2. Убрать `measurePlaceholders` из зависимостей useEffect, который устанавливает innerHTML
3. Вызывать `measurePlaceholders` через отдельный useEffect после обновления DOM

```typescript
// useEffect для innerHTML — только при реальном изменении контента
useEffect(() => {
  if (!isFullLetterMode || !contentRef.current || !processedHtml) return;
  contentRef.current.innerHTML = processedHtml;
}, [isFullLetterMode, processedHtml]);

// Отдельный useEffect для измерения позиций
useEffect(() => {
  if (!isFullLetterMode) return;
  requestAnimationFrame(measurePlaceholders);
}, [isFullLetterMode, processedHtml, measurePlaceholders]);
```

### Итого
- 1 файл, ~5 строк изменено




## Проблема

После генерации изображения `imagePlaceholders` обновляется в state, `processedHtml` пересчитывается с новым URL. Но **React не обновляет содержимое `contentEditable` div** через `dangerouslySetInnerHTML`, потому что браузер считает этот DOM «своим». В итоге `processedHtml` пересчитан, но в DOM остаётся старая заглушка.

## Решение

### `BlockCanvas.tsx`

Добавить `useEffect`, который при изменении `processedHtml` принудительно обновляет `innerHTML` контейнера:

```ts
useEffect(() => {
  if (contentRef.current && processedHtml) {
    contentRef.current.innerHTML = processedHtml;
    requestAnimationFrame(measurePlaceholders);
  }
}, [processedHtml]);
```

Это гарантирует, что когда `image_url` появляется в placeholder и `processedHtml` меняется (заглушка заменяется на `<img>`), DOM будет обновлён принудительно. После обновления также пересчитываются позиции overlay-кнопок, чтобы кнопка для уже сгенерированного изображения исчезла.

Один файл, ~5 строк.


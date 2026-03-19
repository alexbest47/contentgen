

## Проблема

`el.offsetTop` / `el.offsetLeft` считаются относительно ближайшего `offsetParent` элемента, а не контейнера `contentRef`. Поскольку плейсхолдеры находятся внутри вложенных `<table>` / `<td>`, их `offsetParent` — это ячейка таблицы, а не наш div. В итоге все кнопки получают одинаковые маленькие координаты и накладываются друг на друга.

## Решение

### `BlockCanvas.tsx` — `measurePlaceholders`

Заменить `el.offsetTop` / `el.offsetLeft` на расчёт через `getBoundingClientRect()`:

```ts
const containerRect = container.getBoundingClientRect();
els.forEach(el => {
  const elRect = el.getBoundingClientRect();
  rects.push({
    id,
    top: elRect.top - containerRect.top + container.scrollTop,
    left: elRect.left - containerRect.left + container.scrollLeft,
    width: elRect.width,
    height: elRect.height,
  });
});
```

`getBoundingClientRect()` всегда возвращает координаты относительно viewport, поэтому разница `elRect - containerRect` даёт правильное смещение внутри контейнера независимо от вложенности таблиц.

Один файл, ~5 строк изменений.



## Убрать тёмный фон справа у пустого banner placeholder

### Что происходит сейчас
Пунктирная рамка уже растягивается на весь баннер, но тёмный правый фон остаётся, потому что:

1. В `preprocessHtmlWithPlaceholders()` только первое вхождение `background-image: url({{image_placeholder_1}})` становится `background-image: none; background-color: transparent`.
2. Второе вхождение того же placeholder сейчас превращается только в `background-image: none`, поэтому исходный `background-color: rgba(0,0,0,0.55)` на правой ячейке остаётся видимым.
3. Сам overlay для banner placeholder почти прозрачный (`rgba(255,255,255,0.07)`), поэтому даже если контент под ним остаётся, пользователь всё равно видит тёмную правую часть.

### Что нужно изменить

**Файл:** `src/components/email-builder/BlockCanvas.tsx`

#### 1) Нейтрализовать обе ячейки баннера в unfilled-состоянии
В `preprocessHtmlWithPlaceholders()`:
- для **первого** unfilled background placeholder оставить marker-атрибуты для overlay,
- но для **всех unfilled вхождений этого placeholder**, включая второе, подставлять:
```html
background-image: none; background-color: transparent
```

Это уберёт не только картинку, но и тёмный фон справа.

#### 2) Сделать overlay для banner placeholder визуально “единым пустым блоком”
В блоке рендера overlay для `isBgPlaceholder`:
- заменить почти прозрачный фон на почти сплошной светлый фон, чтобы скрыть текст и остатки старого оформления под ним,
- оставить пунктирную рамку,
- сохранить подпись `header_banner — 600×200` и кнопки по центру всего баннера.

Итогово баннер без изображения будет выглядеть как один пустой placeholder, а не как две разные ячейки.

#### 3) Не ломать сохранение placeholder-маркеров
`restorePlaceholderMarkers()` уже умеет обрабатывать:
```html
background-image: none; background-color: transparent
```
поэтому отдельная правка БД или миграция для этого кейса не нужна.

### Ожидаемый результат
Когда `image_placeholder_1` пустой:
- не видно ни серой левой заглушки,
- не видно тёмной правой плашки,
- весь баннер выглядит как единый светлый пунктирный placeholder.

Когда изображение выбрано:
- пунктир исчезает,
- обе ячейки снова показывают реальный `background-image`.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx`

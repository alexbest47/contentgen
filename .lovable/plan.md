

## Реструктуризация меню блоков + добавление «Карточки»

### Что меняется

Левое меню разбивается на 3 секции:
1. **Готовые блоки** — «Курсы на которые идёт набор», «Подборка бесплатных курсов»
2. **Добавить элемент** — «Карточка», «Текстовый блок», «Изображение», «Кнопка CTA» (разделитель убирается)
3. **Генерируемые** — остаётся как есть (кейс/отзыв, возражение — для соответствующих шаблонов)

«Карточка» (`card`) — новый тип блока, представляющий белый контейнер с `border-radius:12px` на цветном фоне из цветовой схемы. Внутри карточки пользователь добавляет дочерние элементы: текст, изображение, CTA.

Для изображений в настройках добавляется возможность загрузить файл или выбрать из библиотеки баннеров.

### Файлы и изменения

**1. `src/components/email-builder/BlockLibrary.tsx`**
- Добавить тип `"card"` в `EmailBlockType`
- Создать 3 массива: `readyBlocks` (programs, courses), `elementBlocks` (card, text, image, cta), убрать divider
- Переименовать секции: «Готовые блоки», «Добавить элемент»
- Добавить `card` в `blockTypeLabels` → «Карточка»
- Добавить иконку `SquareIcon` (или `Square`) из lucide

**2. `src/components/email-builder/BlockCanvas.tsx`**
- Добавить `"card"` в `USER_BLOCK_TYPES`
- В рендере блоков: для `block_type === "card"` отображать белый контейнер с `border-radius:12px` на цветном фоне (`schemeColors[1]`), внутри — рендер дочерних элементов из `config.children` (массив `{type, html?, url?, alt?, text?, color?}`)
- В `buildFullHtml` (EmailBuilder.tsx): генерировать HTML карточки как `<table>` с фоном → белая вложенная таблица

**3. `src/components/email-builder/UserBlockSettings.tsx`**
- Для `block_type === "card"`: панель управления дочерними элементами — кнопки «Добавить текст», «Добавить изображение», «Добавить CTA»; список дочерних элементов с возможностью перемещения/удаления; инлайн-редактирование каждого
- Для дочернего элемента «Изображение»: помимо URL-поля, кнопки «Загрузить» (upload в `offer-images` bucket) и «Из библиотеки» (открывает `BannerPickerDialog`)

**4. `src/components/email-builder/BlockSettingsPanel.tsx`**
- Добавить ветку для `block_type === "card"` → рендерить `UserBlockSettings`

**5. `src/pages/EmailBuilder.tsx`**
- В `buildFullHtml`: добавить обработку `block_type === "card"` — генерировать HTML-таблицу: внешний фон `schemeColors[1]`, внутренняя белая карточка с `border-radius:12px`, `padding:24px 32px`, внутри — HTML дочерних элементов
- Убрать обработку `divider` (опционально оставить для обратной совместимости)

### Структура данных карточки

```ts
// block.config для card:
{
  children: [
    { type: "text", html: "<p>Текст</p>", align: "left" },
    { type: "image", url: "https://...", alt: "desc" },
    { type: "cta", text: "Записаться", url: "https://...", color: "#7B2FBE" }
  ]
}
```

### Технические детали
- Изображения загружаются через существующий `uploadOfferImage` в bucket `offer-images`
- Выбор из библиотеки переиспользует `BannerPickerDialog`
- Цвет фона карточки берётся из `color_schemes.preview_colors[1]`
- Акцентный цвет CTA — из `preview_colors[0]`
- Divider удаляется из меню, но `blockTypeLabels` сохраняется для обратной совместимости


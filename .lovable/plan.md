
Проблема не в `ScrollArea` как таковом: он уже рендерится с `overflow-hidden`. Настоящая причина в том, что `VariantPickerModal` пытается строить модалку как `flex flex-col`, но базовый `DialogContent` в проекте жёстко задан как `grid`. Из-за этого `flex-1` на `ScrollArea` не даёт нужного ограничения по высоте, и контент просто вылезает вниз модалки вместо внутреннего скролла.

Что сделаю:
1. В `src/components/email-builder/VariantPickerModal.tsx` перестрою layout модалки под существующий `grid`-подход:
   - у `DialogContent` задам `overflow-hidden`
   - вместо `flex flex-col` использую `grid-rows-[auto_minmax(0,1fr)]`
2. У `ScrollArea` добавлю `min-h-0`, чтобы он мог ужаться внутри второй строки грида и реально стать прокручиваемой областью.
3. Сохраню текущую сетку карточек и кнопку “Перегенерировать” без изменений.

Итог:
- заголовок останется фиксированным сверху
- список вариантов получит ограниченную высоту внутри модалки
- все 5 лид-магнитов будут доступны через внутреннюю прокрутку

Технически:
```tsx
<DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden grid-rows-[auto_minmax(0,1fr)]">
  ...
  <ScrollArea className="min-h-0 -mx-6 px-6">
```

Файлы:
- `src/components/email-builder/VariantPickerModal.tsx`

Бэкенд и данные не затрагиваются.



## Проблема

`ScrollArea` внутри `DialogContent` с `flex flex-col` и `max-h-[85vh]` не получает ограниченную высоту, потому что у `ScrollArea` нет `overflow-hidden` и нет явного ограничения. Сетка из 5 карточек (3 колонки) создаёт 2 ряда, но второй ряд обрезается без возможности прокрутки.

## Решение

В `VariantPickerModal.tsx`, строка 110 — добавить `overflow-hidden` к `ScrollArea` чтобы flex-контейнер корректно ограничивал высоту и включал прокрутку:

```tsx
<ScrollArea className="flex-1 -mx-6 px-6 overflow-hidden">
```

Одна строка, одно изменение.




## Убрать серую заглушку из левой ячейки баннера

### Проблема
Пунктирная рамка вокруг баннера уже отображается (видно из session replay). Но левая ячейка всё ещё показывает серый фон — потому что в её inline-стиле сохраняется `background-color` из HTML-шаблона. Когда мы заменяем `background-image` на `none`, серый `background-color` становится видимым.

### Решение

**Файл: `src/components/email-builder/BlockCanvas.tsx`**, функция `preprocessHtmlWithPlaceholders`, строка 147:

Для первого unfilled вхождения background-image плейсхолдера — кроме `background-image: none`, также принудительно добавить `background-color: transparent`, чтобы перебить любой серый фон из шаблона:

```
background-image: none; background-color: transparent
```

Это одна строка изменения в строке 147.


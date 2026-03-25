

## Проблема: разные фоновые цвета в экспортированном письме

### Суть
`buildFullHtml()` в `EmailBuilder.tsx` просто конкатенирует header + body + footer. Каждая часть содержит свой внешний `<table width="100%">` с собственным фоном:
- Header: `#F6F6F6`
- Body (AI): `#F0F0F0`  
- Footer: `#F6F6F6`

В Gmail это отображается как три горизонтальные полосы разных оттенков.

### Решение

**Файл: `src/pages/EmailBuilder.tsx`** — функция `buildFullHtml()`

1. **Обернуть всё в единую внешнюю таблицу** с фиксированным фоном `#F6F6F6` (тот же цвет, что в header/footer).

2. **Снять внешнюю обёртку** с `generated_html` перед вставкой — убрать самую верхнюю `<table width="100%" ... style="background:#F0F0F0">` и её `<tr><td>`, оставив только внутреннее содержимое (таблицу шириной 600px).

Конкретно:
- В `buildFullHtml()` добавить функцию `stripOuterWrapper(html)`, которая через regex находит и убирает первый уровень `<table width="100%"...background:...><tr><td...>` ... `</td></tr></table>` если внутренний контент — это таблица с `width="600"`.
- Обернуть финальный результат в:
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F6F6;">
  <tr><td align="center">
    {header_inner}
    {body_inner}
    {footer_inner}
  </td></tr>
</table>
```

Альтернативный (более простой и надёжный) подход:
- Не трогать структуру header/footer/body.
- Просто заменить в `generated_html` фон внешней обёртки с `#F0F0F0` на `#F6F6F6` перед конкатенацией.

### Рекомендация

Второй подход проще и безопаснее — одна замена цвета:

```ts
// В buildFullHtml(), после формирования letterBody:
letterBody = letterBody.replace(
  /background:\s*#F0F0F0/gi,
  "background-color:#F6F6F6"
);
```

Но это хрупко — AI может сгенерировать другой цвет в следующий раз.

### Надёжный подход

Лучше всего — обязать AI не генерировать внешнюю обёртку, а добавлять её самим в `buildFullHtml()`. Но это требует изменения промпта.

Компромисс для кода: в `buildFullHtml()` **заменять фон самой внешней таблицы** в `letterBody` на фон из header (`#F6F6F6`), используя regex только для первого `<table`:

```ts
letterBody = letterBody.replace(
  /^(<table[^>]*style\s*=\s*["'][^"']*?)background(?:-color)?:\s*#[0-9A-Fa-f]{3,6}/,
  "$1background-color:#F6F6F6"
);
```

### Файлы
- `src/pages/EmailBuilder.tsx` — единственное изменение в `buildFullHtml()`




## Баннер подставляется не тот + пропадают кнопки

### Корневая причина

Найден баг в функции `restorePlaceholderMarkers` (BlockCanvas.tsx, строки 88-91):

```js
// Second pass: untagged elements (second occurrence without data-placeholder-id)
result = result.replace(
  /background-image:\s*none;\s*background-color:\s*transparent/g,
  `background-image: url({{${ph.id}}})`
);
```

Этот код перебирает плейсхолдеры в цикле и **заменяет ВСЕ оставшиеся `background-image: none`** на ID текущего плейсхолдера. Когда первый плейсхолдер (`image_placeholder_1`) обрабатывается первым, он «забирает себе» все незаполненные `none`-записи, включая ту, которая принадлежит `image_placeholder_2`.

**Последовательность бага:**
1. Пользователь генерирует изображение для placeholder_1 (шапка) — URL подставляется
2. Placeholder_2 (баннер программы) ещё без изображения → в HTML: `background-image: none`
3. Пользователь редактирует текст → срабатывает `restorePlaceholderMarkers`
4. Цикл по placeholder_1: строка 88 заменяет ВСЕ `background-image: none` на `{{image_placeholder_1}}` — включая позицию placeholder_2
5. `generatedHtml` теперь содержит `{{image_placeholder_1}}` вместо `{{image_placeholder_2}}` в позиции программного баннера
6. Когда placeholder_2 получает своё изображение, маркер `{{image_placeholder_2}}` уже отсутствует в HTML → подставляется URL placeholder_1

Это же объясняет пропажу кнопок: маркер `{{image_placeholder_2}}` больше не существует в HTML, поэтому `bgRegex` в `preprocessHtmlWithPlaceholders` не находит его и не добавляет `data-placeholder-id` для позиционирования кнопок.

### Решение

**`src/components/email-builder/BlockCanvas.tsx`** — два изменения:

1. **Preprocessor (строка 154)**: для повторных (non-first) незаполненных вхождений — не заменять маркер. Оставить оригинальный `{{id}}` в CSS. Браузер покажет пустой фон (невалидный URL), что визуально идентично `none`.

```js
// Было (строка 154):
return `${tagStart}${styleBefore}background-image: none; background-color: transparent${styleAfter}`;

// Стало:
return _match; // оставляем {{id}} — браузер покажет пустой фон
```

2. **restorePlaceholderMarkers (строки 88-91)**: удалить «второй проход» полностью. Он больше не нужен, поскольку повторные незаполненные вхождения сохраняют свои оригинальные маркеры.

```js
// Удалить строки 88-91:
result = result.replace(
  /background-image:\s*none;\s*background-color:\s*transparent/g,
  `background-image: url({{${ph.id}}})`
);
```

Один файл, два точечных изменения. Корректность для заполненных плейсхолдеров не затрагивается — их URL-подстановка работает через строки 72-77.


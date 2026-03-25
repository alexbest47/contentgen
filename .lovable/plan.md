

## Исправить восстановление плейсхолдеров для background-image баннеров

### Причина проблемы

Данные в базе уже повреждены. Функция `restorePlaceholderMarkers` не смогла восстановить `{{image_placeholder_1}}` при сохранении, потому что:

1. **Строка 81**: regex ищет `background-color: #e5e7eb`, но код теперь пишет `background-color: transparent` — не совпадает.
2. **Строка 87**: regex `background-image:\s*none([^;])` использует `([^;])` — символ ПОСЛЕ `none` не может быть `;`. Но реальный HTML содержит `background-image: none; background-color: transparent`, где после `none` идёт `;`. Regex не срабатывает.

В результате `onBlur` сохраняет в БД `background-image: none; background-color: transparent` вместо `background-image: url({{image_placeholder_1}})`. При следующей загрузке маркер потерян, `preprocessHtmlWithPlaceholders` не находит `{{image_placeholder_1}}` — нет data-атрибутов, нет оверлея. Серый фон остаётся.

### Решение

**Файл: `src/components/email-builder/BlockCanvas.tsx`**

**1. `restorePlaceholderMarkers`** — исправить оба regex:

- **Строка 81**: добавить альтернативу для `transparent`:
  ```
  background-image:\s*none;\s*background-color:\s*(?:#e5e7eb|transparent)
  ```

- **Строка 86-87**: изменить `([^;])` на `(;|\s|")` или полностью переписать regex для надёжного захвата — учесть, что после `none` может идти `;`:
  ```
  background-image:\s*none;\s*background-color:\s*transparent
  ```
  Убрать ненадёжный regex со строки 86 и объединить логику со строкой 81.

**2. Также для второго вхождения (строка 152)** — `background-image: none` без `background-color: transparent`. Regex строки 86-87 пытался это ловить, но `([^;])` ломается. Нужен regex, который ловит `background-image: none` в конце стиля (перед `"` или `'`) или перед `;`.

**Итого:** одно надёжное правило в `restorePlaceholderMarkers`:
```
background-image:\s*none(?:;\s*background-color:\s*transparent)?
→ background-image: url({{id}})
```
Это покроет оба вхождения (с `transparent` и без).

**3. Исправить данные в текущем письме** — нужна SQL-миграция или ручное обновление `generated_html` для письма `f9e1bfa6-...`, чтобы заменить `background-image: none; background-color: transparent` обратно на `background-image: url({{image_placeholder_1}})`. Альтернативно — можно перегенерировать письмо.

### Файлы
- `src/components/email-builder/BlockCanvas.tsx` — `restorePlaceholderMarkers`, ~3 строки изменений


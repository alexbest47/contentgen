

## Показывать индикатор загрузки вместо пустого состояния при генерации письма

### Суть проблемы
При нажатии «Сгенерировать письмо» система очищает блоки и `generatedHtml`, после чего на канвасе появляется пустое сообщение «Добавьте блоки из библиотеки слева…» — это бессмысленно и сбивает с толку, ведь генерация идёт в фоне.

### Решение

**`src/components/email-builder/BlockCanvas.tsx`**

Добавить проп `generatingLetter?: boolean`. Если `generatingLetter && !isFullLetterMode && visibleBlocks.length === 0` — показать спиннер с текстом «Генерация письма…» вместо пустого состояния.

```text
До:  "Добавьте блоки из библиотеки слева или сгенерируйте письмо целиком"
После (при generatingLetter=true):  [Spinner] "Генерация письма…"
```

**`src/pages/EmailBuilder.tsx`**

Передать `generatingLetter={generatingLetter}` в `<BlockCanvas>`.


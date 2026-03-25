

## Баг: автосохранение затирает сгенерированный HTML во время генерации

### Корневая причина

Edge-функция **успешно сохраняет** HTML в БД (подтверждено логами). Но фронтенд **перезаписывает** его пустым значением.

Последовательность:
1. Пользователь нажимает «Сгенерировать» — `generatedHtml` в React-стейте пуст
2. Генерация идёт ~2 минуты, `dirtyRef.current` = true (от предыдущих правок)
3. 30-секундный автосейв срабатывает, вызывает `save()`
4. Защита в `save()` проверяет `letter?.status !== "ready"` — но `letter` в замыкании **устаревший** (он не в deps useCallback), статус ещё не "ready" → защита пропускает
5. `save()` записывает `generated_html: ""` в БД
6. Edge-функция завершается, записывает HTML в БД → ОК
7. Но poll обнаруживает завершение → `dirtyRef = false` → invalidate query → гидрация подгружает HTML
8. **Однако** следующий автосейв или unmount-сейв может снова затереть, если dirty успеет стать true

Ключевая ошибка: `save()` не знает, что **прямо сейчас идёт генерация**, и перезаписывает `generated_html` пустым значением.

### Решение

Добавить `generatingLetterRef` (ref для `generatingLetter`) и блокировать запись `generated_html`/`image_placeholders` во время активной генерации.

### Изменения в `src/pages/EmailBuilder.tsx`

1. **Добавить ref для флага генерации** (рядом с другими refs, ~строка 86):
   ```ts
   const generatingLetterRef = useRef(false);
   useEffect(() => { generatingLetterRef.current = generatingLetter; }, [generatingLetter]);
   ```

2. **Обновить защиту в `save()`** (строка 250-254):
   ```ts
   // Safeguard: don't overwrite generated content during active generation or with empty state
   if (!generatingLetterRef.current) {
     if (generatedHtmlRef.current || letter?.status !== "ready") {
       updatePayload.generated_html = generatedHtmlRef.current;
       updatePayload.image_placeholders = imagePlaceholdersRef.current;
     }
   }
   ```

Когда `generatingLetterRef.current === true`, save() по-прежнему сохраняет метаданные (title, subject и т.д.), но **не трогает** `generated_html` и `image_placeholders`. После завершения генерации флаг сбрасывается, гидрация заполняет стейт, и следующий save запишет корректные данные.


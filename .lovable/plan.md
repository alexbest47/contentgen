

## Обнуление письма при повторной генерации

### Что нужно сделать

При нажатии «Сгенерировать письмо» — перед постановкой задачи в очередь очистить все данные предыдущей генерации, сохраняя только настройки из Wizard.

### Изменения

**Файл: `src/pages/EmailBuilder.tsx`** — функция `generateLetter()`

После сохранения настроек (строки 409–421) и **перед** `enqueue()` добавить:

1. **Удалить все блоки письма из БД**:
   ```ts
   await supabase.from("email_letter_blocks").delete().eq("letter_id", letterId);
   ```

2. **Очистить generated_html и image_placeholders в БД**:
   ```ts
   await supabase.from("email_letters").update({
     generated_html: "",
     image_placeholders: [],
     status: "draft",
   }).eq("id", letterId);
   ```

3. **Очистить локальный state**:
   ```ts
   setBlocks([]);
   setGeneratedHtml("");
   setImagePlaceholders([]);
   ```

### Порядок в `generateLetter()`

```
1. Сохранить настройки в БД (уже есть)
2. ★ Удалить блоки из email_letter_blocks
3. ★ Обнулить generated_html / image_placeholders / status в email_letters
4. ★ Очистить локальный state (blocks, html, placeholders)
5. Поставить задачу в очередь (уже есть)
6. Поллинг результата (уже есть)
```

### Что НЕ меняем

- Edge-функция `generate-email-letter` — она и так перезаписывает поля, дополнительных изменений не нужно.
- Wizard и настройки — они сохраняются на шаге 1, до очистки.
- Логику поллинга и гидрации после генерации.

### Файлы
- `src/pages/EmailBuilder.tsx` — единственный файл


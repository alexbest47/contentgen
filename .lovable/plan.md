

## Проблема

Изображения генерируются успешно (edge-функция возвращает URL), но **не отображаются** в письме. В БД `image_url` остаётся пустым.

**Причина — race condition между генерацией и автосохранением:**

1. Пользователь нажимает «Сгенерировать» → `generatePlaceholderImage` стартует
2. Edge-функция работает ~30-60 сек
3. За это время **автосохранение** (каждые 30 сек) записывает в БД `image_placeholders` из текущего state — **где URL ещё пустые**
4. Edge-функция возвращает URL → `setImagePlaceholders(newPlaceholders)` обновляет state → прямой DB update записывает URL ✓
5. Но `setImagePlaceholders` триггерит `useEffect` (строка 163-168), который ставит `dirtyRef.current = true`
6. При следующем тике `save()` в `useEffect(() => () => { save(); }, [save])` (строка 214) **перезаписывает** `save` и может сработать с промежуточным состоянием
7. Кроме того, `generatePlaceholderImage` использует `imagePlaceholders` из **замкнутого scope** (строка 378) — если за время ожидания были другие обновления state, они теряются

## Решение

### `src/pages/EmailBuilder.tsx`

**1. Добавить `useRef` для imagePlaceholders** — чтобы autosave и генерация всегда читали актуальное значение:

```ts
const imagePlaceholdersRef = useRef(imagePlaceholders);
useEffect(() => { imagePlaceholdersRef.current = imagePlaceholders; }, [imagePlaceholders]);
```

**2. В `save()` использовать ref вместо closure-переменной:**
```ts
image_placeholders: imagePlaceholdersRef.current,
```

**3. В `generatePlaceholderImage` использовать функциональное обновление state:**
```ts
setImagePlaceholders(prev => {
  const updated = prev.map(p =>
    p.id === placeholderId ? { ...p, image_url: data.image_url } : p
  );
  // Save to DB inline
  supabase.from("email_letters").update({
    image_placeholders: updated,
  } as any).eq("id", letterId);
  return updated;
});
```

**4. Аналогично для `uploadPlaceholderImage`** — тот же паттерн с `prev =>`.

**5. Для `generatedHtml` добавить аналогичный ref** — та же проблема может возникать при редактировании текста + автосохранении:
```ts
const generatedHtmlRef = useRef(generatedHtml);
useEffect(() => { generatedHtmlRef.current = generatedHtml; }, [generatedHtml]);
```
И в `save()`: `generated_html: generatedHtmlRef.current`.

## Объём

1 файл (`EmailBuilder.tsx`), ~20 строк правок. Логика edge-функций и `BlockCanvas` не меняется.


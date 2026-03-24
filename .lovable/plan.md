

## Проблема: автосохранение перезаписывает обновлённые изображения

### Причина

1. Edge-функция генерирует изображение и обновляет `image_placeholders` в БД (записывает `image_url`)
2. Но фронтенд держит в локальном state старый массив `imagePlaceholders` с пустым `image_url`
3. Автосохранение (каждые 30с) или сохранение при unmount вызывает `save()`, которая записывает `imagePlaceholdersRef.current` (пустые URL) обратно в БД (строка 228)
4. Edge-функция обновила БД → автосохранение перезаписало → данные потеряны

### Решение

**Файл:** `src/pages/EmailBuilder.tsx`

1. **После enqueue задачи генерации изображения** — запустить polling, который проверяет статус задачи в `task_queue`. Когда задача завершена (`status: completed`), прочитать `result.image_url` и обновить локальный state `imagePlaceholders` с новым URL.

2. Это проще и надежнее реализовать через **refetch letter data** из БД после завершения задачи. Добавить в `generatePlaceholderImage` логику:
   - После `enqueue` — запустить `setInterval` polling `task_queue` по ID задачи
   - Когда `status === "completed"` — вызвать `queryClient.invalidateQueries(["email_letter", letterId])` для рефетча данных письма из БД
   - При рефетче данных — обновить `imagePlaceholders` из свежих данных БД (уже обновлённых edge-функцией)

3. **Но есть проблема**: гидрация letter data (строки 155-181) использует `initialLoadRef` и не обновляет `imagePlaceholders` после первой загрузки. Нужно добавить отдельный `useEffect`, который обновляет `imagePlaceholders` из `letter.image_placeholders` когда в БД появляются новые `image_url`, которых нет в локальном state.

**Упрощённый подход** (минимум изменений):

В блоке гидрации letter data (строки 155-181) — добавить логику, которая при рефетче `letter` синхронизирует `image_url` из БД в локальный state, даже после первой загрузки:

```typescript
// After initial hydration, keep image URLs in sync from DB
useEffect(() => {
  if (!letter?.image_placeholders || !initialLoadRef.current) return;
  const dbPlaceholders = letter.image_placeholders as ImagePlaceholder[];
  setImagePlaceholders(prev => {
    let changed = false;
    const merged = prev.map(p => {
      const dbP = dbPlaceholders.find((d: any) => d.id === p.id);
      if (dbP?.image_url && !p.image_url) {
        changed = true;
        return { ...p, image_url: dbP.image_url };
      }
      return p;
    });
    return changed ? merged : prev;
  });
}, [letter]);
```

Плюс — добавить polling в `generatePlaceholderImage` для invalidation query после завершения задачи.

### Файлы
- `src/pages/EmailBuilder.tsx` — добавить sync effect + polling после enqueue


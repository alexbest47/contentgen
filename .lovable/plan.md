

## Добавить выбор тегов в диалог создания программы

### Изменения

**`src/pages/ManagePrograms.tsx`**

1. Добавить запрос `allTags` — `useQuery` на `tags` (аналогично `ManageProgramDetail.tsx`)
2. Добавить стейт `selectedTagIds: string[]`
3. В форму создания добавить секцию «Теги аудитории» — клик по `Badge` для toggle (как в диалоге редактирования `ManageProgramDetail.tsx`)
4. В `createMutation`: после insert программы — получить id новой записи (`.select().single()`), затем вставить строки в `program_tags`
5. В `onSuccess` — сбросить `selectedTagIds`

### Итого
- 1 файл, ~25 строк добавлено


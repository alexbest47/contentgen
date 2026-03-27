

## Убрать теги из офферов, оставить только для программ

### Суть
Теги аудитории привязаны к платным программам через `program_tags`. Связь тегов с офферами (`offer_tags`) — лишняя. Нужно убрать всё, что связано с тегами в контексте офферов.

### Изменения

**1. `src/pages/Tags.tsx`** — обновить подзаголовок
- Заменить «Управление тегами для офферов» → «Управление тегами аудитории для программ»

**2. `src/pages/OfferTypeManagement.tsx`** — убрать теги из CRUD офферов
- Удалить запрос `tags` из React Query
- Удалить состояния `createSelectedTags`, `editSelectedTags`, `toggleCreateTag`, `toggleEditTag`
- Убрать вставку/удаление `offer_tags` в мутациях create/update
- Убрать блок UI с бейджами тегов в формах create/edit
- В запросе offers убрать `offer_tags(tag_id, tags(id, name))` из select

**3. `src/pages/OfferTypeDetail.tsx`** — убрать отображение тегов
- Убрать `offer_tags(tag_id, tags(id, name))` из select запроса offers
- Убрать блок с бейджами тегов в списке офферов

**4. `src/pages/OfferDetail.tsx`** — убрать отображение тегов
- Убрать `offer_tags(tag_id, tags(name))` из select
- Убрать блок бейджей тегов в заголовке

**5. `src/pages/Archive.tsx`** — убрать теги из архива
- Убрать `offer_tags(tag_id, tags(id, name))` из select
- Убрать удаление `offer_tags` при удалении оффера (каскад в БД сделает это)
- Убрать отображение бейджей тегов

**6. `src/pages/CreateDiagnostic.tsx`** — убрать теги
- Удалить запрос `tags`, состояние `selectedTags`, `toggleTag`
- Убрать передачу `tagNames` в `audience_tags` при создании диагностики
- Убрать UI блок выбора тегов

**7. `src/pages/PromptVariables.tsx`** — убрать переменную `{{offer_tags}}`
- Удалить строку с описанием `{{offer_tags}}` из таблицы переменных

### Что НЕ трогаем
- Таблицу `offer_tags` в БД — она останется, но не будет использоваться (безопаснее не удалять)
- `program_tags` — продолжают работать как раньше
- Страницу Tags.tsx — остаётся для управления тегами (используются программами)


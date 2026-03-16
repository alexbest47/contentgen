

## Скрыть «Пост с изображением» для list_content

### Проблема
В `SocialView` всегда отображаются две карточки: «Пост с каруселью» и «Пост с изображением». Для `list_content` вторая карточка не нужна — генерируется только карусель.

### Решение — 2 файла

**1. `src/pages/ContentDetail.tsx`**
- Передать `projectContentType={project?.content_type}` в `PipelineResultView`.

**2. `src/components/project/PipelineResultView.tsx`**
- Добавить `projectContentType?: string` в `Props`.
- Прокинуть его в `SocialView`.
- В `SocialView` (строки 462–496): обернуть блок «Single Image Post Card» в условие:
```typescript
{projectContentType !== "list_content" && (
  <PostCard title="Пост с изображением" ... />
)}
```
- Для `list_content` с `hasSplitTexts`: использовать единый текст (carousel text) без разделения, так как single-image поста нет.




## Исправление кнопок для типа «Список»

### Проблема
`list_content` добавлен в массив типов без карусели, поэтому кнопка карусели скрыта, а кнопка статичного изображения показана. Нужно наоборот: карусель — да, статичное изображение — нет.

### Решение — 1 файл: `src/pages/ContentDetail.tsx`

1. **Строка 48** — убрать `list_content` из массива `supportsCarousel`:
```typescript
const supportsCarousel = !["expert_content", "provocative_content"].includes(project?.content_type ?? "");
```

2. **Добавить флаг `supportsStaticImage`** — скрывать кнопку «Сгенерировать изображение» для `list_content`:
```typescript
const supportsStaticImage = !["list_content"].includes(project?.content_type ?? "");
```

3. **Строки 265–278** — обернуть кнопку «Сгенерировать изображение» в `{supportsStaticImage && (...)}`.




## Исправление: крестик закрытия не виден в лайтбоксе баннера

Крестик (X) рендерится компонентом `DialogContent` из `dialog.tsx`, но на тёмном фоне (`bg-black/95`) он чёрный и не виден.

### Решение

**Файл: `src/pages/BannerLibrary.tsx`, строка 201**

Добавить класс `[&>button]:text-white` к `DialogContent`, чтобы кнопка закрытия стала белой на тёмном фоне:

```tsx
<DialogContent className="max-w-4xl p-2 bg-black/95 border-none [&>button]:text-white">
```

Одна строка, один файл.


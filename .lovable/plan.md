

## Перенести «Платные программы» в раздел «Администрирование»

Одно изменение в `src/components/AppSidebar.tsx`:

- Убрать `{ title: "Платные программы", url: "/manage-programs", icon: GraduationCap }` из массива `contentPrepNav`
- Добавить эту же запись в массив `adminNav` (например, первым элементом или после «Архив»)


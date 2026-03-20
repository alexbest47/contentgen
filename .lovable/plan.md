

## Переместить «Подготовка PDF» в раздел «Подготовка офферов»

### Изменения

**`src/components/AppSidebar.tsx`**

1. В массиве `offerPrepNav` — заменить строку `{ title: "Скачай PDF", url: "/offers/download_pdf", icon: FileDown }` на `{ title: "Подготовка PDF", url: "/pdf-materials", icon: FilePlus2 }`
2. В массиве `contentPrepNav` — убрать строку `{ title: "Подготовка PDF", url: "/pdf-materials", icon: FilePlus2 }`

### Итого
- 1 файл, 2 строки изменены


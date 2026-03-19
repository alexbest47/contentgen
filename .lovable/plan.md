

## Задача

Убрать кнопку «Работа с возражениями» со страницы программы (`ProgramDetail.tsx`).

## Изменение — 1 файл

**`src/pages/ProgramDetail.tsx`** — удалить блок с кнопкой (строки ~154–158):

```tsx
// Удалить:
<div className="flex flex-wrap gap-3 mb-2">
  <Button variant="outline" onClick={() => navigate(`/programs/${programId}/objections`)}>
    <ShieldQuestion className="h-4 w-4 mr-2" />Работа с возражениями
  </Button>
</div>
```

Также убрать неиспользуемый импорт `ShieldQuestion` из lucide-react.


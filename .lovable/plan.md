

## Добавить удаление диагностик

### Изменения в `src/pages/Diagnostics.tsx`

1. Добавить кнопку удаления (иконка `Trash2`) рядом с кнопкой «Редактировать/Открыть» в каждой строке таблицы
2. Добавить `AlertDialog` для подтверждения удаления
3. Добавить состояние `deletingId` и мутацию `useMutation` для удаления записи из `diagnostics` + инвалидация `["diagnostics"]`
4. Импортировать `Trash2` из lucide-react, `AlertDialog*` компоненты, `useQueryClient`, `toast` из sonner

Кнопка удаления будет красной (variant `ghost` + `text-destructive`). При клике — диалог подтверждения. RLS-политика `Owner or admin can delete diagnostics` уже существует.


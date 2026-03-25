

## Добавить пагинацию на страницу очереди задач

### Что будет сделано
Клиентская пагинация по 20 записей на странице с навигацией внизу таблицы.

### Изменения в `src/pages/TaskQueue.tsx`

1. Добавить state `page` (сбрасывается при смене фильтра).
2. Вычислять `totalPages` и `paginatedTasks` из массива `tasks` (по 20 на страницу).
3. Отображать в таблице только `paginatedTasks`.
4. Добавить под таблицей компонент `Pagination` из `@/components/ui/pagination` с кнопками Previous/Next и номерами страниц.
5. Импортировать `Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis`.


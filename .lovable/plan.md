

## План: Удаление проектов

### Изменения в `src/pages/CourseDetail.tsx`

1. Добавить кнопку удаления (иконка `Trash2`) в каждую строку списка проектов — по клику открывается `AlertDialog` с подтверждением
2. Добавить состояние `deleteId` для отслеживания какой проект удаляется
3. Добавить `deleteMutation`:
   - Удалить связанные `lead_magnets` по `project_id`
   - Удалить связанные `generation_runs` по `project_id`
   - Удалить сам `project`
   - Инвалидировать кэш `["projects", courseId]`
   - Toast "Проект удалён"
4. Кнопка удаления с `e.stopPropagation()` чтобы не срабатывала навигация по строке

### Импорты
- Добавить `Trash2` из `lucide-react`
- Добавить `AlertDialog` компоненты из `@/components/ui/alert-dialog`

Никаких изменений в БД не нужно — RLS-политика `Owner or admin can delete projects` уже есть, а `lead_magnets` и `generation_runs` тоже имеют delete-политики.




## Задача

Добавить возможность редактирования названия тега. Сейчас таблица `tags` не имеет RLS-политики на UPDATE — нужно добавить её и реализовать inline-редактирование в UI.

## Изменения

### 1. Миграция БД — RLS-политика UPDATE для `tags`

```sql
CREATE POLICY "Owner or admin can update tags" ON public.tags
  FOR UPDATE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));
```

### 2. UI — `src/pages/Tags.tsx`

- Добавить состояние `editingId` / `editingName` для отслеживания редактируемого тега
- По клику на название тега — переключать Badge в режим редактирования (inline Input вместо текста)
- Добавить `updateMutation` — вызов `supabase.from("tags").update({ name }).eq("id", id)`
- Сохранение по Enter или blur, отмена по Escape


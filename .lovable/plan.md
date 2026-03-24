

## Исправление race condition в очереди задач

### Проблема

Две задачи в одной линии (`claude`) одновременно в статусе `processing`. Причина — race condition: два параллельных вызова `process-queue` оба выполняют SELECT (processing = 0), затем оба делают UPDATE на разные задачи.

SELECT + UPDATE через Supabase JS — **не атомарная операция**. Между ними проходит время, достаточное для параллельного захвата.

### Решение: атомарный захват через SQL-функцию

Создать PostgreSQL-функцию `claim_next_task(lane)`, которая в одном запросе:
1. Проверяет, что в линии нет задач со статусом `processing`
2. Захватывает следующую `pending` задачу с `FOR UPDATE SKIP LOCKED`
3. Обновляет статус на `processing`
4. Возвращает задачу или NULL

```sql
CREATE FUNCTION claim_next_task(p_lane text)
RETURNS task_queue
LANGUAGE plpgsql
AS $$
DECLARE
  v_task task_queue;
BEGIN
  -- Check if lane already busy
  IF EXISTS (
    SELECT 1 FROM task_queue 
    WHERE lane = p_lane AND status = 'processing'
    FOR UPDATE SKIP LOCKED
  ) THEN
    RETURN NULL;
  END IF;

  -- Claim next pending task atomically
  UPDATE task_queue
  SET status = 'processing', started_at = now()
  WHERE id = (
    SELECT id FROM task_queue
    WHERE lane = p_lane AND status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$;
```

### Изменения

#### 1. Миграция — создать функцию `claim_next_task`

Одна SQL-функция, как описано выше.

#### 2. `process-queue/index.ts` — заменить `processLane`

Вместо SELECT + UPDATE через JS-клиент — один вызов `supabase.rpc('claim_next_task', { p_lane: lane })`. Если вернул NULL — линия занята или пустая. Если вернул задачу — dispatch fire-and-forget.

Это ~15 строк замены в `processLane`.

### Итого
- 1 миграция (SQL-функция)
- 1 файл изменён (`process-queue/index.ts`)


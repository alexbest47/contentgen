

## Две задачи в одной линии — гонка в `claim_next_task`

### Корневая причина

SQL-функция `claim_next_task` (строка 14):

```sql
IF EXISTS (
  SELECT 1 FROM task_queue 
  WHERE lane = p_lane AND status = 'processing'
  FOR UPDATE SKIP LOCKED  -- ← проблема
) THEN RETURN; END IF;
```

`SKIP LOCKED` означает: «если строка заблокирована другой транзакцией — пропусти её». Когда два `process-queue` вызываются одновременно:

1. Транзакция A блокирует processing-строку → видит занятость → НО ещё не завершилась
2. Транзакция B тоже проверяет → `SKIP LOCKED` пропускает заблокированную строку → считает линию свободной → захватывает новую задачу

Результат: две задачи в статусе `processing` в одной линии.

### Решение

Убрать `FOR UPDATE SKIP LOCKED` из проверки EXISTS. Простой `SELECT` без блокировки достаточен — нам не нужно изменять эту строку, только проверить её существование:

```sql
IF EXISTS (
  SELECT 1 FROM task_queue 
  WHERE lane = p_lane AND status = 'processing'
) THEN
  RETURN;
END IF;
```

Без `SKIP LOCKED` обе транзакции увидят processing-строку и корректно вернут пустой результат.

### Изменение

Одна SQL-миграция: `CREATE OR REPLACE FUNCTION claim_next_task` с удалённым `FOR UPDATE SKIP LOCKED` из блока EXISTS.


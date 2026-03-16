

## Проблема: классификация заблокирована

19 файлов застряли в статусе `classifying` — это файлы, которые были обработаны старым кодом `deepgram-callback` (до нашего исправления). Новый `classify-case` видит их и каждый раз говорит "Another classification active, skipping" — дедлок.

### Решение

**1. Исправить `classify-case/index.ts`** — два изменения:

- **Очередь по file_id**: Вместо проверки "есть ли ЛЮБОЙ файл в `classifying`", проверять "есть ли ДРУГОЙ файл (не текущий) в `classifying`". Если текущий файл уже в `classifying` — это нормально, продолжаем.
- **Проверка транскрипта до смены статуса**: Сначала получить файл и проверить `transcript_text`, и только потом ставить `classifying`.

Порядок операций:
```
1. Получить файл из БД
2. Проверить transcript_text → если нет, error + chain
3. Проверить, есть ли ДРУГОЙ файл в classifying → если да, skip
4. Поставить текущему файлу classifying
5. Классифицировать
6. Chain к следующему transcribed
```

**2. Сбросить застрявшие файлы** — миграция:

```sql
UPDATE case_files 
SET status = 'transcribed', status_updated_at = now() 
WHERE status = 'classifying' 
AND transcript_text IS NOT NULL;

UPDATE case_files 
SET status = 'error', error_message = 'No transcript', status_updated_at = now() 
WHERE status = 'classifying' 
AND transcript_text IS NULL;
```

После сброса и деплоя нового кода — вызвать classify-case для первого `transcribed` файла, чтобы запустить цепочку.

### Файлы
- `supabase/functions/classify-case/index.ts`
- Миграция для сброса застрявших файлов


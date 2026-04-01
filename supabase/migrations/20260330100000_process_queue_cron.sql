-- pg_cron watchdog для process-queue
-- Запускает process-queue каждую минуту если есть pending или processing задачи
-- Это предотвращает зависание задач в случае разрыва self-chain цепочки
--
-- ТРЕБОВАНИЕ: перед запуском этой миграции установить настройки БД:
-- ALTER DATABASE postgres SET app.supabase_url = 'https://szlvnesyoydwvtqieazo.supabase.co';
-- ALTER DATABASE postgres SET app.supabase_anon_key = '<VITE_SUPABASE_PUBLISHABLE_KEY из .env>';
--
-- Проверить текущие настройки:
-- SELECT current_setting('app.supabase_url', true), current_setting('app.supabase_anon_key', true);

-- Удаляем задание если уже существует (idempotent)
SELECT cron.unschedule('process-queue-watchdog')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-queue-watchdog'
);

-- Создаём pg_cron задание: каждую минуту проверяем наличие pending/processing задач
-- и если есть — вызываем process-queue через pg_net
SELECT cron.schedule(
  'process-queue-watchdog',
  '* * * * *',
  $$
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.task_queue
        WHERE status IN ('pending', 'processing')
        LIMIT 1
      )
      THEN extensions.http_post(
        url := current_setting('app.supabase_url', true) || '/functions/v1/process-queue',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := '{"trigger":true}'::jsonb
      )
    END;
  $$
);

-- Make gateway the default form type for new landings
ALTER TABLE public.landings
  ALTER COLUMN form_type SET DEFAULT 'gateway';

-- Backfill records that still have the old implicit default and no GetCourse config
UPDATE public.landings
SET form_type = 'gateway'
WHERE form_type = 'getcourse'
  AND COALESCE(NULLIF(getcourse_widget_id, ''), NULL) IS NULL
  AND COALESCE(NULLIF(getcourse_action_id, ''), NULL) IS NULL;

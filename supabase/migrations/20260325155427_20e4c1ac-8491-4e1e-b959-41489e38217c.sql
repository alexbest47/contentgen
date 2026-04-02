CREATE OR REPLACE FUNCTION public.claim_next_task(p_lane text)
 RETURNS SETOF task_queue
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task task_queue;
BEGIN
  -- Check if lane already busy (no SKIP LOCKED — must see all processing rows)
  IF EXISTS (
    SELECT 1 FROM task_queue 
    WHERE lane = p_lane AND status = 'processing'
  ) THEN
    RETURN;
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

  IF v_task.id IS NOT NULL THEN
    RETURN NEXT v_task;
  END IF;
  RETURN;
END;
$function$;
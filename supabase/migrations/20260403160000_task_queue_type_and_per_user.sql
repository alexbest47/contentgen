-- Add task_type column to task_queue
ALTER TABLE public.task_queue
  ADD COLUMN task_type text NOT NULL DEFAULT 'content'
  CHECK (task_type IN ('landing', 'letter', 'content'));

-- Update RLS: users see only their own tasks (admins see all)
DROP POLICY IF EXISTS "Authenticated can view task_queue" ON public.task_queue;
CREATE POLICY "Users see own tasks, admins see all"
  ON public.task_queue FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Replace claim_next_task to support concurrent slots per lane
CREATE OR REPLACE FUNCTION public.claim_next_task(p_lane text, p_max_concurrent integer DEFAULT 1)
 RETURNS SETOF task_queue
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_active integer;
  v_task task_queue;
BEGIN
  -- Count currently processing tasks in this lane
  SELECT count(*) INTO v_active
  FROM task_queue
  WHERE lane = p_lane AND status = 'processing';

  -- If lane is at capacity, return empty
  IF v_active >= p_max_concurrent THEN
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

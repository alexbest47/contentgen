
CREATE TABLE public.task_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  lane text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  function_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  result jsonb,
  error_message text,
  display_title text NOT NULL DEFAULT '',
  priority integer NOT NULL DEFAULT 0
);

ALTER TABLE public.task_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view task_queue"
  ON public.task_queue FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert own tasks"
  ON public.task_queue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update task_queue"
  ON public.task_queue FOR UPDATE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin can delete task_queue"
  ON public.task_queue FOR DELETE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_queue;

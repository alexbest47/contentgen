CREATE TABLE public.program_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.paid_programs(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE (program_id, tag_id)
);

ALTER TABLE public.program_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view program_tags" ON public.program_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner or admin can insert program_tags" ON public.program_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM paid_programs WHERE id = program_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owner or admin can delete program_tags" ON public.program_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM paid_programs WHERE id = program_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );
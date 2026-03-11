
CREATE TABLE public.content_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  content text NOT NULL DEFAULT '',
  generation_run_id uuid REFERENCES public.generation_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view content_pieces" ON public.content_pieces
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Can insert content for own projects" ON public.content_pieces
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = content_pieces.project_id AND projects.created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Can update content for own projects" ON public.content_pieces
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = content_pieces.project_id AND projects.created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Can delete content for own projects" ON public.content_pieces
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = content_pieces.project_id AND projects.created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

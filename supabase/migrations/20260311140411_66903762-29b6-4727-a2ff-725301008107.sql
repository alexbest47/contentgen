
-- Fix lead_magnets RLS: scope to project owner
DROP POLICY "Authenticated can insert lead_magnets" ON public.lead_magnets;
DROP POLICY "Owner or admin can update lead_magnets" ON public.lead_magnets;
DROP POLICY "Owner or admin can delete lead_magnets" ON public.lead_magnets;

CREATE POLICY "Can insert lead_magnets for own projects" ON public.lead_magnets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.created_by = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Can update lead_magnets for own projects" ON public.lead_magnets
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.created_by = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Can delete lead_magnets for own projects" ON public.lead_magnets
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.created_by = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

-- Fix generation_runs RLS
DROP POLICY "Authenticated can insert runs" ON public.generation_runs;
DROP POLICY "Authenticated can update runs" ON public.generation_runs;

CREATE POLICY "Can insert runs for own projects" ON public.generation_runs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.created_by = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Can update runs for own projects" ON public.generation_runs
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.created_by = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

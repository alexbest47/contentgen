
-- 1a. New enum value
ALTER TYPE public.prompt_category ADD VALUE 'objection_handling';

-- 1b. Objections table
CREATE TABLE public.objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.paid_programs(id) ON DELETE CASCADE,
  objection_text text NOT NULL,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.objections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view objections" ON public.objections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert objections" ON public.objections FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update objections" ON public.objections FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete objections" ON public.objections FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- 1c. New column in projects
ALTER TABLE public.projects ADD COLUMN selected_objection_id uuid REFERENCES public.objections(id);


CREATE TABLE public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  offer_id uuid,
  name text NOT NULL,
  description text,
  audience_tags text[] DEFAULT '{}',
  prompt_id uuid,
  quiz_json jsonb,
  status text NOT NULL DEFAULT 'generating',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view diagnostics" ON public.diagnostics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner can insert diagnostics" ON public.diagnostics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update diagnostics" ON public.diagnostics
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete diagnostics" ON public.diagnostics
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-images', 'quiz-images', true);

CREATE POLICY "Anyone can read quiz-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');

CREATE POLICY "Authenticated can upload quiz-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quiz-images');

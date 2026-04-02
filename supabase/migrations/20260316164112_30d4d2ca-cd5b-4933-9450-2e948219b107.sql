
CREATE TABLE public.case_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.case_jobs(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  source_url text,
  classification_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view case_classifications"
  ON public.case_classifications FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can insert case_classifications"
  ON public.case_classifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update case_classifications"
  ON public.case_classifications FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete case_classifications"
  ON public.case_classifications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

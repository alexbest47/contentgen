
-- Case jobs table
CREATE TABLE public.case_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view case_jobs" ON public.case_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert case_jobs" ON public.case_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update case_jobs" ON public.case_jobs FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete case_jobs" ON public.case_jobs FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

-- Case files table
CREATE TABLE public.case_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.case_jobs(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  transcript_text text,
  transcript_json jsonb,
  download_url text,
  resource_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, resource_id)
);

ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view case_files" ON public.case_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or admin can insert case_files" ON public.case_files FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.case_jobs WHERE id = case_files.job_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Owner or admin can update case_files" ON public.case_files FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.case_jobs WHERE id = case_files.job_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Owner or admin can delete case_files" ON public.case_files FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.case_jobs WHERE id = case_files.job_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin')
);

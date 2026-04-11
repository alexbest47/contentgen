CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  output_format_hint TEXT,
  model TEXT,
  provider TEXT,
  change_type TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage prompt versions"
  ON public.prompt_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id, version_number DESC);
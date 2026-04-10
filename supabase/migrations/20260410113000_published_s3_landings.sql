-- Published static (s3) landing pages
CREATE TABLE IF NOT EXISTS public.published_s3_landings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.landings(id) ON DELETE CASCADE,
  path text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT published_s3_landings_path_not_empty CHECK (btrim(path) <> ''),
  CONSTRAINT published_s3_landings_path_no_leading_slash CHECK (left(path, 1) <> '/'),
  CONSTRAINT published_s3_landings_path_no_trailing_slash CHECK (right(path, 1) <> '/')
);

COMMENT ON TABLE public.published_s3_landings IS
  'Registry of static landing pages published to external s3 hosting.';

COMMENT ON COLUMN public.published_s3_landings.landing_id IS
  'Source landing from the constructor used to generate the published page.';

COMMENT ON COLUMN public.published_s3_landings.path IS
  'Normalized public path without domain or leading slash, e.g. promo/course.';

CREATE INDEX IF NOT EXISTS idx_published_s3_landings_landing_id
  ON public.published_s3_landings (landing_id);

ALTER TABLE public.published_s3_landings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published_s3_landings"
  ON public.published_s3_landings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owner or admin can insert published_s3_landings"
  ON public.published_s3_landings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.landings
      WHERE id = published_s3_landings.landing_id
        AND created_by = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owner or admin can update published_s3_landings"
  ON public.published_s3_landings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.landings
      WHERE id = published_s3_landings.landing_id
        AND created_by = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owner or admin can delete published_s3_landings"
  ON public.published_s3_landings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.landings
      WHERE id = published_s3_landings.landing_id
        AND created_by = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER update_published_s3_landings_updated_at
  BEFORE UPDATE ON public.published_s3_landings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

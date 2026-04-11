
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  banner_type text NOT NULL,
  category text NOT NULL,
  program_id uuid REFERENCES public.paid_programs(id) ON DELETE SET NULL,
  offer_type text,
  color_scheme_id uuid REFERENCES public.color_schemes(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  source text NOT NULL DEFAULT 'uploaded',
  generation_prompt text,
  note text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view banners"
  ON public.banners FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owner or admin can insert banners"
  ON public.banners FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update banners"
  ON public.banners FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin can delete banners"
  ON public.banners FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));


-- 1. Create offer_type enum
CREATE TYPE public.offer_type AS ENUM (
  'mini_course', 'diagnostic', 'webinar', 'pre_list',
  'new_stream', 'spot_available', 'sale', 'discount', 'download_pdf'
);

-- 2. Create offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.paid_programs(id) ON DELETE CASCADE,
  offer_type public.offer_type NOT NULL,
  title text NOT NULL,
  description text,
  doc_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view offers" ON public.offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update offers" ON public.offers FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner or admin can delete offers" ON public.offers FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Create tags table
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated can delete tags" ON public.tags FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Create offer_tags junction table
CREATE TABLE public.offer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(offer_id, tag_id)
);

ALTER TABLE public.offer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view offer_tags" ON public.offer_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert offer_tags" ON public.offer_tags FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.offers WHERE id = offer_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can delete offer_tags" ON public.offer_tags FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offers WHERE id = offer_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Add offer_id to projects (nullable for backward compat)
ALTER TABLE public.projects ADD COLUMN offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE;
ALTER TABLE public.projects ALTER COLUMN mini_course_id DROP NOT NULL;

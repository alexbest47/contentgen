
-- =============================================
-- Landing Constructor Module
-- Tables: landing_templates, landing_block_definitions,
--         landings, landing_blocks, landing_template_blocks
-- =============================================

-- 1. Landing Templates (admin-only reference table)
CREATE TABLE public.landing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  template_type text NOT NULL,
  description text,
  preview_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view landing_templates" ON public.landing_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage landing_templates" ON public.landing_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_landing_templates_updated_at
  BEFORE UPDATE ON public.landing_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Landing Block Definitions (admin-only library of blocks)
CREATE TABLE public.landing_block_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  thumbnail_url text,
  html_template text NOT NULL DEFAULT '',
  default_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  editable_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_block_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view landing_block_definitions" ON public.landing_block_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage landing_block_definitions" ON public.landing_block_definitions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Landings (user-created landings)
CREATE TABLE public.landings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid REFERENCES public.landing_templates(id),
  program_id uuid REFERENCES public.paid_programs(id),
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view landings" ON public.landings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert landings" ON public.landings FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update landings" ON public.landings FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner or admin can delete landings" ON public.landings FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_landings_updated_at
  BEFORE UPDATE ON public.landings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Landing Blocks (blocks placed on a user's landing)
CREATE TABLE public.landing_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.landings(id) ON DELETE CASCADE,
  block_definition_id uuid NOT NULL REFERENCES public.landing_block_definitions(id),
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_css text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view landing_blocks" ON public.landing_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or admin can insert landing_blocks" ON public.landing_blocks FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.landings WHERE id = landing_blocks.landing_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Owner or admin can update landing_blocks" ON public.landing_blocks FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.landings WHERE id = landing_blocks.landing_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Owner or admin can delete landing_blocks" ON public.landing_blocks FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.landings WHERE id = landing_blocks.landing_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER update_landing_blocks_updated_at
  BEFORE UPDATE ON public.landing_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Landing Template Blocks (predefined block sets for templates)
CREATE TABLE public.landing_template_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.landing_templates(id) ON DELETE CASCADE,
  block_definition_id uuid NOT NULL REFERENCES public.landing_block_definitions(id),
  sort_order integer NOT NULL DEFAULT 0,
  default_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_template_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view landing_template_blocks" ON public.landing_template_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage landing_template_blocks" ON public.landing_template_blocks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast block ordering queries
CREATE INDEX idx_landing_blocks_landing_sort ON public.landing_blocks (landing_id, sort_order);
CREATE INDEX idx_landing_template_blocks_template_sort ON public.landing_template_blocks (template_id, sort_order);

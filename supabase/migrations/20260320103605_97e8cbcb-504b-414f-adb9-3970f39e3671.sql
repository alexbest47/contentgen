
-- Add pdf_generation to prompt_category enum
ALTER TYPE public.prompt_category ADD VALUE IF NOT EXISTS 'pdf_generation';

-- Create pdf_materials table
CREATE TABLE public.pdf_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  title text NOT NULL,
  subtitle text,
  material_type text NOT NULL,
  program_id uuid REFERENCES public.paid_programs(id),
  program_name text,
  audience_name text,
  brand_style_name text,
  html_content text NOT NULL DEFAULT '',
  sections_count integer,
  word_count integer,
  landing_headline text,
  landing_descriptor text,
  landing_button_text text,
  landing_modal_type_word text,
  landing_html text,
  imagen_prompt text,
  background_image_url text,
  landing_slug text UNIQUE,
  status text NOT NULL DEFAULT 'generating'
);

-- Enable RLS
ALTER TABLE public.pdf_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view pdf_materials"
ON public.pdf_materials FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Owner can insert pdf_materials"
ON public.pdf_materials FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update pdf_materials"
ON public.pdf_materials FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin can delete pdf_materials"
ON public.pdf_materials FOR DELETE TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

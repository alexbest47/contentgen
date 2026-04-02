
-- Table: email_chain_templates
CREATE TABLE public.email_chain_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  letter_count integer NOT NULL DEFAULT 0,
  letters_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_chain_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email_chain_templates" ON public.email_chain_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage email_chain_templates" ON public.email_chain_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Table: email_chains
CREATE TABLE public.email_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  template_id uuid REFERENCES public.email_chain_templates(id),
  status text NOT NULL DEFAULT 'generating',
  webinar_offer_id uuid REFERENCES public.offers(id),
  program_id uuid REFERENCES public.paid_programs(id),
  selected_color_scheme_id uuid REFERENCES public.color_schemes(id),
  image_style_id uuid REFERENCES public.image_styles(id),
  pdf_material_id uuid REFERENCES public.pdf_materials(id),
  case_id uuid REFERENCES public.case_classifications(id),
  mini_course_offer_id uuid REFERENCES public.offers(id),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email_chains" ON public.email_chains FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert email_chains" ON public.email_chains FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update email_chains" ON public.email_chains FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner or admin can delete email_chains" ON public.email_chains FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Table: email_chain_letters
CREATE TABLE public.email_chain_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES public.email_chains(id) ON DELETE CASCADE,
  letter_id uuid NOT NULL REFERENCES public.email_letters(id) ON DELETE CASCADE,
  letter_number integer NOT NULL DEFAULT 0,
  group_name text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_chain_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email_chain_letters" ON public.email_chain_letters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or admin can insert email_chain_letters" ON public.email_chain_letters FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.email_chains WHERE id = email_chain_letters.chain_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Owner or admin can update email_chain_letters" ON public.email_chain_letters FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.email_chains WHERE id = email_chain_letters.chain_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Owner or admin can delete email_chain_letters" ON public.email_chain_letters FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.email_chains WHERE id = email_chain_letters.chain_id AND created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add fields to pdf_materials
ALTER TABLE public.pdf_materials ADD COLUMN IF NOT EXISTS pdf_reg_title text;
ALTER TABLE public.pdf_materials ADD COLUMN IF NOT EXISTS pdf_reg_url text;

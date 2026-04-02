
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view email_templates" ON public.email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage email_templates" ON public.email_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.email_letters
  ADD COLUMN letter_theme_title text NOT NULL DEFAULT '',
  ADD COLUMN letter_theme_description text NOT NULL DEFAULT '',
  ADD COLUMN template_id uuid REFERENCES public.email_templates(id);

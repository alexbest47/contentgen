
CREATE TABLE public.prompt_global_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_global_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view" ON public.prompt_global_variables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update" ON public.prompt_global_variables
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert" ON public.prompt_global_variables
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_prompt_global_variables_updated_at
  BEFORE UPDATE ON public.prompt_global_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.prompt_global_variables (key, label) VALUES
  ('offer_rules', 'Адаптация под тип оффера'),
  ('antiAI_rules', 'Требования к тексту — антиAI'),
  ('brand_voice', 'Голос бренда Talentsy');

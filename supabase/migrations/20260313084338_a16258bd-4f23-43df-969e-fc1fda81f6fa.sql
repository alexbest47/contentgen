
CREATE TABLE public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email_settings"
  ON public.email_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert email_settings"
  ON public.email_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email_settings"
  ON public.email_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default values
INSERT INTO public.email_settings (setting_key, setting_value) VALUES
  ('email_header_html', ''),
  ('email_footer_html', '');

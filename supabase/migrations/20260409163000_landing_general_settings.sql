-- General landing settings for constructor
ALTER TABLE public.landings
  ADD COLUMN IF NOT EXISTS landing_type text NOT NULL DEFAULT 'wordpress',
  ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'getcourse',
  ADD COLUMN IF NOT EXISTS getcourse_widget_id text,
  ADD COLUMN IF NOT EXISTS getcourse_action_id text,
  ADD COLUMN IF NOT EXISTS form_deal_name text,
  ADD COLUMN IF NOT EXISTS gateway_alias text,
  ADD COLUMN IF NOT EXISTS url_path text;

COMMENT ON COLUMN public.landings.landing_type IS 'Landing platform type: wordpress | s3';
COMMENT ON COLUMN public.landings.form_type IS 'Form integration type: getcourse | gateway';
COMMENT ON COLUMN public.landings.getcourse_widget_id IS 'GetCourse widget id (for getcourse form type)';
COMMENT ON COLUMN public.landings.getcourse_action_id IS 'GetCourse action id (for getcourse form type)';
COMMENT ON COLUMN public.landings.form_deal_name IS 'Optional form/deal display name';
COMMENT ON COLUMN public.landings.gateway_alias IS 'Optional gateway alias';
COMMENT ON COLUMN public.landings.url_path IS 'Public URL path after the domain, e.g. /course/psychology';

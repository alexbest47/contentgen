-- Add WP template name for landing export settings
ALTER TABLE public.landings
  ADD COLUMN IF NOT EXISTS wp_template_name TEXT;

COMMENT ON COLUMN public.landings.wp_template_name IS
  'Unique WP template display name suffix (stored without "__NewAge: " prefix).';

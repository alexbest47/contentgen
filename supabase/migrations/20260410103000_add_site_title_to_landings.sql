-- Site title for static (s3) landing exports
ALTER TABLE public.landings
  ADD COLUMN IF NOT EXISTS site_title TEXT;

COMMENT ON COLUMN public.landings.site_title IS
  'HTML <title> value for static s3 landing export.';

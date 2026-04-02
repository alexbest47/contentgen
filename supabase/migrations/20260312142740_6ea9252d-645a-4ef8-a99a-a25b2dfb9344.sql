ALTER TABLE public.lead_magnets
  DROP COLUMN IF EXISTS format,
  DROP COLUMN IF EXISTS promise,
  DROP COLUMN IF EXISTS key_insight,
  ADD COLUMN visual_format text DEFAULT '',
  ADD COLUMN visual_content text DEFAULT '',
  ADD COLUMN instant_value text DEFAULT '';
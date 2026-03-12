ALTER TABLE public.lead_magnets
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS marketing_angle,
  DROP COLUMN IF EXISTS call_to_action,
  DROP COLUMN IF EXISTS infographic_concept,
  DROP COLUMN IF EXISTS attention_reason,
  ADD COLUMN format text DEFAULT '',
  ADD COLUMN key_insight text DEFAULT '',
  ADD COLUMN transition_to_course text DEFAULT '';
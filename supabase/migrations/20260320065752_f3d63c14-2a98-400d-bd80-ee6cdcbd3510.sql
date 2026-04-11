
-- Remove 'sale' from offer_type enum
-- Step 1: Create new enum without 'sale'
CREATE TYPE public.offer_type_new AS ENUM (
  'mini_course', 'diagnostic', 'webinar', 'pre_list',
  'new_stream', 'spot_available', 'discount', 'download_pdf'
);

-- Step 2: Alter column to use new enum
ALTER TABLE public.offers 
  ALTER COLUMN offer_type TYPE public.offer_type_new 
  USING offer_type::text::public.offer_type_new;

-- Step 3: Drop old enum and rename new one
DROP TYPE public.offer_type;
ALTER TYPE public.offer_type_new RENAME TO offer_type;

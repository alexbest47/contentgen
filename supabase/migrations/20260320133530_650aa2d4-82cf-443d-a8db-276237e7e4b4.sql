
ALTER TABLE public.offers
  ADD COLUMN webinar_date timestamptz,
  ADD COLUMN is_date_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN is_autowebinar boolean NOT NULL DEFAULT false,
  ADD COLUMN landing_url text;

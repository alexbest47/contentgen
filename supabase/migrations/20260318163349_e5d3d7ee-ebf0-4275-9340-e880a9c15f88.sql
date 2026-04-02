ALTER TABLE public.email_letters
  ADD COLUMN program_id uuid REFERENCES public.paid_programs(id),
  ADD COLUMN offer_type text NOT NULL DEFAULT '',
  ADD COLUMN offer_id uuid REFERENCES public.offers(id),
  ADD COLUMN case_id uuid REFERENCES public.case_classifications(id),
  ADD COLUMN extra_offer_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN generated_html text NOT NULL DEFAULT '',
  ADD COLUMN image_placeholders jsonb NOT NULL DEFAULT '[]'::jsonb;
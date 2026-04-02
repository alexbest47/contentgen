ALTER TABLE public.diagnostics
  ADD CONSTRAINT diagnostics_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES public.offers(id)
  ON DELETE SET NULL;
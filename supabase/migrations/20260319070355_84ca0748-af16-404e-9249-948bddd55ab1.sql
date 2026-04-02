
ALTER TABLE public.offers ADD COLUMN image_url text;
ALTER TABLE public.diagnostics ADD COLUMN image_url text;

INSERT INTO storage.buckets (id, name, public) VALUES ('offer-images', 'offer-images', true);

CREATE POLICY "Anyone can read offer-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'offer-images');

CREATE POLICY "Authenticated users can upload offer-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'offer-images');

CREATE POLICY "Authenticated users can update offer-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'offer-images');

CREATE POLICY "Authenticated users can delete offer-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'offer-images');

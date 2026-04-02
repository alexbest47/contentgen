-- Create image_styles table
CREATE TABLE public.image_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_styles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view image_styles" ON public.image_styles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert image_styles" ON public.image_styles
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update image_styles" ON public.image_styles
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete image_styles" ON public.image_styles
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add image_style_id to email_letters
ALTER TABLE public.email_letters
  ADD COLUMN image_style_id uuid REFERENCES public.image_styles(id);

-- Insert 3 starter styles
INSERT INTO public.image_styles (name, description) VALUES
  ('Стиль 1', ''),
  ('Стиль 2', ''),
  ('Стиль 3', '');

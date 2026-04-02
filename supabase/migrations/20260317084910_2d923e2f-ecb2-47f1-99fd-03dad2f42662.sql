
-- Create color_schemes table
CREATE TABLE public.color_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  preview_colors text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.color_schemes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated can view color_schemes"
  ON public.color_schemes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert color_schemes"
  ON public.color_schemes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update color_schemes"
  ON public.color_schemes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete color_schemes"
  ON public.color_schemes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_color_schemes_updated_at
  BEFORE UPDATE ON public.color_schemes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add selected_color_scheme_id to projects
ALTER TABLE public.projects
  ADD COLUMN selected_color_scheme_id uuid REFERENCES public.color_schemes(id);

-- Seed 14 color schemes
INSERT INTO public.color_schemes (name, description, preview_colors, is_active) VALUES
('Классика', '', ARRAY['#7B2FBE', '#F0EDF7', '#1A1A2E', '#FFFFFF'], true),
('Тёмная глубина', '', ARRAY['#1A1A1A', '#7B2FBE', '#F5D86E', '#B8D9F0'], true),
('Серо-фиолетовая', '', ARRAY['#4A4A5E', '#7B2FBE', '#F0EDF7', '#FFFFFF'], true),
('Электрик', '', ARRAY['#1565C0', '#E8401A', '#FFFFFF', '#D0E8FF'], true),
('Мягкая лаванда', '', ARRAY['#EBE6F8', '#7B2FBE', '#FFFFFF', '#F5D86E'], true),
('Кинематографическая', '', ARRAY['#2A1A2A', '#FF6B9D', '#FFFFFF', '#4A2A3A'], true),
('Тёплая бежевая', '', ARRAY['#F5EFE6', '#E8401A', '#5BBFB5', '#1A1A2E'], true),
('Сериальная', '', ARRAY['#D8EEF8', '#1A1A2E', '#F5D86E', '#FFFFFF'], true),
('Розовая нежность', '', ARRAY['#FFFFFF', '#F5B8D0', '#1A1A2E', '#E8D0DC'], true),
('Редакционная белая', '', ARRAY['#FFFFFF', '#7B2FBE', '#1A1A2E', '#6B6B8A'], true),
('Тёплая лаванда', '', ARRAY['#9B59B6', '#EDE8F5', '#1A1A2E', '#FFFFFF'], true),
('Контрастная тёмная', '', ARRAY['#1A1A2E', '#7B2FBE', '#A78BDA', '#FFFFFF'], true),
('Свежая голубая', '', ARRAY['#2E86AB', '#E8F4F8', '#1A1A2E', '#FFFFFF'], true),
('Тёплая терракота', '', ARRAY['#E8773A', '#FFF0E8', '#1A1A2E', '#FFFFFF'], true);

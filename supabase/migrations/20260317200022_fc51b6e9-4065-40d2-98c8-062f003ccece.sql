
-- Add email_builder to prompt_category enum
ALTER TYPE public.prompt_category ADD VALUE IF NOT EXISTS 'email_builder';

-- Create email_letters table
CREATE TABLE public.email_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  preheader text NOT NULL DEFAULT '',
  selected_color_scheme_id uuid REFERENCES public.color_schemes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email_letters"
  ON public.email_letters FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owner can insert email_letters"
  ON public.email_letters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin can update email_letters"
  ON public.email_letters FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete email_letters"
  ON public.email_letters FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_letters_updated_at
  BEFORE UPDATE ON public.email_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create email_letter_blocks table
CREATE TABLE public.email_letter_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES public.email_letters(id) ON DELETE CASCADE,
  block_type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}',
  generated_html text NOT NULL DEFAULT '',
  banner_image_prompt text NOT NULL DEFAULT '',
  banner_image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_letter_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view email_letter_blocks"
  ON public.email_letter_blocks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owner or admin can insert email_letter_blocks"
  ON public.email_letter_blocks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.email_letters WHERE id = email_letter_blocks.letter_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owner or admin can update email_letter_blocks"
  ON public.email_letter_blocks FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.email_letters WHERE id = email_letter_blocks.letter_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owner or admin can delete email_letter_blocks"
  ON public.email_letter_blocks FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.email_letters WHERE id = email_letter_blocks.letter_id AND created_by = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_email_letter_blocks_updated_at
  BEFORE UPDATE ON public.email_letter_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

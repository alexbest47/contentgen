
ALTER TYPE public.prompt_category ADD VALUE 'testimonial_content';

ALTER TABLE public.projects ADD COLUMN selected_case_id uuid REFERENCES public.case_classifications(id);

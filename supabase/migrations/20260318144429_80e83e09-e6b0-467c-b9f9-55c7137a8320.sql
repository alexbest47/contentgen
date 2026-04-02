
CREATE TABLE public.topic_tree (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.topic_tree(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view topic_tree" ON public.topic_tree FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert topic_tree" ON public.topic_tree FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update topic_tree" ON public.topic_tree FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete topic_tree" ON public.topic_tree FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

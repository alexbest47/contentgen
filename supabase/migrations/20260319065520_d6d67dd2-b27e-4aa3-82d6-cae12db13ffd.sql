CREATE POLICY "Owner or admin can update tags" ON public.tags
  FOR UPDATE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));
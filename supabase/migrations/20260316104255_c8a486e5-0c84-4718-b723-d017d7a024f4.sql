
ALTER TABLE public.prompts ADD COLUMN channel text;

-- Move channel values from content_type to channel
UPDATE public.prompts SET channel = content_type, content_type = 'lead_magnet' WHERE content_type IN ('instagram', 'telegram', 'vk', 'email');

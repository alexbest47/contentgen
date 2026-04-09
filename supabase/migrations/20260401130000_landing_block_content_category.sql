-- Add landing_block_content category for AI generation of landing block text
ALTER TYPE public.prompt_category ADD VALUE IF NOT EXISTS 'landing_block_content';

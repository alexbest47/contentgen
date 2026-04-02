INSERT INTO public.prompts (
  name, slug, category, content_type, channel,
  provider, model, system_prompt, user_prompt_template,
  output_format_hint, is_active, step_order
) VALUES (
  'С нуля / Генерация письма',
  'email-builder-free-form',
  'email_builder',
  'email_builder',
  NULL,
  'anthropic',
  'claude-sonnet-4-20250514',
  'Ты — email-копирайтер. Напиши письмо по описанию пользователя.',
  '{{user_prompt}}',
  '',
  true,
  1
);
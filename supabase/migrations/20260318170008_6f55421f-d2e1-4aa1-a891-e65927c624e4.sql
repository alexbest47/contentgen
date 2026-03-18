
DELETE FROM public.prompts
WHERE slug IN (
  'email-builder-lead_magnet',
  'email-builder-reference_material',
  'email-builder-expert_content',
  'email-builder-provocative_content',
  'email-builder-list_content',
  'email-builder-myth_busting',
  'email-builder-objection_handling'
);

INSERT INTO public.prompts (
  name, slug, description, provider, model,
  system_prompt, user_prompt_template,
  is_active, content_type, channel, step_order, category
) VALUES (
  'Блок подборки офферов',
  'email-builder-offer_collection',
  'Генерация HTML-блока подборки офферов для email-письма',
  'anthropic',
  'claude-sonnet-4-20250514',
  'Ты генератор HTML-блоков для email-писем. Создай блок подборки офферов.',
  '',
  true,
  'email_builder',
  NULL,
  8,
  'email_builder'
);

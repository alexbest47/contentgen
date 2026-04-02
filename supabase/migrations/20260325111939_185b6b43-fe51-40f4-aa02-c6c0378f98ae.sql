UPDATE email_letters
SET generated_html = regexp_replace(
  regexp_replace(
    generated_html,
    'background-image:\s*none;\s*background-color:\s*transparent',
    'background-image: url({{image_placeholder_1}})',
    'g'
  ),
  'background-image:\s*none',
  'background-image: url({{image_placeholder_1}})',
  'g'
)
WHERE id = 'f9e1bfa6-4e91-46c6-8bc2-b72c641dd860';
-- Migration: Add PHP templates for form-containing landing blocks
-- Date: 2026-04-03
-- Description: Updates the php_template column for all form-containing block definitions.
-- The php_template transforms HTML form attributes into PHP with $formParmas variables,
-- enabling dynamic form parameter injection while maintaining the same layout.

-- Step 1: Set php_template for form-containing block definitions
-- This transforms the HTML form attributes into PHP with $formParmas variables
UPDATE landing_block_definitions
SET php_template =
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              html_template,
              'data-target="axFormRequest"',
              '<?= $formParmas[''tag'']; ?>'
            ),
            'name="Name"',
            'name="<?= $formParmas[''names''][''name'']; ?>"'
          ),
          'name="Phone"',
          'name="<?= $formParmas[''names''][''phone'']; ?>"'
        ),
        'name="Email"',
        'name="<?= $formParmas[''names''][''email'']; ?>"'
      ),
      '</form>',
      '<?= $formParmas[''hiddens'']; ?></form>'
    ),
    'class="ajaxForm',
    'class="<?= $formParmas[''class'']; ?>'
  )
WHERE block_type IN ('cta_form_consultation', 'cta_form_application', 'skills_grid')
  OR html_template LIKE '%ajaxForm%'
  OR html_template LIKE '%name="Name"%';

-- Step 2: Replace the agreed block in php_template
-- The agreed block is wrapped in <noindex> tags
-- We replace it with the WP template part call
UPDATE landing_block_definitions
SET php_template = regexp_replace(
  php_template,
  '<noindex>\s*<div class="agreed__block[\s\S]*?</noindex>',
  '<? get_template_part( ''inc/components/form/agreed'' ); ?>',
  'g'
)
WHERE php_template IS NOT NULL
  AND php_template LIKE '%agreed__block%';

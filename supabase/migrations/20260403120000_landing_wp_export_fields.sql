-- Add WordPress export fields to landings table
ALTER TABLE landings
  ADD COLUMN IF NOT EXISTS wp_template_name TEXT,
  ADD COLUMN IF NOT EXISTS breadcrumb_slug TEXT DEFAULT 'psychology',
  ADD COLUMN IF NOT EXISTS breadcrumb_title TEXT DEFAULT 'Курсы психологии';

-- Add php_template column to landing_block_definitions for form blocks
-- This stores the PHP version of the block HTML (with $formParmas variables)
ALTER TABLE landing_block_definitions
  ADD COLUMN IF NOT EXISTS php_template TEXT;

COMMENT ON COLUMN landings.wp_template_name IS 'WordPress template name (e.g. "__NewAge: Психолог-консультант"). Set on first export, never changed after.';
COMMENT ON COLUMN landings.breadcrumb_slug IS 'URL slug for breadcrumbs category (e.g. "psychology")';
COMMENT ON COLUMN landings.breadcrumb_title IS 'Display name for breadcrumbs category (e.g. "Курсы психологии")';
COMMENT ON COLUMN landing_block_definitions.php_template IS 'PHP version of html_template with WP form variables ($formParmas). Used during export instead of html_template for form blocks.';

-- Remove promo_banner, header, and footer block types.
-- These are handled by WordPress get_header('light') / get_footer('light')
-- and should not be part of the landing constructor.

-- 1. Remove from landing blocks (instances in actual landings)
DELETE FROM landing_blocks
WHERE block_definition_id IN (
  SELECT id FROM landing_block_definitions
  WHERE block_type IN ('promo_banner', 'header', 'footer')
);

-- 2. Remove from template block associations
DELETE FROM landing_template_blocks
WHERE block_definition_id IN (
  SELECT id FROM landing_block_definitions
  WHERE block_type IN ('promo_banner', 'header', 'footer')
);

-- 3. Remove block definitions
DELETE FROM landing_block_definitions
WHERE block_type IN ('promo_banner', 'header', 'footer');

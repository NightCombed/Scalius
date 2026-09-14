-- Update store_font constraint to allow 'fraunces' and set default to 'fraunces'
ALTER TABLE store_settings
  DROP CONSTRAINT IF EXISTS store_settings_store_font_check;

ALTER TABLE store_settings
  ADD CONSTRAINT store_settings_store_font_check
  CHECK (store_font IN ('fraunces', 'inter', 'reddit-sans', 'poppins', 'lato', 'playfair'));

ALTER TABLE store_settings
  ALTER COLUMN store_font SET DEFAULT 'fraunces';

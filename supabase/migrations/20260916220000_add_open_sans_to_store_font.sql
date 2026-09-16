-- Update store_font constraint to allow 'open-sans'
ALTER TABLE store_settings
  DROP CONSTRAINT IF EXISTS store_settings_store_font_check;

ALTER TABLE store_settings
  ADD CONSTRAINT store_settings_store_font_check
  CHECK (store_font IN ('fraunces', 'inter', 'reddit-sans', 'poppins', 'lato', 'playfair', 'open-sans'));

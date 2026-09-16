-- Update default store_font to 'poppins' and set all existing stores to 'poppins'
ALTER TABLE store_settings
  ALTER COLUMN store_font SET DEFAULT 'poppins';

UPDATE store_settings
  SET store_font = 'poppins';

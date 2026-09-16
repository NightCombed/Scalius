-- Set default store_font to 'poppins' for existing and future stores
ALTER TABLE store_settings
  ALTER COLUMN store_font SET DEFAULT 'poppins';

UPDATE store_settings
  SET store_font = 'poppins';

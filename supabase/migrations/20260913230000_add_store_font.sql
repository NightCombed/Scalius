-- Add store_font column to store_settings table
-- Allows each store to configure the typography for its public storefront
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS store_font TEXT DEFAULT 'inter'
    CHECK (store_font IN ('inter', 'reddit-sans', 'poppins', 'lato', 'playfair'));

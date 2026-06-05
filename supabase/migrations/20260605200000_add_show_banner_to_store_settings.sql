-- Add show_banner column to store_settings
-- When false, the banner area is completely hidden on the public storefront.
-- Defaults to true so existing stores are unaffected.
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS show_banner boolean NOT NULL DEFAULT true;

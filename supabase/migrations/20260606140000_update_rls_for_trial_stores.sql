-- Update RLS policies to permit public read access for trial stores
DROP POLICY IF EXISTS "categories: leitura pública (loja ativa)" ON public.categories;
CREATE POLICY "categories: leitura pública (loja ativa)" ON public.categories
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = categories.store_id AND stores.status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "products: leitura pública (loja ativa)" ON public.products;
CREATE POLICY "products: leitura pública (loja ativa)" ON public.products
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id AND stores.status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "store_settings: leitura pública (loja ativa)" ON public.store_settings;
CREATE POLICY "store_settings: leitura pública (loja ativa)" ON public.store_settings
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_settings.store_id AND stores.status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "shipping_regions: leitura pública (loja ativa)" ON public.shipping_regions;
CREATE POLICY "shipping_regions: leitura pública (loja ativa)" ON public.shipping_regions
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = shipping_regions.store_id AND stores.status IN ('active', 'trial')
    )
  );

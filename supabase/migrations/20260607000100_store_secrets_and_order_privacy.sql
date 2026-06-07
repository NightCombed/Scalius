-- Migration: Create store_secrets and restrict store_settings columns
-- Plus create orders_tracking_view for privacy-safe public order tracking

-- 1. Create store_secrets table
CREATE TABLE IF NOT EXISTS public.store_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  mp_access_token text,
  mp_refresh_token text,
  mp_access_token_secret_id uuid,
  mp_refresh_token_secret_id uuid,
  mp_token_expires_at timestamp with time zone,
  mp_user_id text,
  melhorenvio_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.store_secrets ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de RLS para store_secrets
CREATE POLICY "store_secrets: membros da loja têm acesso total" ON public.store_secrets
  FOR ALL TO public USING (
    is_store_member(store_id)
  ) WITH CHECK (
    is_store_member(store_id)
  );

CREATE POLICY "store_secrets: super admins têm acesso total" ON public.store_secrets
  FOR ALL TO public USING (
    is_super_admin(auth.uid())
  );

-- 4. Copiar dados existentes
INSERT INTO public.store_secrets (
  store_id,
  mp_access_token,
  mp_refresh_token,
  mp_access_token_secret_id,
  mp_refresh_token_secret_id,
  mp_token_expires_at,
  mp_user_id,
  melhorenvio_token
)
SELECT
  store_id,
  mp_access_token,
  mp_refresh_token,
  mp_access_token_secret_id,
  mp_refresh_token_secret_id,
  mp_token_expires_at,
  mp_user_id,
  melhorenvio_token
FROM public.store_settings
ON CONFLICT (store_id) DO UPDATE SET
  mp_access_token = EXCLUDED.mp_access_token,
  mp_refresh_token = EXCLUDED.mp_refresh_token,
  mp_access_token_secret_id = EXCLUDED.mp_access_token_secret_id,
  mp_refresh_token_secret_id = EXCLUDED.mp_refresh_token_secret_id,
  mp_token_expires_at = EXCLUDED.mp_token_expires_at,
  mp_user_id = EXCLUDED.mp_user_id,
  melhorenvio_token = EXCLUDED.melhorenvio_token;

-- 5. Remover colunas de segredo da store_settings
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS mp_access_token;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS mp_refresh_token;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS mp_access_token_secret_id;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS mp_refresh_token_secret_id;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS mp_token_expires_at;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS mp_user_id;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS melhorenvio_token;

-- 6. Revogar SELECT público na store_secrets por segurança extra (Defense in depth)
REVOKE SELECT ON public.store_secrets FROM anon;

-- 7. Criar View orders_tracking_view para mascaramento de dados sensíveis de clientes
CREATE OR REPLACE VIEW public.orders_tracking_view WITH (security_invoker = true) AS
SELECT
  id,
  store_id,
  order_number,
  status,
  payment_status,
  delivery_type,
  shipping_fee_cents,
  subtotal_cents,
  total_cents,
  created_at,
  delivery_date,
  notes,
  -- Mascaramento das colunas caso o usuário NÃO seja membro da loja ou super admin
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN customer_name
    WHEN length(customer_name) > 3 THEN substring(customer_name from 1 for 2) || '***' || substring(customer_name from length(customer_name))
    ELSE '***'
  END as customer_name,
  
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN customer_phone
    WHEN length(customer_phone) > 6 THEN substring(customer_phone from 1 for 4) || '****' || substring(customer_phone from length(customer_phone)-2)
    ELSE '****'
  END as customer_phone,
  
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN customer_email
    WHEN position('@' in customer_email) > 0 THEN 
      substring(customer_email from 1 for 2) || '***' || substring(customer_email from position('@' in customer_email))
    ELSE '***@***.com'
  END as customer_email,
  
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN address_street
    WHEN length(address_street) > 4 THEN substring(address_street from 1 for 4) || '***'
    ELSE '***'
  END as address_street,
  
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN address_number
    ELSE '***'
  END as address_number,
  
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN address_complement
    ELSE '***'
  END as address_complement,
  
  CASE 
    WHEN is_store_member(store_id) OR is_super_admin(auth.uid()) THEN address_neighborhood
    ELSE '***'
  END as address_neighborhood,
  
  address_city,
  address_state,
  national_shipping_cep,
  shipping_region_name,
  qr_code_data,
  qr_code_base64,
  payment_expires_at,
  payment_provider,
  pix_name,
  shipping_company,
  shipping_service_name,
  shipping_delivery_time_days,
  tracking_code,
  invoice_key,
  melhorenvio_order_id,
  external_payment_id
FROM public.orders;

-- 8. Garantir privilégios de SELECT na view para anon e authenticated
GRANT SELECT ON public.orders_tracking_view TO anon;
GRANT SELECT ON public.orders_tracking_view TO authenticated;
GRANT SELECT ON public.orders_tracking_view TO service_role;

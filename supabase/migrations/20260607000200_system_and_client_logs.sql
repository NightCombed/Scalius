-- Migration: Create audit_logs and client_error_logs tables, and add automatic triggers for audit logging

-- 1. Create client_error_logs table
CREATE TABLE IF NOT EXISTS public.client_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid,
  url text,
  error_message text NOT NULL,
  stack_trace text,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  entity_type text NOT NULL, -- 'products', 'orders', 'store_settings'
  entity_id uuid,
  payload jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Habilitar RLS nas novas tabelas
ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para client_error_logs
-- Qualquer usuário (mesmo anônimo) pode enviar logs de erro do frontend
CREATE POLICY "client_error_logs: inserção pública" ON public.client_error_logs
  FOR INSERT TO public WITH CHECK (true);

-- Apenas membros da loja ou super admins podem visualizar os logs de erro da sua loja
CREATE POLICY "client_error_logs: membros da loja podem ler" ON public.client_error_logs
  FOR SELECT TO public USING (
    is_store_member(store_id) OR is_super_admin(auth.uid())
  );

-- 5. Criar políticas RLS para audit_logs
-- Apenas membros da loja ou super admins podem visualizar os logs de auditoria
CREATE POLICY "audit_logs: membros da loja podem ler" ON public.audit_logs
  FOR SELECT TO public USING (
    is_store_member(store_id) OR is_super_admin(auth.uid())
  );

-- 6. Criar função de trigger de auditoria automática
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_store_id uuid;
  v_action text;
  v_entity_type text;
  v_entity_id uuid;
  v_payload jsonb;
BEGIN
  -- Identificar usuário que realizou a ação
  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
    IF v_user_email IS NULL THEN
      v_user_email := COALESCE(auth.jwt()->>'email', 'user-' || substring(v_user_id::text from 1 for 8));
    END IF;
  ELSE
    v_user_email := 'system/anonymous';
  END IF;

  v_action := TG_OP;
  v_entity_type := TG_TABLE_NAME;

  -- Capturar IDs e dados conforme a operação
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
    IF TG_TABLE_NAME = 'store_settings' THEN
      v_store_id := OLD.store_id;
    ELSIF TG_TABLE_NAME = 'products' THEN
      v_store_id := OLD.store_id;
    ELSIF TG_TABLE_NAME = 'orders' THEN
      v_store_id := OLD.store_id;
    ELSE
      v_store_id := NULL;
    END IF;
    
    -- Limitar dados no payload para evitar excesso de espaço
    v_payload := jsonb_build_object('old', to_jsonb(OLD));
  ELSE
    v_entity_id := NEW.id;
    IF TG_TABLE_NAME = 'store_settings' THEN
      v_store_id := NEW.store_id;
    ELSIF TG_TABLE_NAME = 'products' THEN
      v_store_id := NEW.store_id;
    ELSIF TG_TABLE_NAME = 'orders' THEN
      v_store_id := NEW.store_id;
    ELSE
      v_store_id := NULL;
    END IF;

    IF TG_OP = 'INSERT' THEN
      v_payload := jsonb_build_object('new', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
      -- Salvar apenas o delta ou os dois estados (simplificado)
      v_payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    END IF;
  END IF;

  -- Inserir log se identificarmos a loja
  IF v_store_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      store_id,
      user_id,
      user_email,
      action,
      entity_type,
      entity_id,
      payload
    ) VALUES (
      v_store_id,
      v_user_id,
      v_user_email,
      v_action,
      v_entity_type,
      v_entity_id,
      v_payload
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 7. Criar Triggers para as tabelas principais
-- Trigger para store_settings
CREATE TRIGGER audit_store_settings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Trigger para products
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Trigger para orders
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 8. Garantir privilégios
GRANT SELECT, INSERT ON public.client_error_logs TO anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

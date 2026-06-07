-- Migration: Configure pg_net + pg_cron for automatic hourly error alerts
--
-- PRÉ-REQUISITO: Ativar as extensões manualmente no painel do Supabase ANTES de aplicar esta migração:
--   1. Acesse: https://supabase.com/dashboard/project/jrmixsvdnejzfxvybmng/database/extensions
--   2. Habilite "pg_net"  (Async HTTP)
--   3. Habilite "pg_cron" (Job Scheduler)
--   4. Então aplique esta migração via: npx supabase db push
--
-- ALTERNATIVA (sem pg_cron): Criar o cron diretamente no painel Supabase:
--   Dashboard > Database > Cron Jobs > New Job
--   Schedule: "0 * * * *"  (toda hora no minuto 0)
--   Command: SELECT public.trigger_critical_error_alert();

-- 1. Habilitar pg_net para chamadas HTTP assíncronas do banco
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Habilitar pg_cron para agendamento de jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 3. Recuperar URL do projeto e anon key das configurações da aplicação
--    (Configuradas via: supabase secrets set / app.settings no Supabase)
DO $$
BEGIN
  -- Configura os valores necessários para a função de trigger
  -- Estes valores podem ser recuperados no painel: Settings > API
  PERFORM set_config('app.settings.supabase_url',
    COALESCE(current_setting('app.settings.supabase_url', true), 'https://jrmixsvdnejzfxvybmng.supabase.co'),
    false
  );
END $$;

-- 4. Criar função que dispara o alerta via HTTP (pg_net)
CREATE OR REPLACE FUNCTION public.trigger_critical_error_alert()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public, pg_catalog
AS $$
DECLARE
  v_project_url text := 'https://jrmixsvdnejzfxvybmng.supabase.co';
  v_anon_key    text;
BEGIN
  -- Buscar a anon key de forma segura via vault ou settings
  BEGIN
    v_anon_key := current_setting('app.settings.anon_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_anon_key := NULL;
  END;

  IF v_anon_key IS NULL THEN
    RAISE WARNING '[alert-cron] app.settings.anon_key nao configurado. Configure com: ALTER DATABASE postgres SET app.settings.anon_key = ''sua-anon-key'';';
    RETURN;
  END IF;

  -- Chamar a Edge Function de forma assíncrona (não bloqueia o cron)
  PERFORM extensions.http_post(
    url     := v_project_url || '/functions/v1/alert-critical-errors',
    headers := ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer ' || v_anon_key)
    ]::extensions.http_header[],
    content_type := 'application/json',
    content      := '{}'
  );

  RAISE LOG '[alert-cron] Alerta de erros críticos disparado em %', now();
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[alert-cron] Falha ao disparar alerta: %', SQLERRM;
END;
$$;

-- 5. Agendar execução automática: toda hora no minuto 0
SELECT cron.schedule(
  'alert-critical-errors-hourly',
  '0 * * * *',
  $$SELECT public.trigger_critical_error_alert();$$
);

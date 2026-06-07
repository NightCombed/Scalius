import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapStoreSettings } from "@/lib/store-settings";
import type { StoreSettings } from "@/types/database";

export function useStoreSettings(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-settings", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const [settingsRes, secretsRes] = await Promise.all([
        supabase
          .from("store_settings")
          .select("*")
          .eq("store_id", storeId)
          .maybeSingle(),
        supabase
          .from("store_secrets")
          .select("mp_access_token, mp_refresh_token, mp_access_token_secret_id, mp_refresh_token_secret_id, mp_token_expires_at, mp_user_id, melhorenvio_token")
          .eq("store_id", storeId)
          .maybeSingle(),
      ]);
        
      if (settingsRes.error) throw settingsRes.error;
      if (secretsRes.error) {
        console.error("[useStoreSettings] Error loading secrets:", secretsRes.error);
      }
      if (!settingsRes.data) return null;

      const mergedData = {
        ...settingsRes.data,
        ...(secretsRes.data || {}),
      };

      return mapStoreSettings(mergedData);
    },
    enabled: !!storeId,
    // Add a bit of staleTime to avoid constant refetching
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

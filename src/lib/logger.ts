import { supabase } from "@/integrations/supabase/client";

const IS_PROD = import.meta.env.PROD;

// Basic rate limiting to prevent database flooding (max 10 errors per minute)
let errorCountThisMinute = 0;
let rateLimitResetTime = Date.now() + 60000;

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now > rateLimitResetTime) {
    errorCountThisMinute = 0;
    rateLimitResetTime = now + 60000;
  }
  if (errorCountThisMinute >= 10) {
    return false; // Rate limited
  }
  errorCountThisMinute++;
  return true;
}

export const Logger = {
  info(message: string, meta?: any) {
    if (!IS_PROD) {
      console.log(
        `%c[INFO] %c${message}`,
        "color: #0ea5e9; font-weight: bold; padding: 2px 4px; border-radius: 4px; background: rgba(14, 165, 233, 0.1);",
        "color: inherit;",
        meta !== undefined ? meta : ""
      );
    }
  },

  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta !== undefined ? meta : "");
  },

  async error(err: string | Error, errorObj?: any, storeId?: string) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : new Error().stack;

    // Always output to console
    console.error(`[ERROR] ${message}`, errorObj !== undefined ? errorObj : "", err);

    // Only send to Supabase in production and if rate limit is not exceeded
    if (IS_PROD) {
      if (!checkRateLimit()) {
        console.warn("[Logger] Local database logging rate-limit reached. Suppressing report.");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;
        
        // Construct metadata
        const metadata = {
          ...(errorObj || {}),
          location: window.location.origin + window.location.pathname,
        };

        // Fire-and-forget: do not block UI thread
        supabase
          .from("client_error_logs")
          .insert({
            store_id: storeId || null,
            user_id: userId,
            url: window.location.href,
            error_message: message,
            stack_trace: stack || null,
            user_agent: navigator.userAgent,
            metadata: metadata
          })
          .then(({ error }) => {
            if (error) {
              console.warn("[Logger] Failed to write error log to Supabase:", error);
            }
          });
      } catch (logErr) {
        console.warn("[Logger] Exception while trying to write client error log:", logErr);
      }
    }
  }
};

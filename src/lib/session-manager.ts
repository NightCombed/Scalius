/**
 * session-manager — Utilities for tracking active admin sessions per store.
 *
 * Used to enforce the concurrent device limit on the Essencial plan (max 2).
 * Sessions are stored in the `store_sessions` table in Supabase.
 *
 * Flow:
 *   1. On login → registerSession() — validates limit, inserts row
 *   2. While active → refreshSession() — updates last_seen_at (heartbeat)
 *   3. On logout → removeSession() — deletes the row
 */
import { supabase } from "@/integrations/supabase/client";

/** Generates a hash from the Supabase JWT jti (or the full token as fallback). */
async function hashToken(token: string): Promise<string> {
  // Use only the jti claim if available (middle part of JWT)
  const parts = token.split(".");
  const payload = parts[1];
  if (!payload) return token.slice(-32);

  try {
    const data = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 64);
  } catch {
    // Fallback for environments without SubtleCrypto
    return payload.slice(0, 64);
  }
}

/** Extracts a short user-agent description for display. */
function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  // Detect mobile
  if (/iPhone|iPad|iPod/.test(ua)) return `Safari · iOS`;
  if (/Android/.test(ua) && /Mobile/.test(ua)) return `Android · Mobile`;
  if (/Android/.test(ua)) return `Android · Tablet`;
  // Detect browsers
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
    ? "Opera"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Navegador";
  // Detect OS
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS/.test(ua)
    ? "macOS"
    : /Linux/.test(ua)
    ? "Linux"
    : "Desktop";
  return `${browser} · ${os}`;
}

export type SessionRegistrationResult =
  | { ok: true; sessionToken: string }
  | { ok: false; reason: "limit_exceeded" | "error"; message: string };

/**
 * Registers a new admin session for the store.
 * Calls the `check_session_limit` DB function before inserting.
 * Returns `{ ok: false, reason: 'limit_exceeded' }` if the plan limit is reached.
 */
export async function registerSession(
  storeId: string,
  accessToken: string,
  userId: string
): Promise<SessionRegistrationResult> {
  try {
    const sessionToken = await hashToken(accessToken);

    // 1. Check if this session already exists in the DB
    const { data: existing, error: selectError } = await supabase
      .from("store_sessions")
      .select("id")
      .eq("session_token", sessionToken)
      .maybeSingle();

    if (selectError) {
      console.error("[session-manager] error checking existing session:", selectError);
    }

    if (existing) {
      // Session exists, just refresh last_seen_at (heartbeat)
      const refreshed = await refreshSession(sessionToken);
      if (refreshed) {
        return { ok: true, sessionToken };
      }
    }

    // 2. If it does not exist in the DB, check if the client had it in localStorage
    if (typeof window !== "undefined") {
      const clientStoredToken = localStorage.getItem("scalius_session_token");
      if (clientStoredToken === sessionToken) {
        console.warn("[session-manager] Session was terminated remotely. Blocking registration.");
        return {
          ok: false,
          reason: "error",
          message: "Sessão encerrada por outro dispositivo ou pelo dono da loja.",
        };
      }
    }

    // 3. Check limit via DB function (also cleans stale sessions)
    const { data: allowed, error: checkError } = await supabase.rpc(
      "check_session_limit",
      { p_store_id: storeId, p_session_token: sessionToken }
    );

    if (checkError) {
      // Fail open — don't block login on DB errors, just log and continue to insert
      console.error("[session-manager] check_session_limit error:", checkError);
    } else if (allowed === false) {
      return {
        ok: false,
        reason: "limit_exceeded",
        message:
          "Limite de dispositivos atingido para o plano Essencial. " +
          "Faça logout em outro dispositivo ou faça upgrade para o Plano Pro.",
      };
    }

    // 4. Insert the session row
    const { error: insertError } = await supabase.from("store_sessions").insert({
      store_id: storeId,
      user_id: userId,
      session_token: sessionToken,
      device_info: getDeviceInfo(),
    });

    if (insertError) {
      // If conflict (same token already exists), just update last_seen_at
      if (insertError.code === "23505") {
        await supabase
          .from("store_sessions")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("session_token", sessionToken);
      } else {
        console.error("[session-manager] insert error:", insertError);
        throw insertError;
      }
    }

    return { ok: true, sessionToken };
  } catch (err) {
    console.error("[session-manager] registerSession error:", err);
    return { ok: true, sessionToken: "" }; // fail open
  }
}

/**
 * Updates last_seen_at for the current session (heartbeat).
 * Should be called periodically (e.g. every 2-5 minutes) while the user is active.
 * Returns false if the session no longer exists (remote logout).
 */
export async function refreshSession(sessionToken: string): Promise<boolean> {
  if (!sessionToken) return false;
  try {
    const { data, error } = await supabase
      .from("store_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("session_token", sessionToken)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[session-manager] refreshSession error:", error);
      return true; // Fail open on error
    }
    return !!data;
  } catch (err) {
    console.error("[session-manager] refreshSession error:", err);
    return true; // Fail open
  }
}

/**
 * Removes the current session on logout.
 */
export async function removeSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  try {
    const { error } = await supabase
      .from("store_sessions")
      .delete()
      .eq("session_token", sessionToken);
    
    if (error) {
      console.error("[session-manager] removeSession error:", error);
      throw error;
    }
  } catch (err) {
    console.error("[session-manager] removeSession error:", err);
    throw err;
  }
}

/**
 * Removes a specific session by ID (for remote logout by store owner/manager).
 */
export async function removeSessionById(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("store_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("[session-manager] removeSessionById error:", error);
      throw error;
    }
  } catch (err) {
    console.error("[session-manager] removeSessionById error:", err);
    throw err;
  }
}


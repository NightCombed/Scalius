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
export async function hashToken(token: string): Promise<string> {
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
 * Migrates an existing session row to a new token (called on JWT token refresh).
 * Returns true if a row was found and updated, false otherwise.
 */
export async function migrateSession(
  oldToken: string,
  newToken: string
): Promise<boolean> {
  if (!oldToken || !newToken || oldToken === newToken) return false;
  try {
    const { data, error } = await supabase
      .from("store_sessions")
      .update({
        session_token: newToken,
        last_seen_at: new Date().toISOString(),
      })
      .eq("session_token", oldToken)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[session-manager] migrateSession error:", error);
      return false;
    }
    if (data) {
      console.log("[session-manager] Token rotated — session row migrated in-place.");
      return true;
    }
    return false;
  } catch (err) {
    console.error("[session-manager] migrateSession error:", err);
    return false;
  }
}

/**
 * Registers a new admin session for the store.
 * Calls the `check_session_limit` DB function before inserting.
 * Returns `{ ok: false, reason: 'limit_exceeded' }` if the plan limit is reached.
 *
 * Key invariant: at most ONE session row per physical browser tab/window.
 * On JWT token refresh (TOKEN_REFRESHED) use migrateSession() instead of this.
 */
export async function registerSession(
  storeId: string,
  accessToken: string,
  userId: string
): Promise<SessionRegistrationResult> {
  try {
    const sessionToken = await hashToken(accessToken);

    // 1. Check if this exact token already has a row — just heartbeat it.
    const { data: existing, error: selectError } = await supabase
      .from("store_sessions")
      .select("id")
      .eq("session_token", sessionToken)
      .maybeSingle();

    if (selectError) {
      console.error("[session-manager] error checking existing session:", selectError);
    }

    if (existing) {
      await refreshSession(sessionToken);
      return { ok: true, sessionToken };
    }

    // 2. Check for a previous session row from the same browser (localStorage token).
    //    If found, migrate the row to the new token instead of inserting a new row.
    //    This is the main guard against phantom duplicates from JWT token rotation.
    if (typeof window !== "undefined") {
      const clientStoredToken = localStorage.getItem("scalius_session_token");

      if (clientStoredToken && clientStoredToken !== sessionToken) {
        // Attempt in-place migration first
        const migrated = await migrateSession(clientStoredToken, sessionToken);
        if (migrated) {
          return { ok: true, sessionToken };
        }
        // The old token row no longer exists (was deleted remotely or expired).
        // If the old token was still in localStorage it means this browser had a valid
        // session that was terminated remotely — block re-registration.
        // However, if clientStoredToken was merely stale (row already cleaned up by
        // the >1h TTL), we should allow a fresh login. Distinguish by checking whether
        // the old token's row was ever present: we just tried to migrate and got false,
        // meaning no row existed → fall through to normal check_session_limit path.
      } else if (clientStoredToken === sessionToken) {
        // Token in localStorage matches new token but row is missing → was terminated remotely.
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


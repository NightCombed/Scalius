/**
 * useStoreRole — Hook que expõe o papel do usuário logado na loja ativa
 * e funções de verificação de permissão.
 *
 * Permissões por papel:
 *
 *  Permissão                | owner | admin | staff
 *  ─────────────────────────|───────|───────|──────
 *  view_dashboard           |  ✅   |  ✅   |  ✅
 *  view_revenue             |  ✅   |  ✅   |  ✅ (configurable)
 *  view_orders              |  ✅   |  ✅   |  ✅
 *  update_order_status      |  ✅   |  ✅   |  ✅
 *  manage_products          |  ✅   |  ✅   |  ✅
 *  manage_categories        |  ✅   |  ✅   |  ✅
 *  manage_shipping_settings |  ✅   |  ✅   |  ❌
 *  manage_settings          |  ✅   |  ✅   |  ❌
 *  manage_payments          |  ✅   |  ❌   |  ❌  ← Mercado Pago, etc.
 *  manage_notifications     |  ✅   |  ✅   |  ❌
 *  manage_team              |  ✅   |  ❌   |  ❌  ← ver dispositivos, permissões
 */
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import type { StoreRole } from "@/types/database";

export type StorePermission =
  | "view_dashboard"
  | "view_revenue"           // pode ser desativado por setting
  | "view_orders"
  | "update_order_status"
  | "manage_products"
  | "manage_categories"
  | "manage_shipping_settings"
  | "manage_settings"
  | "manage_payments"        // owner only
  | "manage_notifications"
  | "manage_team";           // owner only

/** Human-readable label for each role */
export const ROLE_LABEL: Record<StoreRole, string> = {
  owner: "Dono",
  admin: "Gerente",
  staff: "Colaborador",
};

/** Badge color classes for each role */
export const ROLE_BADGE_CLASSES: Record<StoreRole, string> = {
  owner: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  staff: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

/**
 * Permissions matrix per role.
 * Any permission not listed for a role is considered denied.
 */
const ROLE_PERMISSIONS: Record<StoreRole, Set<StorePermission>> = {
  owner: new Set<StorePermission>([
    "view_dashboard",
    "view_revenue",
    "view_orders",
    "update_order_status",
    "manage_products",
    "manage_categories",
    "manage_shipping_settings",
    "manage_settings",
    "manage_payments",
    "manage_notifications",
    "manage_team",
  ]),
  admin: new Set<StorePermission>([
    "view_dashboard",
    "view_revenue",
    "view_orders",
    "update_order_status",
    "manage_products",
    "manage_categories",
    "manage_shipping_settings",
    "manage_settings",
    "manage_notifications",
    // manage_payments → ❌
    // manage_team     → ❌
  ]),
  staff: new Set<StorePermission>([
    "view_dashboard",
    "view_revenue",       // visible by default; can be toggled via show_revenue_to_staff setting
    "view_orders",
    "update_order_status",
    "manage_products",
    "manage_categories",
    // manage_shipping_settings → ❌
    // manage_settings          → ❌
    // manage_payments          → ❌
    // manage_notifications     → ❌
    // manage_team              → ❌
  ]),
};

export interface UseStoreRoleReturn {
  /** The role of the current user in the active store. Null when not a member. */
  role: StoreRole | null;
  /** Human-readable label for the current role */
  roleLabel: string | null;
  /** Badge color classes for the current role */
  roleBadgeClasses: string;
  /** Returns true if the user has the given permission */
  can: (permission: StorePermission) => boolean;
  /** True when role is 'owner' */
  isOwner: boolean;
  /** True when role is 'owner' or 'admin' */
  isManager: boolean;
}

export function useStoreRole(): UseStoreRoleReturn {
  const { memberships } = useAuth();
  const store = useActiveStore();
  const { data: settings } = useStoreSettings(store?.id);

  const role = useMemo<StoreRole | null>(() => {
    if (!store) return null;
    const membership = memberships.find((m) => m.store.id === store.id);
    return (membership?.role as StoreRole) ?? null;
  }, [memberships, store]);

  return useMemo<UseStoreRoleReturn>(() => {
    const permissions = role ? ROLE_PERMISSIONS[role] : new Set<StorePermission>();

    return {
      role,
      roleLabel: role ? ROLE_LABEL[role] : null,
      roleBadgeClasses: role ? ROLE_BADGE_CLASSES[role] : ROLE_BADGE_CLASSES.staff,
      can: (permission: StorePermission) => {
        if (!role) return false;
        if (permission === "view_revenue" && role === "staff") {
          return settings?.show_revenue_to_staff ?? true;
        }
        return permissions.has(permission);
      },
      isOwner: role === "owner",
      isManager: role === "owner" || role === "admin",
    };
  }, [role, settings]);
}

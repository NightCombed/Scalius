import { useAuth } from "@/contexts/AuthContext";

/** Returns the active store of the logged-in admin user, or null. */
export function useActiveStore() {
  const { memberships, activeStoreId } = useAuth();
  if (!memberships || memberships.length === 0) return null;

  if (activeStoreId) {
    const found = memberships.find(
      (m) => m.store.id === activeStoreId || m.store.slug === activeStoreId
    );
    if (found) return found.store;
  }

  return memberships[0]?.store ?? null;
}

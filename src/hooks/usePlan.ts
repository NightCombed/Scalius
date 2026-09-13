/**
 * usePlan — React hook to get the subscription plan of the active store.
 *
 * Reads the `plan` field that is already present in the `Store` object
 * returned by AuthContext's memberships (populated from `stores.plan`).
 * No additional query is needed because AuthContext already hydrates it.
 */
import { useMemo } from "react";
import { useActiveStore } from "@/hooks/useActiveStore";
import { hasFeature, type PlanFeature, type PlanId } from "@/lib/plan";

export interface UsePlanReturn {
  /** The plan of the active store. Defaults to 'profissional' while loading. */
  plan: PlanId;
  /** Convenience shortcut: true when plan === 'plus' */
  isPlus: boolean;
  /** @deprecated Use isPlus instead */
  isPro: boolean;
  /** Check if the active store's plan gives access to a specific feature */
  checkFeature: (feature: PlanFeature) => boolean;
}

/**
 * Returns the plan info for the currently active store.
 * Defaults to 'profissional' (most restrictive non-basico) when store is not yet loaded.
 */
export function usePlan(): UsePlanReturn {
  const store = useActiveStore();
  const plan: PlanId = store?.plan ?? "profissional";

  return useMemo<UsePlanReturn>(
    () => ({
      plan,
      isPlus: plan === "plus",
      isPro: plan === "plus", // backwards compat alias
      checkFeature: (feature: PlanFeature) => hasFeature(plan, feature),
    }),
    [plan],
  );
}


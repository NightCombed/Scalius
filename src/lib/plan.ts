/**
 * Scalius — Plan definitions and feature gates.
 *
 * The plan is stored on the `stores.plan` column and controlled exclusively
 * by platform super-admins. No automatic billing for now.
 *
 * Plans:
 *   - essencial: base plan — store-only emails, max 2 admin users, no ME label
 *   - pro:       full access — customer emails, unlimited users, ME 1-click label
 */

import type { PlanId } from "@/types/database";

export type { PlanId };

/**
 * All gated features that can be checked against a plan.
 */
export type PlanFeature =
  | "customer_emails"      // Emails automáticos para o cliente
  | "melhorenvio_label"    // Etiqueta Melhor Envio 1-clique
  | "unlimited_users"      // Usuários ilimitados no admin
  | "advanced_analytics";  // Aba Métricas completa e profissional

/** Human-readable labels for each feature (used in the ProGate component) */
export const PLAN_FEATURE_LABELS: Record<PlanFeature, { title: string; description: string }> = {
  customer_emails: {
    title: "E-mails automáticos para o cliente",
    description:
      "Envie confirmações e atualizações de pedido direto para o e-mail do cliente. Disponível no Plano Pro.",
  },
  melhorenvio_label: {
    title: "Etiqueta Melhor Envio 1-clique",
    description:
      "Gere e envie pedidos ao carrinho do Melhor Envio com um único clique. Disponível no Plano Pro.",
  },
  unlimited_users: {
    title: "Usuários ilimitados no admin",
    description:
      "Adicione quantos colaboradores precisar ao painel da loja. Disponível no Plano Pro.",
  },
  advanced_analytics: {
    title: "Métricas avançadas",
    description:
      "Acesse relatórios completos de faturamento, produtos, clientes e logística com gráficos interativos. Disponível no Plano Pro.",
  },
};

/**
 * Map of features available per plan.
 * Any feature NOT listed for a plan is considered blocked.
 */
const PLAN_ACCESS: Record<PlanId, Set<PlanFeature>> = {
  essencial: new Set([
    // customer_emails, melhorenvio_label, unlimited_users, and advanced_analytics are NOT here
  ]),
  pro: new Set([
    "customer_emails",
    "melhorenvio_label",
    "unlimited_users",
    "advanced_analytics",
  ]),
};

/**
 * Returns true if the given plan has access to the specified feature.
 */
export function hasFeature(plan: PlanId, feature: PlanFeature): boolean {
  return PLAN_ACCESS[plan]?.has(feature) ?? false;
}

/** Max admin users allowed per plan. Unlimited = Infinity */
export const MAX_USERS_BY_PLAN: Record<PlanId, number> = {
  essencial: 2,
  pro: Infinity,
};

/** Display name for each plan */
export const PLAN_LABEL: Record<PlanId, string> = {
  essencial: "Essencial",
  pro: "Pro",
};

/** Badge color classes for each plan (Tailwind) */
export const PLAN_BADGE_CLASSES: Record<PlanId, string> = {
  essencial:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

/**
 * Scalius — Plan definitions and feature gates.
 *
 * Plans (aligned with landing page names):
 *   - basico:       entry plan — 40 products, 1 admin, 1 session
 *   - profissional: mid plan  — unlimited products, 2 admins, 2 sessions, custom domain
 *   - plus:         top plan  — all features, unlimited admins/sessions, 1-click labels, emails
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
      "Envie confirmações e atualizações de pedido direto para o e-mail do cliente. Disponível no Plano Plus.",
  },
  melhorenvio_label: {
    title: "Etiqueta Melhor Envio 1-clique",
    description:
      "Gere e envie pedidos ao carrinho do Melhor Envio com um único clique. Disponível no Plano Plus.",
  },
  unlimited_users: {
    title: "Usuários ilimitados no admin",
    description:
      "Adicione quantos colaboradores precisar ao painel da loja. Disponível no Plano Plus.",
  },
  advanced_analytics: {
    title: "Métricas avançadas",
    description:
      "Acesse relatórios completos de faturamento, produtos, clientes e logística com gráficos interativos. Disponível no Plano Plus.",
  },
};

/**
 * Map of features available per plan.
 * Any feature NOT listed for a plan is considered blocked.
 */
const PLAN_ACCESS: Record<PlanId, Set<PlanFeature>> = {
  basico: new Set([
    // basico has no premium features
  ]),
  profissional: new Set([
    // profissional has no premium features (custom domain & portal handled by DB/infra)
  ]),
  plus: new Set([
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
  basico: 1,
  profissional: 2,
  plus: Infinity,
};

/** Display name for each plan */
export const PLAN_LABEL: Record<PlanId, string> = {
  basico: "Básico",
  profissional: "Profissional",
  plus: "Plus",
};

/** Badge color classes for each plan (Tailwind) */
export const PLAN_BADGE_CLASSES: Record<PlanId, string> = {
  basico:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  profissional:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  plus: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

/** Monthly price in cents for each plan (used for subscription checkout) */
export const PLAN_PRICE_CENTS: Record<PlanId, number> = {
  basico: 4700,
  profissional: 8900,
  plus: 15900,
};

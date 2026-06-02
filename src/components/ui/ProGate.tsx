/**
 * ProGate — Visual gate for Pro-only features.
 *
 * When the store's plan does not include a given feature, renders an
 * elegant locked state card instead of the children. When the plan
 * gives access, simply renders the children as-is.
 *
 * Usage:
 *   <ProGate feature="customer_emails" plan={plan}>
 *     <SomeProFeatureComponent />
 *   </ProGate>
 */
import type { ReactNode } from "react";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { hasFeature, PLAN_FEATURE_LABELS, type PlanFeature, type PlanId } from "@/lib/plan";
import { cn } from "@/lib/utils";

interface ProGateProps {
  /** The feature to gate */
  feature: PlanFeature;
  /** The current store plan */
  plan: PlanId;
  /** Content to render when access is granted */
  children: ReactNode;
  /** Optional extra CSS classes for the locked wrapper card */
  className?: string;
  /**
   * Visual variant of the gate.
   * - 'card'   — renders a full card (default, for section-level blocks)
   * - 'inline' — renders a smaller inline badge (for button-level blocks)
   */
  variant?: "card" | "inline";
}

export function ProGate({
  feature,
  plan,
  children,
  className,
  variant = "card",
}: ProGateProps) {
  // If the plan has the feature, just render children
  if (hasFeature(plan, feature)) {
    return <>{children}</>;
  }

  const { title, description } = PLAN_FEATURE_LABELS[feature];

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 text-sm w-full",
          className,
        )}
        title={`Recurso exclusivo do Plano Pro: ${title}`}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 shrink-0">
          <Lock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-violet-900 dark:text-violet-200 truncate block text-xs">
            {title}
          </span>
          <span className="text-[11px] text-violet-600/80 dark:text-violet-400/80">
            Exclusivo do Plano Pro
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full shrink-0">
          <Sparkles className="h-2.5 w-2.5" />
          Pro
        </span>
      </div>
    );
  }

  // Default: card variant
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border border-violet-200/80 dark:border-violet-800/50",
        className,
      )}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-purple-50/40 to-fuchsia-50/30 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/10 pointer-events-none" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7c3aed 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex flex-col items-center justify-center gap-4 p-8 text-center">
        {/* Icon container */}
        <div className="relative">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800/60 shadow-sm shadow-violet-200/50 dark:shadow-violet-900/30">
            <Lock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          {/* Sparkle badge */}
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm shadow-violet-400/40">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Pro badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-violet-400/30">
          <Sparkles className="h-3 w-3" />
          Plano Pro
        </div>

        {/* Title & description */}
        <div className="space-y-1.5 max-w-sm">
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <a
            href="mailto:suporte@scalius.com.br?subject=Upgrade%20para%20o%20Plano%20Pro"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold shadow-sm shadow-violet-400/30 transition-all duration-200 hover:shadow-md hover:shadow-violet-400/40 hover:-translate-y-0.5"
          >
            Fazer upgrade
            <ArrowRight className="h-4 w-4" />
          </a>
          <span className="text-xs text-muted-foreground">
            ou fale com o suporte
          </span>
        </div>
      </div>
    </div>
  );
}

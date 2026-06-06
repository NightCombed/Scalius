import type { ReactNode } from "react";
import { useStoreRole, type StorePermission } from "@/hooks/useStoreRole";
import { Lock, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  permission: StorePermission;
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * The variant to use for the unauthorized state display.
   * - 'card': A full card layout (e.g. for standalone pages or large sections)
   * - 'inline': A compact alert (e.g. for small widgets)
   * - 'overlay': An absolute glassmorphism overlay on top of blurred content
   */
  variant?: "card" | "inline" | "overlay";
}

export function RoleGuard({ permission, children, fallback, variant = "card" }: Props) {
  const { can, roleLabel } = useStoreRole();
  const hasPermission = can(permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50/50 border border-amber-200/60 rounded-lg dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300 backdrop-blur-sm"
      >
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Acesso Restrito ao {roleLabel || "Colaborador"}</span>
      </motion.div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/5 dark:bg-black/10 backdrop-blur-[2px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm p-6 bg-white/95 dark:bg-slate-950/95 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-900 rounded-xl"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 mb-3 border border-amber-100 dark:border-amber-900/40">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Recurso Bloqueado
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Como {roleLabel || "Colaborador"}, você não tem permissão para editar ou visualizar estas configurações.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 backdrop-blur-sm shadow-sm"
    >
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-4 shadow-inner">
        <Lock className="w-6 h-6" />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-slate-950"
        >
          !
        </motion.div>
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 justify-center">
        Acesso Restrito
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5">
        Seu cargo atual ({roleLabel || "Colaborador"}) não possui acesso a esta área. Solicite acesso ao Dono da loja se necessário.
      </p>
    </motion.div>
  );
}

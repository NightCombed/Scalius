import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { removeSessionById } from "@/lib/session-manager";
import { Laptop, Smartphone, LogOut, ShieldAlert, MonitorSmartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  storeId: string;
  plan: "essencial" | "pro";
}

export function ActiveSessionsSection({ storeId, plan }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentToken = localStorage.getItem("scalius_session_token");

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ["store-sessions", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_sessions")
        .select("*")
        .eq("store_id", storeId)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  const terminateMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await removeSessionById(sessionId);
    },
    onSuccess: () => {
      toast({
        title: "Sessão Encerrada",
        description: "O dispositivo foi desconectado com sucesso.",
      });
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["store-sessions", storeId] });
    },
    onError: (err) => {
      console.error(err);
      toast({
        title: "Erro ao Desconectar",
        description: "Não foi possível encerrar a sessão.",
        variant: "destructive",
      });
    },
  });

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes("ios") || info.includes("iphone") || info.includes("android") || info.includes("mobile")) {
      return <Smartphone className="w-5 h-5 text-slate-500" />;
    }
    return <Laptop className="w-5 h-5 text-slate-500" />;
  };

  const isCurrentDevice = (sessionToken: string) => {
    return currentToken === sessionToken;
  };

  const limit = plan === "essencial" ? 2 : Infinity;
  const count = sessions.length;
  const limitReached = count >= limit;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-primary" />
            Dispositivos Conectados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gerencie as sessões ativas que estão acessando o painel de controle da sua loja.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {count} / {limit === Infinity ? "Ilimitado" : limit} ativo(s)
          </span>
          {limitReached && plan === "essencial" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Limite atingido (Essencial)
            </span>
          )}
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40">
        <div className="divide-y divide-slate-100 dark:divide-slate-900">
          <AnimatePresence initial={false}>
            {sessions.map((session) => {
              const current = isCurrentDevice(session.session_token);
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                      {getDeviceIcon(session.device_info || "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {session.device_info || "Dispositivo Desconhecido"}
                        </span>
                        {current && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/40">
                            Este dispositivo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Atividade {formatDistanceToNow(new Date(session.last_seen_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {!current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => terminateMutation.mutate(session.id)}
                      disabled={terminateMutation.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Desconectar</span>
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {plan === "essencial" && limitReached && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Precisa de mais conexões?</strong> O plano Essencial limita a 2 dispositivos conectados simultaneamente. Para ter acessos ilimitados e cadastrar mais usuários, faça upgrade para o <strong>Plano Pro</strong>.
          </div>
        </div>
      )}
    </div>
  );
}

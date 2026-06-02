import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Store, Sparkles, Users, ShoppingBag, Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PLAN_LABEL, PLAN_BADGE_CLASSES, type PlanId } from "@/lib/plan";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: PlanId;
  created_at: string;
  _product_count?: number;
  _order_count?: number;
  _member_count?: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch all stores ────────────────────────────────────────────────────────
  const { data: stores = [], isLoading } = useQuery<StoreRow[]>({
    queryKey: ["super-admin-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, status, plan, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StoreRow[];
    },
  });

  // ── Fetch counts in a single join ───────────────────────────────────────────
  const { data: counts = {} } = useQuery<Record<string, { orders: number; members: number }>>({
    queryKey: ["super-admin-counts", stores.map((s) => s.id).join(",")],
    queryFn: async () => {
      if (stores.length === 0) return {};
      const storeIds = stores.map((s) => s.id);

      const [ordersRes, membersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("store_id")
          .in("store_id", storeIds),
        supabase
          .from("store_members")
          .select("store_id")
          .in("store_id", storeIds),
      ]);

      const result: Record<string, { orders: number; members: number }> = {};
      for (const sid of storeIds) {
        result[sid] = { orders: 0, members: 0 };
      }
      for (const row of ordersRes.data ?? []) {
        if (result[row.store_id]) result[row.store_id].orders++;
      }
      for (const row of membersRes.data ?? []) {
        if (result[row.store_id]) result[row.store_id].members++;
      }
      return result;
    },
    enabled: stores.length > 0,
  });

  // ── Mutation to update a store's plan ───────────────────────────────────────
  const updatePlan = useMutation({
    mutationFn: async ({ storeId, plan }: { storeId: string; plan: PlanId }) => {
      const { error } = await supabase
        .from("stores")
        .update({ plan } as any)
        .eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: (_, { plan }) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-stores"] });
      toast.success(`Plano atualizado para ${PLAN_LABEL[plan]}`);
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar plano", { description: err.message });
    },
  });

  // ── Status badge helper ─────────────────────────────────────────────────────
  const statusClass = (status: string) => {
    if (status === "active") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (status === "trial") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-muted text-muted-foreground";
  };

  const statusLabel: Record<string, string> = {
    active: "Ativa",
    trial: "Trial",
    suspended: "Suspensa",
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="font-serif text-3xl mb-1">Plataforma Scalius</h1>
        <p className="text-muted-foreground">
          Olá, <strong>{user?.full_name}</strong>. Gerencie todas as lojas e planos da plataforma.
        </p>
      </header>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Lojas totais", value: stores.length, icon: Store },
            { label: "Plano Pro", value: stores.filter((s) => s.plan === "pro").length, icon: Sparkles },
            { label: "Plano Essencial", value: stores.filter((s) => s.plan === "essencial").length, icon: Store },
            {
              label: "Total de pedidos",
              value: Object.values(counts).reduce((acc, c) => acc + c.orders, 0),
              icon: ShoppingBag,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-serif text-2xl">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Stores table ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
        <header className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-xl">Lojas</h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </header>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stores.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Nenhuma loja cadastrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 text-xs text-muted-foreground uppercase tracking-wider font-medium border-b border-border bg-muted/30">
              <span>Loja</span>
              <span>Status</span>
              <span>Plano</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Membros</span>
              <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Pedidos</span>
              <span>Ação</span>
            </div>

            {stores.map((store) => {
              const c = counts[store.id] ?? { orders: 0, members: 0 };
              const isPro = store.plan === "pro";

              return (
                <div
                  key={store.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Name / slug */}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{store.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {store.slug}.scalius.com.br
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(store.status)}`}
                    >
                      {statusLabel[store.status] ?? store.status}
                    </span>
                  </div>

                  {/* Plan badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${PLAN_BADGE_CLASSES[store.plan]}`}
                    >
                      {isPro && <Sparkles className="h-3 w-3" />}
                      {PLAN_LABEL[store.plan]}
                    </span>
                  </div>

                  {/* Members */}
                  <div className="text-sm">
                    <span className="text-muted-foreground md:hidden">Membros: </span>
                    {c.members}
                  </div>

                  {/* Orders */}
                  <div className="text-sm">
                    <span className="text-muted-foreground md:hidden">Pedidos: </span>
                    {c.orders}
                  </div>

                  {/* Plan change dropdown */}
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          disabled={updatePlan.isPending}
                        >
                          Mudar plano
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {(["essencial", "pro"] as PlanId[]).map((p) => (
                          <DropdownMenuItem
                            key={p}
                            onClick={() =>
                              updatePlan.mutate({ storeId: store.id, plan: p })
                            }
                            disabled={store.plan === p}
                            className="flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              {p === "pro" && <Sparkles className="h-3.5 w-3.5 text-violet-500" />}
                              {PLAN_LABEL[p]}
                            </span>
                            {store.plan === p && <Check className="h-3.5 w-3.5 text-primary" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Plan legend ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-soft">
        <h2 className="font-serif text-xl">Comparativo de planos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="pb-3 pr-6 font-medium">Feature</th>
                <th className="pb-3 px-4 font-medium text-center">Essencial</th>
                <th className="pb-3 px-4 font-medium text-center text-violet-600 dark:text-violet-400">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["E-mails automáticos para a loja", true, true],
                ["E-mails automáticos para o cliente", false, true],
                ["Etiqueta Melhor Envio 1-clique", false, true],
                ["Máximo de usuários admin", "2", "Ilimitado"],
                ["Sem limite de emails", true, true],
              ].map(([feature, essencial, pro]) => (
                <tr key={feature as string} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 pr-6 font-medium">{feature as string}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof essencial === "boolean" ? (
                      essencial ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )
                    ) : (
                      <span className="text-sm font-medium">{essencial}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof pro === "boolean" ? (
                      pro ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )
                    ) : (
                      <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

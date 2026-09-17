import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveStore } from "@/hooks/useActiveStore";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/mockData";
import { Clock, Package, ShoppingBag, Truck, CheckCircle2, TrendingUp, ArrowRight, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStoreRole } from "@/hooks/useStoreRole";

const STATUS_BADGE: Record<string, string> = {
  pending:          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  preparing:        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ready:            "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  out_for_delivery: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivered:        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  picked_up:        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled:        "bg-muted text-muted-foreground",
  confirmed:        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  canceled:         "bg-muted text-muted-foreground",
};

const PAYMENT_BADGE: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function getStatusLabel(status: string) {
  if (status === "confirmed") return "Em preparação";
  return ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL] || "Cancelado";
}

function getPaymentLabel(paymentStatus: string) {
  return paymentStatus === "paid" ? "Pago" : "Aguardando";
}


export default function AdminDashboard() {
  const store = useActiveStore();

  const { data: dashboardStats = { todayRevenue: 0, yesterdayRevenue: 0, todayOrders: 0, pending: 0 } } = useQuery({
    queryKey: ["admin-dashboard-stats", store?.id],
    queryFn: async () => {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      // Fetch today and yesterday's data
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("status, total_cents, created_at")
        .eq("store_id", store!.id)
        .gte("created_at", startOfYesterday.toISOString());

      if (ordersError) throw ordersError;

      // Fetch ALL-TIME pending orders (ignoring date filter)
      const { count: totalPending, error: pendingError } = await supabase
        .from("orders")
        .select("id", { count: 'exact', head: true })
        .eq("store_id", store!.id)
        .eq("status", "pending");

      if (pendingError) throw pendingError;

      const today = ordersData.filter(o => new Date(o.created_at) >= startOfToday);
      const yesterday = ordersData.filter(o => {
        const d = new Date(o.created_at);
        return d >= startOfYesterday && d < startOfToday;
      });

      return {
        todayRevenue: today.reduce((sum, o) => sum + o.total_cents, 0),
        yesterdayRevenue: yesterday.reduce((sum, o) => sum + o.total_cents, 0),
        todayOrders: today.length,
        pending: totalPending || 0,
      };
    },
    enabled: !!store?.id,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin-dashboard-recent", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, payment_status, delivery_type, total_cents, created_at")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: top = [] } = useQuery({
    queryKey: ["admin-dashboard-top-weekly", store?.id],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, line_total_cents")
        .eq("store_id", store!.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) throw error;
      
      const map = new Map<string, { product_id: string; product_name: string; quantity: number; revenue_cents: number }>();
      data.forEach(item => {
        const id = item.product_id || item.product_name;
        if (!map.has(id)) {
          map.set(id, { product_id: id, product_name: item.product_name, quantity: 0, revenue_cents: 0 });
        }
        const prod = map.get(id)!;
        prod.quantity += item.quantity;
        prod.revenue_cents += item.line_total_cents;
      });

      return Array.from(map.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
    enabled: !!store?.id,
  });

  const { data: stockInfo = { lowStock: 0, outOfStock: 0 } } = useQuery({
    queryKey: ["admin-dashboard-stock", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("stock_qty")
        .eq("store_id", store!.id);
      if (error) throw error;
      
      const lowStock = data.filter(p => p.stock_qty !== null && p.stock_qty > 0 && p.stock_qty < 5).length;
      const outOfStock = data.filter(p => p.stock_qty === 0).length;
      
      return { lowStock, outOfStock };
    },
    enabled: !!store?.id,
  });

  const { can } = useStoreRole();
  const showRevenue = can("view_revenue");

  if (!store) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Você ainda não está vinculado a nenhuma loja.</p>
      </div>
    );
  }

  const { todayRevenue, yesterdayRevenue, todayOrders, pending } = dashboardStats;
  
  const ticketMedio = todayOrders > 0 ? todayRevenue / todayOrders : 0;
  
  const growth = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : todayRevenue > 0 ? null : 0;

  const kpis = [
    { 
      label: "Vendas hoje", 
      value: showRevenue ? formatBRL(todayRevenue) : "R$ ••••", 
      icon: TrendingUp, 
      accent: "text-primary",
      comparison: showRevenue && growth !== null ? {
        value: `${growth > 0 ? "+" : ""}${growth.toFixed(0)}%`,
        trend: growth >= 0 ? "up" : "down"
      } : undefined
    },
    { label: "Pedidos hoje", value: todayOrders, icon: ShoppingBag, accent: "text-primary" },
    { label: "Ticket médio", value: showRevenue ? formatBRL(ticketMedio) : "R$ ••••", icon: TrendingUp, accent: "text-primary" },
    { label: "Pendentes", value: pending, icon: Clock, accent: "text-amber-600" },
  ];

  const stockKpis = [
    { label: "Estoque baixo", value: stockInfo.lowStock, icon: AlertTriangle, accent: "text-amber-600", filter: "low-stock" },
    { label: "Esgotados", value: stockInfo.outOfStock, icon: XCircle, accent: "text-red-600", filter: "out-of-stock" },
  ];

  return (
    <div className="space-y-5 md:space-y-8 max-w-6xl">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl mb-0.5">Visão geral</h1>
          <p className="text-muted-foreground text-sm">Acompanhe o desempenho de {store.name}.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/pedidos">
            Ver pedidos <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-soft active:scale-[0.98] transition-all duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.accent}`} />
              </div>
            </div>
            <div className="font-serif text-lg sm:text-xl">{s.value}</div>
            {s.comparison && (
              <div className={`text-[10px] sm:text-xs mt-1 flex items-center gap-0.5 ${
                s.comparison.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : 
                s.comparison.trend === "down" ? "text-red-600 dark:text-red-400" : 
                "text-muted-foreground"
              }`}>
                {s.comparison.value} {s.comparison.trend === "up" ? "↑" : s.comparison.trend === "down" ? "↓" : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      {stockKpis.some(s => s.value > 0) && (
        <div className={`grid gap-3 sm:gap-4 ${stockKpis.filter(s => s.value > 0).length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {stockKpis.filter(s => s.value > 0).map((s) => (
            <Link 
              key={s.label} 
              to={`/admin/produtos?filter=${s.filter}`}
              className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-soft hover:shadow-elegant active:scale-[0.98] transition-all flex items-center gap-3.5 group min-h-[44px]"
            >
              <div className={`p-2.5 sm:p-3 rounded-full bg-muted group-hover:scale-105 transition-transform shrink-0`}>
                <s.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${s.accent}`} />
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
                <div className="font-serif text-xl sm:text-2xl">{s.value}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="rounded-xl border border-border bg-card lg:col-span-2 overflow-hidden">
          <header className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-lg sm:text-xl">Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <div className="divide-y divide-border">
            {recent.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</div>
            )}
            {recent.map((o) => {
              return (
                <Link
                  key={o.id}
                  to={`/admin/pedidos/${o.id}`}
                  className="p-3.5 sm:p-4 block hover:bg-muted/40 active:bg-muted/60 transition-colors"
                >
                  {/* Mobile layout (< 768px) */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{o.customer_name ?? "Cliente"}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-medium text-sm text-foreground">{formatBRL(o.total_cents)}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-normal shrink-0", PAYMENT_BADGE[o.payment_status ?? "pending"])}>
                        {getPaymentLabel(o.payment_status ?? "pending")}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-normal shrink-0", STATUS_BADGE[o.status])}>
                        {getStatusLabel(o.status)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal shrink-0">
                        {o.delivery_type === "pickup" ? "Retirada" : "Entrega"}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-0.5">
                      <span>#{o.order_number || o.id.slice(-6).toUpperCase()}</span>
                      <span>{new Date(o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {/* Desktop layout (>= 768px) */}
                  <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium truncate">{o.customer_name ?? "Cliente"}</span>
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-normal shrink-0", PAYMENT_BADGE[o.payment_status ?? "pending"])}>
                          {getPaymentLabel(o.payment_status ?? "pending")}
                        </span>
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-normal shrink-0", STATUS_BADGE[o.status])}>
                          {getStatusLabel(o.status)}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal shrink-0">
                          {o.delivery_type === "pickup" ? "Retirada" : "Entrega"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        #{o.order_number || o.id.slice(-6).toUpperCase()} · {new Date(o.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="font-medium shrink-0 ml-4">{formatBRL(o.total_cents)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <header className="p-5 border-b border-border">
            <h2 className="font-serif text-xl">Mais vendidos esta semana</h2>
          </header>
          <div className="divide-y divide-border">
            {top.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Sem vendas ainda.</div>
            )}
            {top.map((row) => (
              <div key={row.product_id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{row.product_name ?? "Produto"}</div>
                  <div className="text-xs text-muted-foreground">{row.quantity} vendidos esta semana</div>
                </div>
                <div className="text-sm font-medium shrink-0 text-right">
                  <div>{showRevenue ? formatBRL(row.revenue_cents) : "R$ ••••"}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

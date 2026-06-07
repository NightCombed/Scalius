import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveStore } from "@/hooks/useActiveStore";
import { usePlan } from "@/hooks/usePlan";
import { formatBRL } from "@/lib/mockData";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Receipt,
  Lock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Truck,
  MapPin,
  Star,
  XCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899"];

const STATUS_PT: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Em Preparação",
  preparing: "Preparando",
  ready: "Pronto",
  out_for_delivery: "Saiu p/ entrega",
  delivered: "Entregue",
  picked_up: "Retirado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, accent = "text-primary", sub, trend, trendValue }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("p-2 rounded-xl bg-muted/60", accent.replace("text-", "bg-").replace("-600", "-100").replace("-500", "-100"))}>
          <Icon className={cn("h-4 w-4", accent)} />
        </div>
      </div>
      <div className="font-serif text-2xl">{value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
          {trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
          {trendValue && (
            <span className={cn("font-medium", trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-muted-foreground")}>
              {trendValue}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ElementType }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-xl flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

const CustomTooltipBRL = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-lg px-3 py-2 text-sm">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {typeof p.value === "number" && p.value > 100 ? formatBRL(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Pro Gate (Paywall) ───────────────────────────────────────────────────────

function ProGateAnalytics() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-16">
      {/* Decorative glow */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl scale-150" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-xl">
          <BarChart3 className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 shadow-md">
            <Lock className="h-3.5 w-3.5 text-amber-900" />
          </div>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1 mb-4">
        <Sparkles className="h-3.5 w-3.5" />
        Exclusivo Plano Pro
      </div>

      <h1 className="font-serif text-3xl mb-3 max-w-md">
        Métricas avançadas para escalar sua loja
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed mb-8">
        Acesse relatórios completos de faturamento, análise de produtos, comportamento de clientes e logística — com gráficos interativos e filtros por período.
      </p>

      {/* Feature list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md w-full mb-8 text-left">
        {[
          "Faturamento diário com gráfico de linha",
          "Top produtos por quantidade e receita",
          "Clientes únicos e taxa de recompra",
          "Distribuição por status dos pedidos",
          "Split entrega × retirada",
          "Top cidades e regiões de entrega",
          "Horários e dias de pico de vendas",
          "Taxa de conversão e cancelamento",
        ].map((feat) => (
          <div key={feat} className="flex items-center gap-2 text-sm text-foreground/80">
            <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span>{feat}</span>
          </div>
        ))}
      </div>

      <a
        href="mailto:contato@scalius.com.br?subject=Upgrade para o Plano Pro"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:shadow-violet-300/40 hover:scale-105 transition-all duration-200"
      >
        <Sparkles className="h-4 w-4" />
        Fazer upgrade para o Pro
      </a>

      <p className="text-xs text-muted-foreground mt-4">
        Entre em contato com o suporte Scalius para realizar o upgrade.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const store = useActiveStore();
  const { checkFeature } = usePlan();
  const hasAccess = checkFeature("advanced_analytics");

  const [period, setPeriod] = useState<Period>("30");

  // ── Data Queries ────────────────────────────────────────────────────────────

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [period]);

  const previousStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period) * 2);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [period]);

  const { data: orders = [] } = useQuery({
    queryKey: ["analytics-orders", store?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_cents, subtotal_cents, shipping_fee_cents, status, payment_status, delivery_type, created_at, shipping_region_name, delivery_zone_name, address_city, address_neighborhood, customer_id, customer_name")
        .eq("store_id", store!.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && hasAccess,
  });

  const { data: previousOrders = [] } = useQuery({
    queryKey: ["analytics-prev-orders", store?.id, period],
    queryFn: async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - parseInt(period));
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_cents, payment_status")
        .eq("store_id", store!.id)
        .gte("created_at", previousStartDate)
        .lt("created_at", endDate.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && hasAccess,
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["analytics-items", store?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, line_total_cents")
        .eq("store_id", store!.id)
        .gte("created_at", startDate);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && hasAccess,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["analytics-customers", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, created_at")
        .eq("store_id", store!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && hasAccess,
  });

  // ── Computed Metrics ────────────────────────────────────────────────────────

  const paidOrders = orders.filter(o => o.payment_status === "paid");
  const cancelledOrders = orders.filter(o => o.status === "cancelled" || o.status === "canceled");

  const totalRevenue = paidOrders.reduce((s, o) => s + o.total_cents, 0);
  const prevRevenue = previousOrders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total_cents, 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

  const totalOrders = orders.length;
  const prevOrders = previousOrders.length;
  const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : null;

  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

  const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

  const avgShipping = paidOrders.length > 0
    ? paidOrders.reduce((s, o) => s + (o.shipping_fee_cents ?? 0), 0) / paidOrders.length
    : 0;

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    // Pre-fill all days in period
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(key, 0);
    }
    paidOrders.forEach(o => {
      const key = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(key, (map.get(key) ?? 0) + o.total_cents);
    });
    return Array.from(map.entries()).map(([date, revenue]) => ({ date, "Faturamento": revenue }));
  }, [paidOrders, period]);

  // Orders by day of week
  const ordersByDayOfWeek = useMemo(() => {
    const counts = Array(7).fill(0);
    orders.forEach(o => {
      const day = new Date(o.created_at).getDay();
      counts[day]++;
    });
    return DAY_LABELS.map((name, i) => ({ name, "Pedidos": counts[i] }));
  }, [orders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const key = STATUS_PT[o.status] ?? o.status;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Delivery type split
  const deliverySplit = useMemo(() => {
    const delivery = orders.filter(o => o.delivery_type === "delivery").length;
    const pickup = orders.filter(o => o.delivery_type === "pickup").length;
    return [
      { name: "Entrega", value: delivery },
      { name: "Retirada", value: pickup },
    ].filter(d => d.value > 0);
  }, [orders]);

  // Top products by quantity
  const topProductsByQty = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    orderItems.forEach(item => {
      const key = item.product_id || item.product_name;
      if (!map.has(key)) map.set(key, { name: item.product_name, qty: 0, revenue: 0 });
      const p = map.get(key)!;
      p.qty += item.quantity;
      p.revenue += item.line_total_cents;
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [orderItems]);

  // Recurring customers
  const recurringCustomers = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      if (o.customer_id) map.set(o.customer_id, (map.get(o.customer_id) ?? 0) + 1);
    });
    const recurring = Array.from(map.values()).filter(c => c > 1).length;
    return { total: map.size, recurring };
  }, [orders]);

  // Top cities
  const topCities = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const city = o.address_city || o.address_neighborhood;
      if (city) map.set(city, (map.get(city) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [orders]);

  // Top regions
  const topRegions = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const region = o.shipping_region_name || o.delivery_zone_name;
      if (region) map.set(region, (map.get(region) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [orders]);

  // Orders by hour of day
  const ordersByHour = useMemo(() => {
    const counts = Array(24).fill(0);
    orders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      counts[hour]++;
    });
    return counts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}h`,
      Pedidos: count,
    }));
  }, [orders]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!store) {
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">Você não está vinculado a nenhuma loja.</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <ProGateAnalytics />;
  }

  const PERIOD_OPTIONS: { label: string; value: Period }[] = [
    { label: "7 dias", value: "7" },
    { label: "30 dias", value: "30" },
    { label: "90 dias", value: "90" },
  ];

  return (
    <div className="space-y-8 max-w-7xl pb-8">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold px-2.5 py-1 mb-2">
            <Sparkles className="h-3 w-3" />
            Plano Pro
          </div>
          <h1 className="font-serif text-2xl md:text-3xl mb-0.5">Métricas avançadas</h1>
          <p className="text-muted-foreground text-sm">Visão detalhada do desempenho de {store.name}.</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 self-start sm:self-auto">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                period === opt.value
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Seção 1: KPIs principais ── */}
      <section>
        <SectionTitle title="Visão financeira" subtitle={`Período: últimos ${period} dias`} icon={TrendingUp} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Faturamento"
            value={formatBRL(totalRevenue)}
            icon={TrendingUp}
            accent="text-violet-600"
            trend={revenueGrowth !== null ? (revenueGrowth >= 0 ? "up" : "down") : undefined}
            trendValue={revenueGrowth !== null ? `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth.toFixed(0)}% vs. período anterior` : undefined}
          />
          <KpiCard
            label="Total de pedidos"
            value={totalOrders}
            icon={ShoppingBag}
            accent="text-blue-600"
            trend={ordersGrowth !== null ? (ordersGrowth >= 0 ? "up" : "down") : undefined}
            trendValue={ordersGrowth !== null ? `${ordersGrowth > 0 ? "+" : ""}${ordersGrowth.toFixed(0)}% vs. período anterior` : undefined}
          />
          <KpiCard
            label="Ticket médio"
            value={formatBRL(avgTicket)}
            icon={Receipt}
            accent="text-emerald-600"
            sub="por pedido pago"
          />
          <KpiCard
            label="Clientes únicos"
            value={uniqueCustomers}
            icon={Users}
            accent="text-amber-600"
            sub="no período"
          />
        </div>
      </section>

      {/* ── Seção 2: Gráfico de faturamento ── */}
      <section>
        <ChartCard title="Faturamento diário (R$)">
          {revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={period === "7" ? 0 : period === "30" ? 4 : 9}
                />
                <YAxis
                  tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltipBRL />} />
                <Line
                  type="monotone"
                  dataKey="Faturamento"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              Sem dados de faturamento no período.
            </div>
          )}
        </ChartCard>
      </section>

      {/* ── Seção 3: Análise de Pedidos ── */}
      <section>
        <SectionTitle title="Análise de pedidos" icon={ShoppingBag} />

        {/* Métricas de taxa */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Conversão</span>
            </div>
            <div className="font-serif text-2xl">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">pedidos pagos / total</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Cancelamento</span>
            </div>
            <div className="font-serif text-2xl">{cancellationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">pedidos cancelados</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pendentes</span>
            </div>
            <div className="font-serif text-2xl">
              {orders.filter(o => o.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aguardando ação</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Frete médio</span>
            </div>
            <div className="font-serif text-2xl">{formatBRL(avgShipping)}</div>
            <p className="text-xs text-muted-foreground mt-1">por pedido pago</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pedidos por dia da semana */}
          <ChartCard title="Pedidos por dia da semana" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersByDayOfWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltipBRL />} />
                <Bar dataKey="Pedidos" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status dos pedidos */}
          <ChartCard title="Distribuição por status">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sem pedidos no período.
              </div>
            )}
          </ChartCard>
        </div>

        {/* Pedidos por hora do dia */}
        <ChartCard title="Horário de pico (pedidos por hora)" className="mt-6">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ordersByHour} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltipBRL />} />
              <Bar dataKey="Pedidos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ── Seção 4: Produtos ── */}
      <section>
        <SectionTitle title="Análise de produtos" subtitle="Com base em itens vendidos no período" icon={Package} />
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border bg-muted/30">
            <span className="col-span-1 text-xs font-semibold text-muted-foreground">#</span>
            <span className="col-span-5 text-xs font-semibold text-muted-foreground">Produto</span>
            <span className="col-span-3 text-xs font-semibold text-muted-foreground text-right">Qtd. vendida</span>
            <span className="col-span-3 text-xs font-semibold text-muted-foreground text-right">Receita</span>
          </div>
          {topProductsByQty.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum produto vendido no período.
            </div>
          )}
          {topProductsByQty.map((prod, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-12 gap-2 px-5 py-3.5 items-center",
                i < topProductsByQty.length - 1 && "border-b border-border"
              )}
            >
              <span className="col-span-1">
                {i === 0 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">1</span>
                ) : i === 1 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">2</span>
                ) : i === 2 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-600 text-xs font-bold">3</span>
                ) : (
                  <span className="text-xs text-muted-foreground pl-1.5">{i + 1}</span>
                )}
              </span>
              <div className="col-span-5">
                <p className="text-sm font-medium truncate">{prod.name}</p>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-semibold">{prod.qty}</span>
                <span className="text-xs text-muted-foreground ml-1">un.</span>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-semibold text-emerald-600">{formatBRL(prod.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Seção 5: Clientes ── */}
      <section>
        <SectionTitle title="Clientes" icon={Users} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métricas de clientes */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Únicos no período</span>
              </div>
              <div className="font-serif text-2xl">{uniqueCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">clientes distintos que compraram</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Recorrentes</span>
              </div>
              <div className="font-serif text-2xl">{recurringCustomers.recurring}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {recurringCustomers.total > 0
                  ? `${((recurringCustomers.recurring / recurringCustomers.total) * 100).toFixed(0)}% dos clientes identificados`
                  : "sem dados suficientes"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Base total</span>
              </div>
              <div className="font-serif text-2xl">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">clientes cadastrados</p>
            </div>
          </div>

          {/* Top cidades */}
          <div className="rounded-2xl border border-border bg-card shadow-soft lg:col-span-2">
            <div className="p-5 border-b border-border">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Top cidades / bairros
              </h3>
            </div>
            <div className="divide-y divide-border">
              {topCities.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Sem dados de localidade disponíveis.
                </div>
              )}
              {topCities.map((city, i) => {
                const maxCount = topCities[0]?.count ?? 1;
                const pct = (city.count / maxCount) * 100;
                return (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{city.name}</span>
                      <span className="text-sm text-muted-foreground">{city.count} pedidos</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção 6: Logística ── */}
      <section>
        <SectionTitle title="Logística" icon={Truck} />
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Split Entrega x Retirada */}
          <ChartCard title="Entrega × Retirada">
            {deliverySplit.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deliverySplit}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#06b6d4" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados no período.
              </div>
            )}
          </ChartCard>

          {/* Top regiões */}
          <div className="rounded-2xl border border-border bg-card shadow-soft lg:col-span-2">
            <div className="p-5 border-b border-border">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Regiões / zonas mais atendidas
              </h3>
            </div>
            <div className="divide-y divide-border">
              {topRegions.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Sem dados de regiões disponíveis.
                </div>
              )}
              {topRegions.map((region, i) => {
                const maxCount = topRegions[0]?.count ?? 1;
                const pct = (region.count / maxCount) * 100;
                return (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{region.name}</span>
                      <span className="text-sm text-muted-foreground">{region.count} pedidos</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logística extra: frete e receita por tipo de entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Frete médio</span>
            </div>
            <div className="font-serif text-2xl">{formatBRL(avgShipping)}</div>
            <p className="text-xs text-muted-foreground mt-1">por pedido com entrega paga</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pedidos delivery</span>
            </div>
            <div className="font-serif text-2xl">
              {orders.filter(o => o.delivery_type === "delivery").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">com entrega à domicílio</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pedidos retirada</span>
            </div>
            <div className="font-serif text-2xl">
              {orders.filter(o => o.delivery_type === "pickup").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">retirada no local</p>
          </div>
        </div>
      </section>
    </div>
  );
}

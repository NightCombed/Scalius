import { useEffect, useState, useRef, useMemo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, ExternalLink, LayoutDashboard, Package, ShoppingBag, Truck,
  Settings, Menu, X, Tag, Users, Flower2, BarChart3, Lock, Sun, Moon,
  Handshake, Store, ChevronDown, ArrowRight, Video, Sparkles, Check
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useActiveStore } from "@/hooks/useActiveStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useStoreRole } from "@/hooks/useStoreRole";
import { usePlan } from "@/hooks/usePlan";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag },
  { title: "Métricas", url: "/admin/metricas", icon: BarChart3 },
  { title: "Config.", url: "/admin/configuracoes", icon: Settings },
];
// ─── Alerts System ────────────────────────────────────────────────────────

function playSaleAlertSound(volume: "baixo" | "normal" | "alto" = "normal") {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Uma onda mais aguda e "vibrante" para chamar atenção
    osc.type = "square";
    
    const now = ctx.currentTime;
    const gainLevels = {
      baixo: 0.03,
      normal: 0.15,
      alto: 0.35,
    };
    const maxGain = gainLevels[volume] ?? 0.15;

    // Tocar 4 notas rápidas e vibrantes
    [0, 0.15, 0.3, 0.45].forEach((delay, i) => {
      osc.frequency.setValueAtTime(880 + (i * 110), now + delay);
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(maxGain, now + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);
    });
    
    osc.start(now);
    osc.stop(now + 0.6);
  } catch (err) {
    console.error("Audio play failed:", err);
  }
}

function isCurrentTimeInSilentHours(start: string, end: string): boolean {
  if (!start || !end) return false;
  
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
    return false;
  }
  
  const startTimeInMinutes = startH * 60 + startM;
  const endTimeInMinutes = endH * 60 + endM;

  if (startTimeInMinutes === endTimeInMinutes) {
    return false;
  }

  if (startTimeInMinutes < endTimeInMinutes) {
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
  } else {
    return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
  }
}



const DEMO_STORE_SLUGS = ["auroramoda", "floricultura-das-flores", "elena-cosmeticos"];

const DEMO_METADATA: Record<string, { label: string; badge: string; desc: string; icon: string }> = {
  "auroramoda": {
    label: "Aurora Moda",
    badge: "Moda & Vestuário",
    desc: "10 produtos · Variações P, M, G, GG e fotos reais",
    icon: "👗",
  },
  "floricultura-das-flores": {
    label: "Floricultura das Flores",
    badge: "Flores & Presentes",
    desc: "9 produtos · Arranjos, buquês e frete de entrega local",
    icon: "🌸",
  },
  "elena-cosmeticos": {
    label: "Elena Cosméticos",
    badge: "Cosméticos & Beleza",
    desc: "6 produtos · Skincare, carrinho e produtos em destaque",
    icon: "✨",
  },
};

export default function AdminLayout() {
  const { user, memberships, signOut, isSuperAdmin, isAffiliate, setActiveStoreId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeStore = useActiveStore();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAffiliateChoiceModal, setShowAffiliateChoiceModal] = useState<boolean>(false);
  const { can, roleLabel, roleBadgeClasses } = useStoreRole();
  const { isPro } = usePlan();
  const { theme, toggleTheme } = useTheme();

  const ownStore = useMemo(() => {
    return memberships.find((m) => !DEMO_STORE_SLUGS.includes(m.store.slug));
  }, [memberships]);

  const demoMemberships = useMemo(() => {
    return memberships.filter((m) => DEMO_STORE_SLUGS.includes(m.store.slug));
  }, [memberships]);

  const demoStoresList = useMemo(() => {
    return DEMO_STORE_SLUGS.map((slug) => {
      const member = demoMemberships.find((m) => m.store.slug === slug);
      const meta = DEMO_METADATA[slug];
      return {
        slug,
        name: member?.store.name ?? meta.label,
        storeId: member?.store.id ?? null,
        badge: meta.badge,
        desc: meta.desc,
        icon: meta.icon,
        isMember: !!member,
      };
    });
  }, [demoMemberships]);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-layout-pending-orders", activeStore?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", activeStore!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!activeStore?.id,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (isAffiliate) {
      setShowAffiliateChoiceModal(true);
    }
  }, [isAffiliate]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.classList.remove("dark");
    };
  }, [theme]);

  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerVisualAlert = (storeName: string) => {
    if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
    
    let toggle = false;
    const originalTitle = document.title;
    
    let overlay = document.getElementById("sale-flash-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sale-flash-overlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "999999";
      overlay.style.pointerEvents = "none";
      overlay.style.transition = "background-color 0.1s ease-in-out";
      document.body.appendChild(overlay);
    }
    
    flashIntervalRef.current = setInterval(() => {
      document.title = toggle ? "💰 NOVA VENDA! 💰" : originalTitle;
      if (overlay) {
        overlay.style.backgroundColor = toggle ? "rgba(0, 0, 0, 0.85)" : "transparent";
      }
      toggle = !toggle;
    }, 400);

    const stopFlashing = () => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
        document.title = `${storeName} | Painel Admin | Scalius`;
      }
      const existingOverlay = document.getElementById("sale-flash-overlay");
      if (existingOverlay) {
        existingOverlay.style.backgroundColor = "transparent";
        setTimeout(() => existingOverlay.remove(), 200);
      }
      window.removeEventListener("click", stopFlashing);
      window.removeEventListener("keydown", stopFlashing);
    };

    window.addEventListener("click", stopFlashing);
    window.addEventListener("keydown", stopFlashing);
  };

  const { data: settings } = useStoreSettings(activeStore?.id);

  useEffect(() => {
    const storeName = settings?.display_name || activeStore?.name || "Admin";
    document.title = `${storeName} | Painel Admin | Scalius`;
  }, [settings?.display_name, activeStore?.name]);

  useEffect(() => {
    if (!settings) return;
    const primary = settings.brand_color;
    const secondary = settings.secondary_color;
    const root = document.documentElement;
    if (primary) {
      root.style.setProperty("--primary", primary);
      root.style.setProperty("--ring", primary);
      root.style.setProperty("--sidebar-primary", primary);
    }
    if (secondary) {
      root.style.setProperty("--accent", secondary);
    }
    const fontMap: Record<string, string> = {
      'fraunces':    '"Fraunces", Georgia, serif',
      'reddit-sans': '"Reddit Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'poppins':     '"Poppins", sans-serif',
      'lato':        '"Lato", sans-serif',
      'playfair':    '"Playfair Display", serif',
      'inter':       '"Inter", sans-serif',
      'open-sans':   '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    };
    const fontKey = settings?.store_font || 'poppins';
    const fontFamily = fontMap[fontKey] ?? '"Poppins", sans-serif';
    root.style.setProperty('--store-font-family', fontFamily);
    root.setAttribute('data-store-font', fontKey);
    return () => {
      root.style.removeProperty('--store-font-family');
      root.removeAttribute('data-store-font');
    };
  }, [settings]);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // ── Real-time Push Notifications ──────────────────────────────────────────
  useEffect(() => {
    if (!activeStore?.id || !settings) return;
    
    // BUG-009: Only subscribe if push notifications or sound/visual alerts are active
    const hasChannelActive =
      settings.notif_push_new_order ||
      settings.notif_push_payment_confirmed ||
      settings.notif_push_status_change ||
      settings.sound_enabled !== false;

    if (!hasChannelActive) return;

    const channel = supabase
      .channel(`admin-notifications-${activeStore.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${activeStore.id}`,
        },
        (payload) => {
          const order = payload.new as any;
          const oldOrder = payload.old as any;
          const orderNum = order.order_number || order.id.slice(-6).toUpperCase();
          const isManual = settings.payment_provider === "manual";
          const isAutomatic = !isManual;
          
          const notify = (title: string, body: string) => {
            if (Notification.permission !== "granted") return;
            const n = new Notification(title, { body, icon: "/favicon.ico" });
            n.onclick = () => {
              window.focus();
              window.location.href = `/admin/pedidos/${order.id}`;
            };
          };

          // BUG-006: Only notify new order on INSERT if it's manual (automatic gets notified on paid)
          if (payload.eventType === "INSERT" && settings.notif_push_new_order && isManual) {
            notify("Novo Pedido! 🛍️", `O pedido #${orderNum} acaba de chegar!`);
          }

          // BUG-006: Notify on UPDATE (or INSERT) when payment status turns to paid for automatic gateways
          const isPaidUpdate = payload.eventType === "UPDATE" && order.payment_status === "paid" && oldOrder?.payment_status !== "paid";
          const isPaidInsert = payload.eventType === "INSERT" && order.payment_status === "paid" && isAutomatic;

          if ((isPaidUpdate || isPaidInsert) && settings.notif_push_payment_confirmed) {
            const gatewayLabel = settings.payment_provider === "mercadopago" ? "Mercado Pago" : "InfinitePay";
            notify(
              isAutomatic ? "Pagamento confirmado! Novo pedido 🛍️💰" : "Pagamento Confirmado! 💰",
              isAutomatic
                ? `O pedido #${orderNum} foi pago via ${gatewayLabel}. Já pode preparar!`
                : `O pagamento do pedido #${orderNum} foi confirmado.`,
            );
          }

          if (payload.eventType === "UPDATE" && order.status !== oldOrder?.status && settings.notif_push_status_change) {
            notify("Status Atualizado! 📋", `O pedido #${orderNum} agora está: ${order.status}`);
          }

          // ── Alerts Logic (Sound and Tab Flash) ──
          const isNewManualOrder = isManual && payload.eventType === "INSERT";
          const isAutomaticUpdatePaid = !isManual && payload.eventType === "UPDATE" && order.payment_status === "paid" && oldOrder?.payment_status !== "paid";
          const isAutomaticInsertPaid = !isManual && payload.eventType === "INSERT" && order.payment_status === "paid";
          
          if (isNewManualOrder || isAutomaticUpdatePaid || isAutomaticInsertPaid) {
            const isSilent = settings.silent_hours_enabled &&
              settings.silent_hours_start &&
              settings.silent_hours_end &&
              isCurrentTimeInSilentHours(settings.silent_hours_start, settings.silent_hours_end);

            if (settings.sound_enabled !== false && !isSilent) {
              playSaleAlertSound(settings.sound_volume);
            }
            triggerVisualAlert(settings.display_name || activeStore?.name || "Admin");
          }
        }
      )
      .subscribe();

    // BUG-007: Clean up channel, flashIntervalRef, and visual overlay on unmount
    return () => { 
      supabase.removeChannel(channel); 
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
      }
      const existingOverlay = document.getElementById("sale-flash-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }
    };
  }, [activeStore?.id, settings]);

  return (
    <div className="store-admin min-h-screen flex w-full bg-background text-foreground" data-store-font={settings?.store_font || 'fraunces'}>
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <div className="hidden md:block">
        <SidebarProvider>
          <AdminSidebar />
        </SidebarProvider>
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer Panel ── */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 z-50 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain dark:brightness-0 dark:invert" />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Store info */}
        {activeStore && (
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="text-sm font-semibold truncate">{activeStore.name}</div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { title: "Visão geral", url: "/admin", icon: LayoutDashboard, end: true },
            { title: "Produtos", url: "/admin/produtos", icon: Package },
            { title: "Categorias", url: "/admin/categorias", icon: Tag },
            { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag, badge: pendingCount },
            { title: "Entregas e frete", url: "/admin/entregas", icon: Truck },
            { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
          ].map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-[0.98] min-h-[44px]"
              activeClassName="bg-primary/10 text-primary"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span className="bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Métricas Pro */}
          <NavLink
            to="/admin/metricas"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px]"
            activeClassName="bg-primary/10 text-primary"
          >
            <div className="relative">
              <BarChart3 className="h-5 w-5 shrink-0" />
              {!isPro && <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-500" />}
            </div>
            <span className="flex items-center gap-1.5">
              Métricas
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none ${
                isPro
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}>Pro</span>
            </span>
          </NavLink>
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {roleLabel && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 mb-2 bg-muted/50 dark:bg-slate-900/60 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cargo:</span>
              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${roleBadgeClasses}`}>
                {roleLabel}
              </span>
            </div>
          )}
          {activeStore && (
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link to={`/loja/${activeStore.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" /> Ver loja
              </Link>
            </Button>
          )}
          {isSuperAdmin && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/super-admin">Super admin</Link>
            </Button>
          )}
          {isAffiliate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDrawerOpen(false);
                navigate("/affiliate");
              }}
              className="w-full gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 font-medium"
            >
              <Handshake className="h-4 w-4" /> Painel de Afiliado
            </Button>
          )}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs text-muted-foreground truncate">{user?.full_name ?? user?.email}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                className="h-8 w-8"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sair" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ── Top Header ── */}
        <header className="h-14 bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 border-b border-border/50 relative">
          {/* Mobile left side: hamburger icon + logo if affiliate */}
          <div className="flex items-center gap-1.5 md:hidden z-10">
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors -ml-1 min-w-[40px] min-h-[40px] flex items-center justify-center"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {isAffiliate && (
              <img src="/scalius-logo-dark.png" alt="Scalius" className="h-6 object-contain dark:brightness-0 dark:invert" />
            )}
          </div>

          {/* Logo — mobile only (when NOT affiliate), PERFECT TRUE CENTER */}
          {!isAffiliate && (
            <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain dark:brightness-0 dark:invert" />
            </div>
          )}

          {/* Desktop: store name or Switcher */}
          <div className="hidden md:flex flex-1 min-w-0 items-center gap-2">
            {isAffiliate || memberships.length > 1 ? (
              <button
                type="button"
                onClick={() => setShowAffiliateChoiceModal(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/70 hover:border-primary/50 bg-card hover:bg-accent text-left transition-all group shadow-xs cursor-pointer max-w-md"
                title="Clique para alternar entre sua loja e os modelos de demonstração para gravação"
              >
                <Store className="h-4 w-4 text-primary shrink-0 group-hover:scale-105 transition-transform" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate max-w-[180px]">
                    {activeStore?.name ?? "Selecionar Loja"}
                  </span>
                  {activeStore && DEMO_STORE_SLUGS.includes(activeStore.slug) ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      🎬 Modelo Demo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold text-muted-foreground">
                      Sua Loja
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-semibold text-primary ml-1 flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                  <span>Trocar</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </button>
            ) : (
              <div className="text-sm font-medium truncate">{activeStore?.name ?? "Painel"}</div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto z-10">
            {/* Mobile Switcher Button */}
            {(isAffiliate || memberships.length > 1) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAffiliateChoiceModal(true)}
                className="flex items-center gap-1 border-border/80 text-foreground hover:bg-muted text-xs px-2 h-8 font-medium md:hidden"
                title="Trocar Loja ou Modelo"
              >
                <Store className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold truncate max-w-[80px]">{activeStore?.name}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
            {activeStore && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex gap-1.5">
                <Link to={`/loja/${activeStore.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden lg:inline">Ver loja</span>
                </Link>
              </Button>
            )}
            {isSuperAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link to="/super-admin">Super admin</Link>
              </Button>
            )}
            {isAffiliate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/affiliate")}
                className="flex items-center gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20 text-xs px-2.5 h-8 sm:h-9 font-medium"
              >
                <Handshake className="h-4 w-4 shrink-0" />
                <span className="text-xs">Painel Afiliado</span>
              </Button>
            )}
            <span className="hidden lg:block text-sm text-muted-foreground px-2">{user?.full_name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              className="min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut()}
              aria-label="Sair"
              className="min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-4 md:p-6 animate-fade-in pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border md:hidden pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1 px-1 shadow-lg">
          <div className="flex items-stretch h-14">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.end}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground transition-all active:scale-95 min-h-[44px] px-1 relative"
                activeClassName="text-primary"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.url === "/admin/pedidos" && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none shadow-sm animate-pulse">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.title}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Modal de Escolha para Contas Afiliadas ao Entrar no Admin ── */}
      <Dialog open={showAffiliateChoiceModal} onOpenChange={setShowAffiliateChoiceModal}>
        <DialogContent className="affiliate-choice-modal sm:max-w-xl p-5 sm:p-6 border border-border/80 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto">
          <style>{`
            .affiliate-choice-modal,
            .affiliate-choice-modal *,
            .affiliate-choice-modal h1,
            .affiliate-choice-modal h2,
            .affiliate-choice-modal h3,
            .affiliate-choice-modal h4,
            .affiliate-choice-modal p,
            .affiliate-choice-modal span,
            .affiliate-choice-modal button,
            .affiliate-choice-modal div {
              font-family: "Reddit Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
          `}</style>
          <DialogHeader className="text-center sm:text-center space-y-2 pb-1">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-1 shadow-xs">
              <Handshake className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-center font-sans">
              Onde você deseja entrar?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-center max-w-md mx-auto">
              Sua conta de parceiro possui acesso ao Painel de Afiliado, à sua loja própria e aos 3 modelos de demonstração para gravação de vídeos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Opções Principais: Painel do Afiliado e Sua Loja */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção 1: Painel de Afiliado */}
              <button
                type="button"
                onClick={() => {
                  setShowAffiliateChoiceModal(false);
                  navigate("/affiliate");
                }}
                className="flex items-start gap-3.5 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5 shadow-xs">
                  <Handshake className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-sm text-purple-900 dark:text-purple-200 group-hover:text-purple-700 transition-colors">
                    Painel do Afiliado
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    Comissões, saldo a receber, link de indicação e cupons.
                  </div>
                </div>
              </button>

              {/* Opção 2: Entrar na Sua Loja Principal */}
              {ownStore ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStoreId(ownStore.store.id);
                    setShowAffiliateChoiceModal(false);
                    queryClient.invalidateQueries();
                    toast.success(`Abrindo sua loja: ${ownStore.store.name}`);
                  }}
                  className={cn(
                    "flex items-start gap-3.5 p-4 rounded-2xl border text-left group cursor-pointer transition-all shadow-xs",
                    activeStore?.id === ownStore.store.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                      : "border-border hover:border-primary bg-card hover:bg-primary/5"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span className="truncate">{ownStore.store.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">Sua Loja</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      Gerenciar produtos e configurações do seu negócio.
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAffiliateChoiceModal(false)}
                  className="flex items-start gap-3.5 p-4 rounded-2xl border border-border hover:border-primary bg-card hover:bg-primary/5 transition-all text-left group cursor-pointer shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      Entrar na Loja
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      Gerenciar produtos e configurações da loja atual.
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Separador e Seção dos Modelos de Demonstração */}
            <div className="pt-3 border-t border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#FF5E00]" />
                  Modelos de Loja para Gravação de Vídeo
                </span>
                <span className="text-[11px] text-[#FF5E00] font-bold bg-[#FFF4EE] dark:bg-[#FF5E00]/10 px-2.5 py-0.5 rounded-full border border-[#FF5E00]/30">
                  Lojas Demo Oficiais
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escolha um modelo pronto abaixo para entrar diretamente no painel administrativo dele com produtos reais cadastrados, ideal para você gravar tutoriais e demonstrações:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {demoStoresList.map((demo) => {
                  const isSelected = activeStore?.slug === demo.slug;
                  return (
                    <button
                      key={demo.slug}
                      type="button"
                      disabled={!demo.storeId}
                      onClick={() => {
                        if (!demo.storeId) return;
                        setActiveStoreId(demo.storeId);
                        setShowAffiliateChoiceModal(false);
                        queryClient.invalidateQueries();
                        toast.success(`Abrindo modelo: ${demo.name}`);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-left transition-all group shadow-xs",
                        demo.storeId ? "cursor-pointer" : "opacity-60 cursor-not-allowed",
                        isSelected
                          ? "border-[#FF5E00] bg-[#FFF4EE]/70 dark:bg-[#FF5E00]/10 ring-1 ring-[#FF5E00]"
                          : "border-border/80 hover:border-[#FF5E00]/60 bg-card hover:bg-[#FFF4EE]/20 dark:hover:bg-zinc-800/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center text-2xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          {demo.icon}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground group-hover:text-[#FF5E00] transition-colors">
                              {demo.name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold bg-muted">
                              {demo.badge}
                            </Badge>
                            {isSelected && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-[#FF5E00] hover:bg-[#FF5E00] text-white font-bold border-0">
                                Ativa no Painel
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {demo.desc}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 pl-2">
                        <span className="text-xs font-bold text-[#FF5E00] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          {isSelected ? "Em uso" : "Abrir Modelo"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground/80 text-center pt-1">
                💡 Você pode alternar entre seus modelos ou voltar para sua loja a qualquer momento clicando no botão de loja no topo do painel.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Truck, Settings, BarChart3, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useStoreRole } from "@/hooks/useStoreRole";
import { usePlan } from "@/hooks/usePlan";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_GROUPS = [
  {
    id: "overview",
    label: "Geral",
    items: [
      { title: "Visão geral", url: "/admin", icon: LayoutDashboard, end: true },
    ]
  },
  {
    id: "catalog_orders",
    label: "Vendas",
    items: [
      { title: "Produtos", url: "/admin/produtos", icon: Package },
      { title: "Categorias", url: "/admin/categorias", icon: Tag },
      { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag },
    ]
  },
  {
    id: "logistics_settings",
    label: "Gestão & Loja",
    items: [
      { title: "Entregas e frete", url: "/admin/entregas", icon: Truck },
      { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
    ]
  }
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { roleLabel, roleBadgeClasses } = useStoreRole();
  const { isPro } = usePlan();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-none pb-0">
        <div className="flex items-center gap-2 pl-4 pr-2 pt-4 pb-2">
          {collapsed ? (
            <img src="/scalius-icon.png" alt="Scalius" className="h-8 w-8 object-contain" />
          ) : (
            <img src="/scalius-logo-dark.png" alt="Scalius" className="h-7 object-contain dark:brightness-0 dark:invert" />
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-1 gap-0">
        {NAV_GROUPS.map((group, index) => (
          <SidebarGroup key={group.id} className="p-0">
            {index > 0 && (
              <div className="px-3 mt-2 mb-1">
                <Separator className="bg-border/50" />
              </div>
            )}
            {!collapsed && group.label && (
              <SidebarGroupLabel className="px-3.5 h-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1 mb-0.5">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild className="h-9 text-[14px] font-medium transition-all duration-200">
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className="hover:bg-sidebar-accent flex items-center gap-3 px-3.5 rounded-lg"
                        activeClassName="bg-sidebar-accent text-primary font-semibold shadow-xs"
                      >
                        <item.icon className="h-[17px] w-[17px] shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ── Grupo: Métricas / Análise ── */}
        <SidebarGroup className="p-0">
          <div className="px-3 mt-2 mb-1">
            <Separator className="bg-border/50" />
          </div>
          {!collapsed && (
            <SidebarGroupLabel className="px-3.5 h-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1 mb-0.5">
              Análise
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {isPro ? (
                  <SidebarMenuButton asChild className="h-9 text-[14px] font-medium transition-all duration-200">
                    <NavLink
                      to="/admin/metricas"
                      className="hover:bg-sidebar-accent flex items-center gap-3 px-3.5 rounded-lg"
                      activeClassName="bg-sidebar-accent text-primary font-semibold shadow-xs"
                    >
                      <BarChart3 className="h-[17px] w-[17px] shrink-0" />
                      {!collapsed && (
                        <span className="flex items-center gap-1.5">
                          Métricas
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 leading-none">
                            Pro
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavLink
                        to="/admin/metricas"
                        className="h-9 text-[14px] font-medium flex items-center gap-3 px-3.5 rounded-md text-muted-foreground/60 hover:bg-sidebar-accent hover:text-muted-foreground transition-all duration-200"
                        activeClassName="bg-sidebar-accent"
                      >
                        <div className="relative">
                          <BarChart3 className="h-[17px] w-[17px] shrink-0" />
                          <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-500" />
                        </div>
                        {!collapsed && (
                          <span className="flex items-center gap-1.5">
                            Métricas
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 leading-none">
                              Pro
                            </span>
                          </span>
                        )}
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      Disponível no Plano Pro
                    </TooltipContent>
                  </Tooltip>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 dark:border-slate-800/60 p-4">
        {collapsed ? (
          <div className="flex justify-center text-slate-400">
            <Users className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/45">
              Seu Cargo
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeClasses}`}>
                {roleLabel || "Carregando..."}
              </span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}


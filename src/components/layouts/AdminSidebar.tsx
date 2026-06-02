import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Truck, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Flower2 } from "lucide-react";

const items = [
  { title: "Visão geral", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Categorias", url: "/admin/categorias", icon: Tag },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag },
  { title: "Entregas e frete", url: "/admin/entregas", icon: Truck },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-none pb-0">
        <div className="flex items-center gap-2 pl-4 pr-2 pt-4 pb-1">
          {collapsed ? (
            <img src="/scalius-icon.png" alt="Scalius" className="h-8 w-8 object-contain" />
          ) : (
            <img src="/scalius-logo-dark.png" alt="Scalius Vitrine" className="h-7 object-contain" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-1">
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
              Loja
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="h-10 text-[15px] font-medium transition-all duration-200">
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-sidebar-accent flex items-center gap-3 px-3.5"
                      activeClassName="bg-sidebar-accent text-primary font-semibold"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

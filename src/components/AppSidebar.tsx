import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  DollarSign, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  FileBarChart,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyPagePermissions } from "@/hooks/usePagePermissions";
import { ROUTE_TO_PERMISSION } from "@/lib/pagePermissions";
import logoBZ from "@/assets/logo-bz-new.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  label: string;
  icon: any;
  url?: string;
  badge?: number;
  submenu?: {
    title: string;
    url: string;
    badge?: number;
  }[];
}

const menuItems: MenuItem[] = [
  { 
    title: "Analises", 
    label: "Painel B&Z",
    url: "/dashboard", 
    icon: LayoutDashboard 
  },
  {
    title: "GestaoVendas",
    label: "Gestão de Vendas",
    icon: TrendingUp,
    submenu: [
      { title: "Leads", url: "/dashboard/leads" },
      { title: "Contatos", url: "/dashboard/leads/contatos" },
      { title: "Marketing", url: "/dashboard/vendas/meta-ads" },
      { title: "Atendimento", url: "/dashboard/atendimento" },
    ]
  },
  {
    title: "Clientes",
    label: "Gestão de Clientes",
    icon: Users,
    submenu: [
      { title: "Clientes", url: "/dashboard/clientes" },
      { title: "Documentos", url: "/dashboard/documentos" },
    ]
  },
  {
    title: "Rotinas",
    label: "Gestão de Rotinas",
    icon: Scale,
    submenu: [
      { title: "Processos", url: "/dashboard/processos" },
      { title: "Tarefas", url: "/dashboard/processos/demandas" },
    ]
  },
  {
    title: "Financeiro",
    label: "Financeiro",
    icon: DollarSign,
    submenu: [
      { title: "Gestão Financeira", url: "/dashboard/financeiro" },
      { title: "Pagamentos", url: "/dashboard/financeiro/pagamentos" },
      { title: "Histórico", url: "/dashboard/financeiro/historico" },
    ]
  },
  {
    title: "Relatorios",
    label: "Relatórios",
    icon: FileBarChart,
    submenu: [
      { title: "Vendas", url: "/dashboard/vendas/relatorios" },
      { title: "Financeiro", url: "/dashboard/financeiro/relatorios" },
    ]
  },
  {
    title: "Administrativo",
    label: "Administrativo",
    icon: Settings,
    submenu: [
      { title: "Cadastros", url: "/dashboard/configuracoes/cadastros" },
      { title: "Modelos", url: "/dashboard/configuracoes/modelos" },
      { title: "Controle", url: "/dashboard/configuracoes/controle" },
    ]
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  // Filtra itens do menu pelas permissoes do usuario logado.
  // Admin sempre ve tudo (o hook retorna todas as chaves).
  const { data: permissoes } = useMyPagePermissions();
  const podeVerRota = (url: string): boolean => {
    const chave = ROUTE_TO_PERMISSION[url];
    if (!chave) return true; // rotas sem mapeamento ficam abertas
    return (permissoes ?? []).some((p: any) => p.page_key === chave && p.can_access);
  };

  const visibleMenuItems = menuItems
    .map((item) => {
      if (!item.submenu) {
        if (item.url && !podeVerRota(item.url)) return null;
        return item;
      }
      const subVisivel = item.submenu.filter((sub) => podeVerRota(sub.url));
      if (subVisivel.length === 0) return null;
      return { ...item, submenu: subVisivel };
    })
    .filter((x): x is MenuItem => x !== null);

  const activeGroup = visibleMenuItems.find(item =>
    item.submenu?.some(sub => location.pathname.startsWith(sub.url))
  )?.title;


  const [openMenus, setOpenMenus] = useState<string[]>(
    () => {
      const initial = menuItems.find(item =>
        item.submenu?.some(sub => location.pathname.startsWith(sub.url))
      )?.title;
      return initial ? [initial] : [];
    }
  );

  useEffect(() => {
    if (activeGroup && !openMenus.includes(activeGroup)) {
      setOpenMenus(prev => [...prev, activeGroup]);
    }
  }, [location.pathname, activeGroup]);
  
  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleCollapsedClick = (title: string) => {
    toggleSidebar();
    if (!openMenus.includes(title)) {
      setOpenMenus(prev => [...prev, title]);
    }
  };

  const navActive =
    "relative bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-primary";
  const navIdle = "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground";

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
            <img src={logoBZ} alt="B&Z Advocacia" className="h-6 w-6 object-contain" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-base font-seasons font-semibold tracking-tight text-foreground">B&Z</h2>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Advocacia</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleMenuItems.map((item) => {
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isOpen = openMenus.includes(item.title);
                
                if (!hasSubmenu) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.label} className="rounded-xl">
                        <NavLink
                          to={item.url!}
                          className={({ isActive }) =>
                            cn("flex items-center gap-2 rounded-xl", isActive ? navActive : navIdle)
                          }
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                          {!isCollapsed && item.badge && (
                            <Badge variant="destructive" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                
                // Item com submenu
                return (
                  <Collapsible
                    key={item.title}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(item.title)}
                  >
                    <SidebarMenuItem>
                       {isCollapsed ? (
                        <SidebarMenuButton
                          tooltip={item.label}
                          onClick={() => handleCollapsedClick(item.title)}
                        >
                          <item.icon className="h-4 w-4" />
                        </SidebarMenuButton>
                      ) : (
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.label}
                            className={cn(
                              "rounded-xl",
                              isOpen && "bg-sidebar-accent/50 text-sidebar-accent-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge variant="destructive" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                            {isOpen ? (
                              <ChevronUp className="ml-auto h-4 w-4 opacity-60" />
                            ) : (
                              <ChevronDown className="ml-auto h-4 w-4 opacity-60" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      )}
                      
                      {!isCollapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-3 border-l border-sidebar-border/80 pl-2">
                            {item.submenu.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild className="rounded-lg">
                                  <NavLink
                                    to={subItem.url}
                                    end={
                                      // Evita "Leads" ficar ativo em /leads/contatos
                                      item.submenu.some(
                                        (other) =>
                                          other.url !== subItem.url &&
                                          other.url.startsWith(`${subItem.url}/`),
                                      )
                                    }
                                    className={({ isActive }) =>
                                      cn(
                                        "flex items-center gap-2 rounded-lg text-sm",
                                        isActive ? navActive : navIdle,
                                      )
                                    }
                                  >
                                    <span>{subItem.title}</span>
                                    {subItem.badge && (
                                      <Badge variant="secondary" className="ml-auto">
                                        {subItem.badge}
                                      </Badge>
                                    )}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-2"
          size={isCollapsed ? "icon" : "default"}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

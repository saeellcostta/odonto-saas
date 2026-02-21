import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope,
  DollarSign,
  Package,
  Settings,
  Building2,
  PanelLeft,
  ChevronDown,
  Syringe,
  Smile,
  BarChart3,
  Calculator,
  UserCheck,
  Cog,
  Brain,
  QrCode,
  Tv,
  MessageSquare,
  Shield,
  Bone,
  Crown,
  FileText,
  LogOut,
  Skull,
  Baby,
  Box,
  UsersRound,
  Sparkles,
  Bell,
  TrendingUp,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Clock } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", path: "/", permission: "canViewPainel" as PermissionKey },
  { icon: UserCheck, label: "Atendente", path: "/atendente", permission: "canViewAtendente" as PermissionKey },
  { icon: Users, label: "Pacientes", path: "/pacientes", permission: "canViewPacientes" as PermissionKey },
  { icon: FileText, label: "Prontuários", path: "/prontuarios", permission: "canViewProntuarios" as PermissionKey },
  { icon: Calendar, label: "Agenda", path: "/agenda", permission: "canViewAgenda" as PermissionKey },
  { icon: Calculator, label: "Orçamentista", path: "/orcamentista", permission: "canViewOrcamentista" as PermissionKey },
];

const specializedAreas = [
  { icon: Stethoscope, label: "Área do Dentista", path: "/area-dentista", permission: "canViewAreaDentista" as PermissionKey },
  { icon: Smile, label: "Área Ortodontista", path: "/area-ortodontista", permission: "canViewAreaOrtodontista" as PermissionKey },
  { icon: Bone, label: "Área Implantodontista", path: "/area-implantodontista", permission: "canViewAreaImplantodontista" as PermissionKey },
  { icon: Crown, label: "Área Protesista", path: "/area-protesista", permission: "canViewAreaProtesista" as PermissionKey },
  { icon: Skull, label: "Buco-Maxilo-Facial", path: "/area-bucomaxilo", permission: "canViewAreaBucomaxilo" as PermissionKey },
  { icon: Baby, label: "Odontopediatria", path: "/area-odontopediatria", permission: "canViewAreaOdontopediatria" as PermissionKey },
];

const managementItems = [
  { icon: Syringe, label: "Procedimentos", path: "/procedimentos", permission: "canViewProcedimentos" as PermissionKey },
  { icon: Stethoscope, label: "Dentistas", path: "/dentistas", permission: "canViewDentistas" as PermissionKey },
  { icon: Cog, label: "Próteses", path: "/proteses", permission: "canViewProteses" as PermissionKey },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro", permission: "canViewFinanceiro" as PermissionKey },
  { icon: Building2, label: "Convênios", path: "/convenios", permission: "canViewConvenios" as PermissionKey },
  { icon: Package, label: "Estoque", path: "/estoque", permission: "canViewEstoque" as PermissionKey },
];

const analyticsItems = [
  { icon: BarChart3, label: "Relatórios", path: "/relatorios", permission: "canViewRelatorios" as PermissionKey },
  { icon: Sparkles, label: "Dentrics IA", path: "/dentrics-ia", permission: "canViewAnaliseIA" as PermissionKey },
  { icon: Smile, label: "Smile Design", path: "/smile-design", permission: "canViewAnaliseIA" as PermissionKey },
  { icon: TrendingUp, label: "Conversões Smile", path: "/smile-design-reports", permission: "canViewAnaliseIA" as PermissionKey },
  { icon: Brain, label: "Análise Radiografias", path: "/analise-ia", permission: "canViewAnaliseIA" as PermissionKey },
  { icon: Box, label: "Visualizador 3D", path: "/visualizador-3d", permission: "canViewAnaliseIA" as PermissionKey },
  { icon: QrCode, label: "QR Check-in", path: "/qr-checkin", permission: "canViewQRCheckin" as PermissionKey },
  { icon: Tv, label: "Painel TV", path: "/painel-tv", permission: "canViewPainelTV" as PermissionKey },
];

const systemItems = [
  { icon: Bell, label: "Alertas de Retorno", path: "/alertas-retorno", permission: "canViewNotificacoes" as PermissionKey },
  { icon: MessageSquare, label: "Notificações", path: "/notificacoes", permission: "canViewNotificacoes" as PermissionKey },
  { icon: UsersRound, label: "Gestão de Usuários", path: "/gestao-usuarios", permission: "canViewGestaoUsuarios" as PermissionKey },
  { icon: Settings, label: "Configuracoes", path: "/configuracoes", permission: "canViewConfiguracoes" as PermissionKey },
  { icon: Cog, label: "Configurar Areas", path: "/configuracao-areas", permission: "canViewConfiguracoes" as PermissionKey },
  { icon: Building2, label: "Admin Clinicas", path: "/admin", permission: "canViewAdmin" as PermissionKey },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

type NotificationCounts = {
  atendente: number;
  orcamentista: number;
  pagamentos: number;
  alertas: number;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const { hasPermission, isAdminOrOwner, isLoading: isLoadingPermissions } = usePermissions();
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    specialized: true,
    management: true,
    analytics: true,
    system: true,
  });
  const [dynamicSpecializedAreas, setDynamicSpecializedAreas] = useState<typeof specializedAreas>([]);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    atendente: 0,
    orcamentista: 0,
    pagamentos: 0,
    alertas: 0,
  });

  // Buscar áreas ativas
  const { data: activeAreas } = trpc.specializedAreas.listActive.useQuery();
  
  // Atualizar áreas dinâmicas quando dados chegam
  useEffect(() => {
    if (activeAreas && activeAreas.length > 0) {
      const mapped = activeAreas.map((area: any) => ({
        icon: Stethoscope, // Usar ícone padrão
        label: area.displayName,
        path: `/area-${area.name.toLowerCase().replace(/\s+/g, '-')}`,
        permission: "canViewAreaDentista" as PermissionKey,
      }));
      setDynamicSpecializedAreas(mapped);
    }
  }, [activeAreas]);

  // Buscar dados de notificações
  const { data: queueStats } = trpc.serviceQueue.stats.useQuery();
  const { data: paymentStats } = trpc.dashboard.paymentStats.useQuery();

  useEffect(() => {
    if (queueStats) {
      setNotificationCounts(prev => ({
        ...prev,
        atendente: queueStats.reception || 0,
        orcamentista: queueStats.budget || 0,
      }));
    }
  }, [queueStats]);

  useEffect(() => {
    if (paymentStats) {
      setNotificationCounts(prev => ({
        ...prev,
        pagamentos: paymentStats.pendingPayments || 0,
        alertas: paymentStats.returnAlerts || 0,
      }));
    }
  }, [paymentStats]);

  const allMenuItems = [...menuItems, ...specializedAreas, ...managementItems, ...analyticsItems, ...systemItems];
  const activeMenuItem = allMenuItems.find(item => 
    location === item.path || (item.path !== "/" && location.startsWith(item.path))
  );

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const getNotificationCount = (path: string): number => {
    if (path === "/atendente") return notificationCounts.atendente;
    if (path === "/orcamentista") return notificationCounts.orcamentista;
    if (path === "/financeiro") return notificationCounts.pagamentos;
    if (path === "/alertas-retorno") return notificationCounts.alertas;
    return 0;
  };

  const renderMenuSection = (
    items: typeof menuItems, 
    title: string, 
    sectionKey: keyof typeof expandedSections
  ) => {
    // Filtrar itens baseado nas permissões
    const filteredItems = items.filter(item => {
      // Admin e owner sempre vêem tudo
      if (isAdminOrOwner) return true;
      // Se ainda está carregando, mostrar apenas itens básicos
      if (isLoadingPermissions) return item.permission === "canViewPainel";
      // Verificar permissão específica
      return hasPermission(item.permission);
    });
    
    // Se não há itens visíveis, não renderizar a seção
    if (filteredItems.length === 0) return null;
    
    return (
      <div className="mb-2">
        {!isCollapsed && (
          <button
            onClick={() => setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {title}
            <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections[sectionKey] ? '' : '-rotate-90'}`} />
          </button>
        )}
        {(isCollapsed || expandedSections[sectionKey]) && (
          <SidebarMenu className="px-2">
            {filteredItems.map(item => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              const notificationCount = getNotificationCount(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className={`h-10 transition-all font-normal relative ${isActive ? 'bg-primary/10 text-primary font-medium' : ''} ${notificationCount > 0 ? 'menu-item-with-notification' : ''}`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                    {notificationCount > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="notification-badge h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </div>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329845776/FWvELWMrZggnddAS.png" alt="Dentrics" className="h-8 w-8 rounded-lg shadow-md" />
                  <span className="font-bold text-lg tracking-tight truncate text-sidebar-foreground">
                    Dentrics
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2 custom-scrollbar">
            {renderMenuSection(menuItems, "Principal", "main")}
            {renderMenuSection(dynamicSpecializedAreas.length > 0 ? dynamicSpecializedAreas : specializedAreas, "Áreas Especializadas", "specialized")}
            {renderMenuSection(managementItems, "Gestão", "management")}
            {renderMenuSection(analyticsItems, "Análises", "analytics")}
            {renderMenuSection(systemItems, "Sistema", "system")}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            {user && (
              <button
                onClick={() => setLocation("/perfil")}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer mb-2"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {user.email?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                {!isCollapsed && (
                  <span className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </span>
                )}
              </button>
            )}
            <div className="text-xs text-muted-foreground text-center">
              Dentrics v2.0
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329845776/FWvELWMrZggnddAS.png" alt="Dentrics" className="h-7 w-7 rounded-lg shadow-sm" />
                <span className="font-semibold text-foreground">
                  {activeMenuItem?.label ?? "Dentrics"}
                </span>
              </div>
            </div>
          </div>
        )}
        <SubscriptionWarningBanner />
        <main className="flex-1 p-4 md:p-6 bg-muted/30 min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}


// Componente de aviso de expiração do trial
function SubscriptionWarningBanner() {
  const [, setLocation] = useLocation();
  const { data: subscriptionInfo } = trpc.admin.subscriptions.getSubscriptionInfo.useQuery(undefined, {
    refetchInterval: 60000, // Atualizar a cada minuto
    staleTime: 30000,
  });
  
  // Redirecionar para página de inadimplência se não tiver acesso
  useEffect(() => {
    if (subscriptionInfo && !subscriptionInfo.canAccess) {
      setLocation("/inadimplente");
    }
  }, [subscriptionInfo, setLocation]);
  
  // Não mostrar nada se não há dados ou se não precisa mostrar aviso
  if (!subscriptionInfo?.showExpirationWarning || subscriptionInfo.daysRemaining === null) {
    return null;
  }
  
  const daysRemaining = subscriptionInfo.daysRemaining;
  
  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5" />
        <span className="font-medium">
          {daysRemaining === 1 
            ? "Seu período de teste expira amanhã!" 
            : `Seu período de teste expira em ${daysRemaining} dias!`}
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setLocation("/inadimplente")}
        className="bg-white text-orange-600 hover:bg-orange-50"
      >
        Assinar Agora
      </Button>
    </div>
  );
}

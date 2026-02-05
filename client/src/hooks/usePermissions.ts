import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Tipos de permissões disponíveis
export type PermissionKey = 
  | "canViewPainel"
  | "canViewAtendente"
  | "canViewPacientes"
  | "canViewProntuarios"
  | "canViewAgenda"
  | "canViewOrcamentista"
  | "canViewAreaDentista"
  | "canViewAreaOrtodontista"
  | "canViewAreaImplantodontista"
  | "canViewAreaProtesista"
  | "canViewAreaBucomaxilo"
  | "canViewAreaOdontopediatria"
  | "canViewProcedimentos"
  | "canViewDentistas"
  | "canViewProteses"
  | "canViewFinanceiro"
  | "canViewConvenios"
  | "canViewEstoque"
  | "canViewRelatorios"
  | "canViewAnaliseIA"
  | "canViewQRCheckin"
  | "canViewPainelTV"
  | "canViewNotificacoes"
  | "canViewGestaoUsuarios"
  | "canViewConfiguracoes"
  | "canViewAdmin";

// Mapeamento de rotas para permissões
export const routePermissions: Record<string, PermissionKey> = {
  "/": "canViewPainel",
  "/atendente": "canViewAtendente",
  "/pacientes": "canViewPacientes",
  "/prontuarios": "canViewProntuarios",
  "/agenda": "canViewAgenda",
  "/orcamentista": "canViewOrcamentista",
  "/area-dentista": "canViewAreaDentista",
  "/area-ortodontista": "canViewAreaOrtodontista",
  "/area-implantodontista": "canViewAreaImplantodontista",
  "/area-protesista": "canViewAreaProtesista",
  "/area-bucomaxilo": "canViewAreaBucomaxilo",
  "/area-odontopediatria": "canViewAreaOdontopediatria",
  "/procedimentos": "canViewProcedimentos",
  "/dentistas": "canViewDentistas",
  "/proteses": "canViewProteses",
  "/financeiro": "canViewFinanceiro",
  "/convenios": "canViewConvenios",
  "/estoque": "canViewEstoque",
  "/relatorios": "canViewRelatorios",
  "/dentrics-ia": "canViewAnaliseIA",
  "/analise-ia": "canViewAnaliseIA",
  "/qr-checkin": "canViewQRCheckin",
  "/painel-tv": "canViewPainelTV",
  "/notificacoes": "canViewNotificacoes",
  "/gestao-usuarios": "canViewGestaoUsuarios",
  "/gestao-permissoes": "canViewGestaoUsuarios",
  "/configuracoes": "canViewConfiguracoes",
  "/admin": "canViewAdmin",
};

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  
  // Buscar o cargo do usuário na clínica atual
  const { data: userClinicRole, isLoading: isLoadingRole } = trpc.admin.users.getCurrentUserClinicRole.useQuery(
    undefined,
    { 
      enabled: isAuthenticated && !!user,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
  
  // Buscar permissões do cargo
  const { data: rolePermissions, isLoading: isLoadingPermissions } = trpc.admin.permissions.getByRole.useQuery(
    { role: userClinicRole?.role || "atendente" },
    { 
      enabled: !!userClinicRole?.role,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  const isLoading = isLoadingRole || isLoadingPermissions;
  
  // Admin e owner sempre têm acesso total
  const isAdminOrOwner = 
    user?.role === "admin" || 
    user?.role === "superadmin" || 
    userClinicRole?.role === "admin" || 
    userClinicRole?.role === "owner";

  // Função para verificar se tem uma permissão específica
  const hasPermission = (permission: PermissionKey): boolean => {
    // Admin e owner sempre têm acesso
    if (isAdminOrOwner) return true;
    
    // Se ainda está carregando, assumir que não tem permissão
    if (isLoading || !rolePermissions) return false;
    
    // Verificar a permissão específica
    const value = rolePermissions[permission as keyof typeof rolePermissions];
    return value === true || value === 1;
  };

  // Função para verificar múltiplas permissões (OR)
  const hasAnyPermission = (permissions: PermissionKey[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  // Função para verificar múltiplas permissões (AND)
  const hasAllPermissions = (permissions: PermissionKey[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    isAdminOrOwner,
    userRole: userClinicRole?.role,
    permissions: rolePermissions,
  };
}

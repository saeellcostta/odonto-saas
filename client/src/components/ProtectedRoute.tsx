import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AcessoBloqueado from "@/pages/AcessoBloqueado";
import { usePermissions, PermissionKey, routePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: PermissionKey;
}

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [pathname, setLocation] = useLocation();
  const { hasPermission, isAdminOrOwner, isLoading: isLoadingPermissions } = usePermissions();
  
  // Query para verificar acesso da clínica
  const accessQuery = trpc.auth.checkClinicAccess.useQuery(undefined, {
    enabled: isAuthenticated && !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Se não está carregando e não está autenticado, redireciona para login
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Mostra loading enquanto verifica autenticação
  if (loading || (isAuthenticated && accessQuery.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, não renderiza nada (vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  // Verificar se o acesso está bloqueado
  // Exceções: página de perfil e admin (superadmin sempre tem acesso)
  const exemptPaths = ["/perfil", "/admin"];
  const isExemptPath = exemptPaths.some(p => pathname.startsWith(p));
  
  if (!isExemptPath && accessQuery.data && !accessQuery.data.canAccess) {
    return (
      <AcessoBloqueado 
        reason={accessQuery.data.reason} 
        subscriptionStatus={(accessQuery.data as any).clinic?.subscriptionStatus}
      />
    );
  }

  // Verificar permissões por cargo
  // Admin e owner sempre têm acesso total
  if (!isAdminOrOwner && !isLoadingPermissions) {
    // Determinar a permissão necessária
    const requiredPermission = permission || routePermissions[pathname];
    
    // Se há uma permissão definida e o usuário não a tem
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página. Entre em contato com o administrador da clínica para solicitar acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => setLocation("/")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Se está autenticado e tem acesso, renderiza o conteúdo
  return <>{children}</>;
}

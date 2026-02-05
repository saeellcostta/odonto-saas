import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Mail, Phone, LogOut } from "lucide-react";
import { useLocation } from "wouter";

interface AcessoBloqueadoProps {
  reason?: string;
  subscriptionStatus?: string;
}

export default function AcessoBloqueado({ reason, subscriptionStatus }: AcessoBloqueadoProps) {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getStatusInfo = () => {
    switch (subscriptionStatus) {
      case "past_due":
        return {
          title: "Assinatura Inadimplente",
          description: "Sua assinatura está com pagamento pendente. Regularize para continuar usando o sistema.",
          icon: <CreditCard className="h-16 w-16 text-yellow-500" />,
          color: "border-yellow-500",
        };
      case "canceled":
        return {
          title: "Assinatura Cancelada",
          description: "Sua assinatura foi cancelada. Entre em contato para reativá-la.",
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          color: "border-red-500",
        };
      case "suspended":
        return {
          title: "Conta Suspensa",
          description: "Sua conta foi suspensa. Entre em contato com o suporte para mais informações.",
          icon: <AlertTriangle className="h-16 w-16 text-red-500" />,
          color: "border-red-500",
        };
      default:
        return {
          title: "Acesso Bloqueado",
          description: reason || "Você não tem permissão para acessar o sistema.",
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          color: "border-orange-500",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <Card className={`w-full max-w-lg ${statusInfo.color} border-2`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="text-2xl">{statusInfo.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações de contato */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-700">Entre em contato:</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span>suporte@dentrics.com.br</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>(11) 99999-9999</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3">
            {subscriptionStatus === "past_due" && (
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <CreditCard className="h-4 w-4 mr-2" />
                Regularizar Pagamento
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sair do Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

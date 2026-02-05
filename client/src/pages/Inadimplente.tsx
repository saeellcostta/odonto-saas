import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Clock, CheckCircle, Loader2, Star, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  icon: React.ReactNode;
  gradient: string;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Básico",
    description: "Ideal para clínicas pequenas",
    price: 14900,
    priceDisplay: "R$ 149",
    icon: <Star className="h-6 w-6" />,
    gradient: "from-gray-500 to-gray-600",
    features: [
      "Até 200 pacientes",
      "2 usuários",
      "1 dentista",
      "Agenda e prontuário",
      "Orçamentos básicos",
      "Relatórios simples",
      "Suporte por email",
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    description: "Para clínicas em crescimento",
    price: 29900,
    priceDisplay: "R$ 299",
    highlighted: true,
    badge: "Mais Popular",
    icon: <Zap className="h-6 w-6" />,
    gradient: "from-orange-500 to-amber-500",
    features: [
      "Pacientes ilimitados",
      "5 usuários",
      "3 dentistas",
      "Prontuário completo",
      "Análise de IA",
      "Notificações WhatsApp",
      "Relatórios avançados",
      "Painel TV",
      "Suporte por chat",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Solução completa para redes",
    price: 49900,
    priceDisplay: "R$ 499",
    badge: "Completo",
    icon: <Crown className="h-6 w-6" />,
    gradient: "from-purple-600 to-indigo-600",
    features: [
      "Tudo do Profissional",
      "Usuários ilimitados",
      "Dentistas ilimitados",
      "Multi-clínicas",
      "API para integrações",
      "IA ilimitada",
      "Relatórios personalizados",
      "Suporte prioritário 24/7",
      "Treinamento dedicado",
    ],
  },
];

export default function Inadimplente() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("professional");
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const { data: subscriptionInfo, isLoading } = trpc.admin.subscriptions.getSubscriptionInfo.useQuery();
  const createCheckout = trpc.admin.subscriptions.createSubscriptionCheckout.useMutation({
    onSuccess: (data: { url: string | null; sessionId: string }) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o checkout...");
      }
    },
    onError: (error) => {
      toast.error(`Erro ao criar checkout: ${error.message}`);
      setIsRedirecting(false);
    },
  });
  
  // Se o usuário tem acesso, redirecionar para o painel
  useEffect(() => {
    if (subscriptionInfo?.canAccess) {
      setLocation("/");
    }
  }, [subscriptionInfo, setLocation]);
  
  const handleSubscribe = (planId: string) => {
    setIsRedirecting(true);
    setSelectedPlan(planId);
    createCheckout.mutate({ planId });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Verificando status da assinatura...</p>
        </div>
      </div>
    );
  }
  
  const getStatusInfo = () => {
    if (subscriptionInfo?.isTrialExpired) {
      return {
        icon: <Clock className="h-12 w-12 text-orange-500" />,
        title: "Período de Teste Expirado",
        description: "Seu período de teste gratuito de 30 dias chegou ao fim. Escolha um plano para continuar.",
      };
    }
    
    switch (subscriptionInfo?.status) {
      case "past_due":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          title: "Assinatura Inadimplente",
          description: "Sua assinatura está com pagamento pendente. Regularize para continuar.",
        };
      case "canceled":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-gray-500" />,
          title: "Assinatura Cancelada",
          description: "Sua assinatura foi cancelada. Assine novamente para voltar a usar o Dentrics.",
        };
      case "suspended":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-600" />,
          title: "Conta Suspensa",
          description: "Sua conta foi suspensa. Entre em contato com o suporte.",
        };
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          title: "Acesso Bloqueado",
          description: "Seu acesso está bloqueado. Escolha um plano para continuar.",
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {statusInfo.title}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            {statusInfo.description}
          </p>
          
          {subscriptionInfo?.clinicName && (
            <div className="mt-4 inline-block bg-white/50 rounded-full px-4 py-2">
              <span className="text-sm text-gray-500">Clínica: </span>
              <span className="font-semibold text-gray-800">{subscriptionInfo.clinicName}</span>
            </div>
          )}
        </div>
        
        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer",
                plan.highlighted && "ring-2 ring-orange-500 scale-105 md:scale-110 z-10",
                selectedPlan === plan.id && "ring-2 ring-orange-500"
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={cn(
                  "absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg",
                  plan.highlighted ? "bg-orange-500" : "bg-purple-600"
                )}>
                  {plan.badge}
                </div>
              )}
              
              {/* Header with gradient */}
              <div className={cn(
                "bg-gradient-to-r p-6 text-white",
                plan.gradient
              )}>
                <div className="flex items-center gap-3 mb-2">
                  {plan.icon}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-white/80 text-sm">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                  <span className="text-white/80">/mês</span>
                </div>
              </div>
              
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(plan.id);
                  }}
                  disabled={isRedirecting && selectedPlan === plan.id}
                  className={cn(
                    "w-full mt-6 h-12",
                    plan.highlighted 
                      ? "bg-orange-600 hover:bg-orange-700" 
                      : plan.id === "premium"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-600 hover:bg-gray-700"
                  )}
                >
                  {isRedirecting && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Assinar {plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Pagamento seguro via Stripe. Cancele a qualquer momento. Todos os planos incluem 7 dias de garantia.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Sem taxa de adesão</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Migração gratuita</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Suporte incluso</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 pt-4 border-t border-gray-200 max-w-md mx-auto">
            Precisa de ajuda para escolher?{" "}
            <a href="mailto:suporte@dentrics.com" className="text-orange-600 hover:underline font-medium">
              Fale com nossa equipe
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

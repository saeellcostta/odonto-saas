import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Clock, CheckCircle, Loader2, Star, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Ícones baseados no slug do plano
const getPlanIcon = (slug: string) => {
  switch (slug) {
    case "basic":
    case "basico":
      return <Star className="h-6 w-6" />;
    case "professional":
    case "profissional":
      return <Zap className="h-6 w-6" />;
    case "premium":
      return <Crown className="h-6 w-6" />;
    default:
      return <Star className="h-6 w-6" />;
  }
};

// Gradientes baseados no slug do plano
const getPlanGradient = (slug: string, index: number) => {
  switch (slug) {
    case "basic":
    case "basico":
      return "from-gray-500 to-gray-600";
    case "professional":
    case "profissional":
      return "from-orange-500 to-amber-500";
    case "premium":
      return "from-purple-600 to-indigo-600";
    default:
      // Gradientes padrão baseados no índice
      const gradients = [
        "from-gray-500 to-gray-600",
        "from-orange-500 to-amber-500",
        "from-purple-600 to-indigo-600",
        "from-blue-500 to-cyan-500",
        "from-green-500 to-emerald-500",
      ];
      return gradients[index % gradients.length];
  }
};

// Gerar features baseado nos campos do plano
const generateFeatures = (plan: any): string[] => {
  const features: string[] = [];
  
  // Limites
  if (plan.maxPatients) {
    features.push(plan.maxPatients >= 999999 ? "Pacientes ilimitados" : `Até ${plan.maxPatients} pacientes`);
  }
  if (plan.maxUsers) {
    features.push(plan.maxUsers >= 999999 ? "Usuários ilimitados" : `${plan.maxUsers} usuários`);
  }
  
  // Recursos
  if (plan.hasAIAnalysis) features.push("Análise de IA");
  if (plan.hasWhatsAppNotifications) features.push("Notificações WhatsApp");
  if (plan.hasTVPanel) features.push("Painel TV");
  if (plan.hasAdvancedReports) features.push("Relatórios avançados");
  if (plan.hasMultipleLocations) features.push("Multi-clínicas");
  if (plan.hasAPIAccess) features.push("API para integrações");
  if (plan.hasPrioritySupport) features.push("Suporte prioritário 24/7");
  
  // Se tem descrição, adicionar como feature
  if (plan.description) {
    features.unshift(plan.description);
  }
  
  return features;
};

export default function Inadimplente() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Buscar planos dinâmicos do banco de dados
  const { data: dbPlans, isLoading: plansLoading } = trpc.admin.plans.listActive.useQuery();
  
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
  
  // Selecionar plano padrão quando carregar
  useEffect(() => {
    if (dbPlans && dbPlans.length > 0 && !selectedPlan) {
      // Selecionar o plano do meio ou o primeiro
      const middleIndex = Math.floor(dbPlans.length / 2);
      setSelectedPlan(dbPlans[middleIndex]?.slug || dbPlans[0]?.slug || "");
    }
  }, [dbPlans, selectedPlan]);
  
  // Se o usuário tem acesso, redirecionar para o painel
  useEffect(() => {
    if (subscriptionInfo?.canAccess) {
      setLocation("/");
    }
  }, [subscriptionInfo, setLocation]);
  
  const handleSubscribe = (planSlug: string) => {
    setIsRedirecting(true);
    setSelectedPlan(planSlug);
    createCheckout.mutate({ planId: planSlug });
  };
  
  if (isLoading || plansLoading) {
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
  
  // Usar planos do banco de dados
  const plans = dbPlans || [];
  
  // Identificar plano destacado (do meio ou marcado)
  const highlightedIndex = Math.floor(plans.length / 2);
  
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
        <div className={cn(
          "grid gap-6 mb-8",
          plans.length === 1 && "md:grid-cols-1 max-w-md mx-auto",
          plans.length === 2 && "md:grid-cols-2 max-w-2xl mx-auto",
          plans.length >= 3 && "md:grid-cols-3"
        )}>
          {plans.map((plan, index) => {
            const isHighlighted = index === highlightedIndex;
            const features = generateFeatures(plan);
            const priceValue = parseFloat(plan.price);
            const priceDisplay = `R$ ${Math.floor(priceValue)}`;
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer",
                  isHighlighted && "ring-2 ring-orange-500 scale-105 md:scale-110 z-10",
                  selectedPlan === plan.slug && "ring-2 ring-orange-500"
                )}
                onClick={() => setSelectedPlan(plan.slug)}
              >
                {/* Badge */}
                {isHighlighted && (
                  <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg bg-orange-500">
                    Mais Popular
                  </div>
                )}
                {index === plans.length - 1 && plans.length > 1 && !isHighlighted && (
                  <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg bg-purple-600">
                    Completo
                  </div>
                )}
                
                {/* Header with gradient */}
                <div className={cn(
                  "bg-gradient-to-r p-6 text-white",
                  getPlanGradient(plan.slug, index)
                )}>
                  <div className="flex items-center gap-3 mb-2">
                    {getPlanIcon(plan.slug)}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-white/80 text-sm">{plan.description || "Plano de assinatura"}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{priceDisplay}</span>
                    <span className="text-white/80">/{plan.billingCycle === "yearly" ? "ano" : "mês"}</span>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.slug);
                    }}
                    disabled={isRedirecting && selectedPlan === plan.slug}
                    className={cn(
                      "w-full mt-6 h-12",
                      isHighlighted 
                        ? "bg-orange-600 hover:bg-orange-700" 
                        : index === plans.length - 1
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-gray-600 hover:bg-gray-700"
                    )}
                  >
                    {isRedirecting && selectedPlan === plan.slug ? (
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
            );
          })}
        </div>
        
        {/* Fallback se não houver planos */}
        {plans.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum plano disponível</h3>
            <p className="text-gray-600">Entre em contato com o suporte para mais informações.</p>
          </div>
        )}
        
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

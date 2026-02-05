import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  User, 
  Mail, 
  LogOut, 
  CreditCard, 
  Shield, 
  Bell,
  Key,
  Building2,
  Crown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Calendar,
  Receipt,
  Settings,
  Star,
  Zap,
  CheckCircle,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
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

export default function Perfil() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("professional");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Buscar informações da assinatura
  const { data: subscriptionInfo, isLoading: isLoadingSubscription } = trpc.admin.subscriptions.getSubscriptionInfo.useQuery();
  
  // Buscar planos do banco de dados
  const { data: dbPlans, isLoading: isLoadingPlans } = trpc.admin.plans.listActive.useQuery();
  
  // Mutation para criar sessão do portal
  const createPortalMutation = trpc.admin.subscriptions.createCustomerPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o portal de pagamentos...");
      }
      setIsLoadingPortal(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao abrir portal de pagamentos");
      setIsLoadingPortal(false);
    },
  });

  // Mutation para criar checkout
  const createCheckout = trpc.admin.subscriptions.createSubscriptionCheckout.useMutation({
    onSuccess: (data: { url: string | null; sessionId: string }) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o checkout...");
        setShowPlansModal(false);
      }
      setIsRedirecting(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar checkout: ${error.message}`);
      setIsRedirecting(false);
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/login");
    toast.success("Você saiu do sistema");
  };

  const handleSaveProfile = () => {
    // TODO: Implementar salvamento do perfil
    toast.success("Perfil atualizado com sucesso!");
    setIsEditing(false);
  };

  const handleOpenPortal = () => {
    setIsLoadingPortal(true);
    createPortalMutation.mutate();
  };

  const handleSubscribe = (planId: string) => {
    setIsRedirecting(true);
    setSelectedPlan(planId);
    createCheckout.mutate({ planId });
  };

  const getStatusBadge = () => {
    if (!subscriptionInfo) return null;
    
    switch (subscriptionInfo.status) {
      case "active":
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Ativo
          </Badge>
        );
      case "trial":
        return (
          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-600">
            <Calendar className="h-3 w-3" />
            Período de Teste
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
            <AlertCircle className="h-3 w-3" />
            Pagamento Pendente
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="gap-1 text-gray-600 border-gray-600">
            <AlertCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
            <AlertCircle className="h-3 w-3" />
            {subscriptionInfo.status}
          </Badge>
        );
    }
  };

  const getPlanInfo = () => {
    if (!subscriptionInfo) return { name: "Carregando...", price: "...", description: "" };
    
    // Mapear planos baseado no status ou informações disponíveis
    if (subscriptionInfo.status === "trial") {
      return { name: "Período de Teste", price: "Grátis", description: "30 dias de acesso completo" };
    }
    
    // Se tiver informações do plano do banco de dados
    if ((subscriptionInfo as any).plan) {
      const plan = (subscriptionInfo as any).plan;
      const priceFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(parseFloat(plan.price));
      
      return { 
        name: plan.name, 
        price: priceFormatted,
        description: plan.description || "Acesso completo a todas as funcionalidades"
      };
    }
    
    // Fallback
    return { 
      name: "Plano Ativo", 
      price: "-",
      description: "Acesso completo a todas as funcionalidades"
    };
  };

  const planInfo = getPlanInfo();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações da conta</p>
        </div>

        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-xl">{user?.name || "Usuário"}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="gap-1">
                {user?.role === "admin" ? (
                  <>
                    <Shield className="h-3 w-3" />
                    Administrador
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3" />
                    Usuário
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Assinatura
                </CardTitle>
                <CardDescription>Gerencie seu plano e pagamentos</CardDescription>
              </div>
              {isLoadingSubscription ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                getStatusBadge()
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações do Plano */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div>
                <h3 className="font-semibold text-amber-900">{planInfo.name}</h3>
                <p className="text-sm text-amber-700">{planInfo.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-900">{planInfo.price}</p>
                {planInfo.price !== "Grátis" && <p className="text-sm text-amber-700">/mês</p>}
              </div>
            </div>

            {/* Informações de Trial */}
            {subscriptionInfo?.status === "trial" && subscriptionInfo.daysRemaining != null && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                (subscriptionInfo.daysRemaining ?? 0) <= 5 
                  ? "bg-red-50 border border-red-200" 
                  : "bg-blue-50 border border-blue-200"
              }`}>
                <Calendar className={`h-5 w-5 ${
                  (subscriptionInfo.daysRemaining ?? 0) <= 5 ? "text-red-600" : "text-blue-600"
                }`} />
                <div>
                  <p className={`font-medium ${
                    (subscriptionInfo.daysRemaining ?? 0) <= 5 ? "text-red-900" : "text-blue-900"
                  }`}>
                    {subscriptionInfo.daysRemaining} dias restantes no período de teste
                  </p>
                  <p className={`text-sm ${
                    (subscriptionInfo.daysRemaining ?? 0) <= 5 
                      ? "text-red-700" : "text-blue-700"
                  }`}>
                    {(subscriptionInfo.daysRemaining ?? 0) <= 5 
                      ? "Assine agora para não perder o acesso!"
                      : "Após o período de teste, escolha um plano para continuar."}
                  </p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleOpenPortal}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Gerenciar Pagamento
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleOpenPortal}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                Ver Faturas
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowPlansModal(true)}
              >
                <Settings className="h-4 w-4" />
                Alterar Plano
              </Button>
            </div>

            {/* Informações do Portal */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">No portal de pagamentos você pode:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Atualizar seu cartão de crédito</li>
                <li>Ver histórico de faturas e pagamentos</li>
                <li>Baixar recibos e notas fiscais</li>
                <li>Cancelar ou pausar sua assinatura</li>
                <li>Alterar método de pagamento</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Clínica Vinculada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Clínica Vinculada
            </CardTitle>
            <CardDescription>Informações da clínica associada à sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{subscriptionInfo?.clinicName || "Carregando..."}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionInfo?.canAccess ? "Acesso ativo" : "Acesso restrito"}
                  </p>
                </div>
              </div>
              {subscriptionInfo?.canAccess ? (
                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Pendente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Configurações de segurança da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="gap-2">
              <Key className="h-4 w-4" />
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como deseja receber notificações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembretes de Consultas</p>
                  <p className="text-sm text-muted-foreground">Receba lembretes por email</p>
                </div>
                <Badge variant="outline" className="text-green-600">Ativo</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas do Sistema</p>
                  <p className="text-sm text-muted-foreground">Notificações importantes</p>
                </div>
                <Badge variant="outline" className="text-green-600">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sair */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              Sair da Conta
            </CardTitle>
            <CardDescription>Encerrar sua sessão no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Seleção de Planos */}
      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Escolha seu Plano
            </DialogTitle>
            <DialogDescription className="text-center">
              Selecione o plano ideal para sua clínica. Você pode alterar a qualquer momento.
            </DialogDescription>
          </DialogHeader>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {isLoadingPlans ? (
              <div className="col-span-3 text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Carregando planos...</p>
              </div>
            ) : !dbPlans || dbPlans.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <p className="text-muted-foreground">Nenhum plano disponível</p>
              </div>
            ) : (
              dbPlans.map((plan) => {
                // Determinar ícone e gradiente baseado no slug
                const planIcon = plan.slug === 'basico' ? <Star className="h-6 w-6" /> :
                                plan.slug === 'profissional' ? <Zap className="h-6 w-6" /> :
                                <Crown className="h-6 w-6" />;
                                
                const planGradient = plan.slug === 'basico' ? 'from-gray-500 to-gray-600' :
                                    plan.slug === 'profissional' ? 'from-orange-500 to-amber-500' :
                                    'from-purple-600 to-indigo-600';
                                    
                const isHighlighted = plan.slug === 'profissional';
                const planBadge = plan.slug === 'profissional' ? 'Mais Popular' :
                                 plan.slug === 'premium' ? 'Completo' : null;
                                 
                // Formatar preço
                const priceFormatted = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                }).format(parseFloat(plan.price));
                
                // Construir lista de features a partir dos campos booleanos
                const features: string[] = [];
                
                // Adicionar limites
                if ((plan as any).maxPatients) {
                  const maxPatients = (plan as any).maxPatients;
                  features.push(maxPatients === -1 ? 'Pacientes ilimitados' : `Até ${maxPatients} pacientes`);
                }
                if ((plan as any).maxUsers) {
                  const maxUsers = (plan as any).maxUsers;
                  features.push(maxUsers === -1 ? 'Usuários ilimitados' : `${maxUsers} usuários`);
                }
                
                // Adicionar recursos
                features.push('Agenda e prontuário');
                features.push('Orçamentos');
                
                if ((plan as any).hasAIAnalysis) {
                  features.push('Análise de IA');
                }
                if ((plan as any).hasWhatsAppNotifications) {
                  features.push('Notificações WhatsApp');
                }
                if ((plan as any).hasTVPanel) {
                  features.push('Painel TV');
                }
                if ((plan as any).hasAdvancedReports) {
                  features.push('Relatórios avançados');
                }
                if ((plan as any).hasMultipleLocations) {
                  features.push('Múltiplas clínicas');
                }
                if ((plan as any).hasAPIAccess) {
                  features.push('API para integrações');
                }
                if ((plan as any).hasPrioritySupport) {
                  features.push('Suporte prioritário 24/7');
                } else {
                  features.push('Suporte por email');
                }
                
                return (
                  <Card 
                    key={plan.id}
                    className={cn(
                      "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
                      isHighlighted && "ring-2 ring-orange-500 scale-[1.02]",
                      selectedPlan === plan.slug && "ring-2 ring-orange-500"
                    )}
                    onClick={() => setSelectedPlan(plan.slug)}
                  >
                    {/* Badge */}
                    {planBadge && (
                      <div className={cn(
                        "absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg",
                        isHighlighted ? "bg-orange-500" : "bg-purple-600"
                      )}>
                        {planBadge}
                      </div>
                    )}
                    
                    {/* Header with gradient */}
                    <div className={cn(
                      "bg-gradient-to-r p-4 text-white",
                      planGradient
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        {planIcon}
                        <h3 className="text-lg font-bold">{plan.name}</h3>
                      </div>
                      <p className="text-white/80 text-sm">{plan.description}</p>
                      <div className="mt-3">
                        <span className="text-3xl font-bold">{priceFormatted}</span>
                        <span className="text-white/80">/mês</span>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <ul className="space-y-2">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
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
                          "w-full mt-4 h-10",
                          isHighlighted 
                            ? "bg-orange-600 hover:bg-orange-700" 
                            : plan.slug === "premium"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-gray-600 hover:bg-gray-700"
                        )}
                      >
                        {isRedirecting && selectedPlan === plan.slug ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecionando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Assinar {plan.name}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="text-center space-y-3 mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Pagamento seguro via Stripe. Cancele a qualquer momento. Todos os planos incluem 7 dias de garantia.
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sem taxa de adesão</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Migração gratuita</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Suporte incluso</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

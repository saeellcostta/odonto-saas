import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statCards = [
    {
      title: "Total de Pacientes",
      value: stats?.totalPatients ?? 0,
      description: "pacientes cadastrados",
      icon: Users,
      color: "primary",
      href: "/pacientes"
    },
    {
      title: "Consultas Hoje",
      value: stats?.todayAppointments ?? 0,
      description: "agendamentos para hoje",
      icon: Calendar,
      color: "success",
      href: "/agenda"
    },
    {
      title: "Orçamentos Pendentes",
      value: stats?.pendingBudgets ?? 0,
      description: "aguardando aprovação",
      icon: FileText,
      color: "warning",
      href: "/orcamentos"
    },
    {
      title: "Faturamento do Mês",
      value: formatCurrency(Number(stats?.monthlyRevenue ?? 0)),
      description: "receita do mês atual",
      icon: DollarSign,
      color: "primary",
      href: "/financeiro"
    },
    {
      title: "Estoque Baixo",
      value: stats?.lowStockItems ?? 0,
      description: "itens abaixo do mínimo",
      icon: Package,
      color: stats?.lowStockItems && stats.lowStockItems > 0 ? "destructive" : "success",
      href: "/estoque"
    },
    {
      title: "Pacientes na Fila",
      value: stats?.waitingPatients ?? 0,
      description: "aguardando atendimento",
      icon: Clock,
      color: "warning",
      href: "/atendente"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Dentrics. Acompanhe os indicadores da sua clínica.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => (
              <Card 
                key={index} 
                className={`stat-card stat-card-${stat.color} cursor-pointer hover:shadow-lg transition-all`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                    stat.color === 'success' ? 'bg-green-500/10 text-green-600' :
                    stat.color === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesse rapidamente as funcionalidades mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <QuickActionCard 
                icon={Users} 
                label="Novo Paciente" 
                href="/pacientes?new=true" 
              />
              <QuickActionCard 
                icon={Calendar} 
                label="Agendar Consulta" 
                href="/agenda?new=true" 
              />
              <QuickActionCard 
                icon={FileText} 
                label="Novo Orçamento" 
                href="/orcamentista" 
              />
              <QuickActionCard 
                icon={DollarSign} 
                label="Registrar Pagamento" 
                href="/financeiro?new=true" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertas
              </CardTitle>
              <CardDescription>
                Itens que precisam da sua atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.lowStockItems && stats.lowStockItems > 0 ? (
                    <AlertItem 
                      type="warning"
                      message={`${stats.lowStockItems} item(ns) de estoque abaixo do mínimo`}
                    />
                  ) : null}
                  {stats?.pendingBudgets && stats.pendingBudgets > 0 ? (
                    <AlertItem 
                      type="info"
                      message={`${stats.pendingBudgets} orçamento(s) aguardando aprovação`}
                    />
                  ) : null}
                  {stats?.waitingPatients && stats.waitingPatients > 0 ? (
                    <AlertItem 
                      type="info"
                      message={`${stats.waitingPatients} paciente(s) aguardando na fila`}
                    />
                  ) : null}
                  {!stats?.lowStockItems && !stats?.pendingBudgets && !stats?.waitingPatients && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum alerta no momento
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickActionCard({ 
  icon: Icon, 
  label, 
  href 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function AlertItem({ 
  type, 
  message 
}: { 
  type: "warning" | "info" | "error"; 
  message: string;
}) {
  const colors = {
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-700",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-700",
    error: "bg-red-500/10 border-red-500/20 text-red-700",
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[type]}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart3,
  MessageSquare,
  Printer,
  Share2,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  Building2,
  Sparkles
} from "lucide-react";

export default function Orcamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("month");

  const { data: budgets, isLoading } = trpc.budgets.list.useQuery({});
  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: clinicSettings } = trpc.settings.get.useQuery();
  const { data: procedures } = trpc.procedures.list.useQuery({});

  const updateBudget = trpc.budgets.update.useMutation({
    onSuccess: () => {
      toast.success("Orçamento atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar orçamento"),
  });

  // Filtrar orçamentos
  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];
    
    let filtered = budgets;

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Filtro por busca (nome do paciente)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const patient = patients?.find(p => p.id === b.patientId);
        return patient?.name?.toLowerCase().includes(term) || 
               b.id.toString().includes(term);
      });
    }

    // Filtro por data
    const now = new Date();
    if (dateRange === "today") {
      filtered = filtered.filter(b => {
        const date = new Date(b.createdAt);
        return date.toDateString() === now.toDateString();
      });
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(b => new Date(b.createdAt) >= weekAgo);
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(b => new Date(b.createdAt) >= monthAgo);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [budgets, statusFilter, searchTerm, dateRange, patients]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!budgets) return { total: 0, approved: 0, pending: 0, rejected: 0, totalValue: 0, approvedValue: 0, conversionRate: 0 };
    
    const total = budgets.length;
    const approved = budgets.filter(b => b.status === "approved" || b.status === "in_progress" || b.status === "completed").length;
    const pending = budgets.filter(b => b.status === "pending").length;
    const rejected = budgets.filter(b => b.status === "rejected").length;
    const totalValue = budgets.reduce((sum, b) => sum + parseFloat(b.finalValue), 0);
    const approvedValue = budgets
      .filter(b => b.status === "approved" || b.status === "in_progress" || b.status === "completed")
      .reduce((sum, b) => sum + parseFloat(b.finalValue), 0);
    const conversionRate = total > 0 ? (approved / total) * 100 : 0;

    return { total, approved, pending, rejected, totalValue, approvedValue, conversionRate };
  }, [budgets]);

  // Meta mensal (exemplo: R$ 50.000)
  const monthlyGoal = 50000;
  const goalProgress = (stats.approvedValue / monthlyGoal) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPatientName = (patientId: number) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient?.name || "Paciente não encontrado";
  };

  const getPatientPhone = (patientId: number) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient?.phone || "";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { label: "Pendente", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      approved: { label: "Aprovado", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { label: "Rejeitado", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      in_progress: { label: "Em Andamento", variant: "outline", icon: <TrendingUp className="h-3 w-3" /> },
      completed: { label: "Concluído", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleApprove = (budgetId: number) => {
    updateBudget.mutate({ id: budgetId, data: { status: "approved" } });
  };

  const handleReject = (budgetId: number) => {
    updateBudget.mutate({ id: budgetId, data: { status: "rejected" } });
  };

  const handleSendWhatsApp = (budget: any) => {
    const patient = patients?.find(p => p.id === budget.patientId);
    if (!patient?.phone) {
      toast.error("Paciente não possui telefone cadastrado");
      return;
    }

    const clinicName = clinicSettings?.name || "Dentrics";
    const message = `Olá ${patient.name}! 🦷\n\n` +
      `Segue seu orçamento da *${clinicName}*:\n\n` +
      `📋 *Orçamento #${budget.id}*\n` +
      `💰 Valor Total: *${formatCurrency(parseFloat(budget.finalValue))}*\n` +
      `📅 Data: ${format(new Date(budget.createdAt), "dd/MM/yyyy", { locale: ptBR })}\n` +
      `⏳ Válido até: ${budget.validUntil ? format(new Date(budget.validUntil), "dd/MM/yyyy", { locale: ptBR }) : "30 dias"}\n\n` +
      `Para aprovar ou tirar dúvidas, entre em contato conosco!\n\n` +
      `Atenciosamente,\n${clinicName}`;

    const phone = (patient.phone || "").replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Orçamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie orçamentos, acompanhe conversões e metas de vendas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dashboard de Metas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Meta Mensal */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Meta Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(stats.approvedValue)}</p>
                    <p className="text-sm text-muted-foreground">de {formatCurrency(monthlyGoal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{goalProgress.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">atingido</p>
                  </div>
                </div>
                <Progress value={Math.min(goalProgress, 100)} className="h-3" />
                {goalProgress >= 100 && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Sparkles className="h-4 w-4" />
                    Meta atingida! Parabéns!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Conversão */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Orçamentos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Orçamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendentes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente ou número do orçamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos ({filteredBudgets.length})</CardTitle>
            <CardDescription>
              Clique em um orçamento para ver detalhes e ações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredBudgets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Nenhum orçamento encontrado</h3>
                <p className="text-sm">Ajuste os filtros ou crie um novo orçamento</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredBudgets.map((budget) => (
                    <div
                      key={budget.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedBudget(budget);
                        setShowPreview(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono">
                              #{budget.id.toString().padStart(4, "0")}
                            </Badge>
                            {getStatusBadge(budget.status || "pending")}
                          </div>
                          <h4 className="font-semibold text-lg">
                            {getPatientName(budget.patientId)}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(budget.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {getPatientPhone(budget.patientId) && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {getPatientPhone(budget.patientId)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(parseFloat(budget.finalValue))}
                          </p>
                          {budget.discountPercent && parseFloat(budget.discountPercent) > 0 && (
                            <p className="text-xs text-green-600">
                              -{budget.discountPercent}% desconto
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 group-hover:translate-x-1 transition-transform" />
                      </div>

                      {/* Ações Rápidas */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsApp(budget);
                          }}
                        >
                          <MessageSquare className="h-3 w-3" />
                          WhatsApp
                        </Button>
                        {budget.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(budget.id);
                              }}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(budget.id);
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Modal de Preview do Orçamento */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedBudget && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Orçamento #{selectedBudget.id.toString().padStart(4, "0")}
                  </DialogTitle>
                  <DialogDescription>
                    Visualização detalhada do orçamento
                  </DialogDescription>
                </DialogHeader>

                {/* Preview do Orçamento com Design Profissional */}
                <div className="border rounded-lg p-6 bg-white space-y-6">
                  {/* Cabeçalho com Logo */}
                  <div className="flex items-start justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      {clinicSettings?.logoUrl ? (
                        <img 
                          src={clinicSettings.logoUrl} 
                          alt="Logo" 
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-primary">
                          {clinicSettings?.name || "Dentrics"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {clinicSettings?.address || "Endereço da Clínica"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {clinicSettings?.phone || "(00) 0000-0000"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-lg font-mono">
                        #{selectedBudget.id.toString().padStart(4, "0")}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(selectedBudget.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Dados do Paciente */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Dados do Paciente
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Nome</p>
                        <p className="font-medium">{getPatientName(selectedBudget.patientId)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-medium">{getPatientPhone(selectedBudget.patientId) || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Resumo Financeiro
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Valor Total</span>
                        <span>{formatCurrency(parseFloat(selectedBudget.totalValue))}</span>
                      </div>
                      {selectedBudget.discountPercent && parseFloat(selectedBudget.discountPercent) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto ({selectedBudget.discountPercent}%)</span>
                          <span>-{formatCurrency(parseFloat(selectedBudget.discountValue || "0"))}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Valor Final</span>
                        <span className="text-primary">{formatCurrency(parseFloat(selectedBudget.finalValue))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedBudget.notes && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Observações</h3>
                      <p className="text-sm whitespace-pre-wrap">{selectedBudget.notes}</p>
                    </div>
                  )}

                  {/* Validade */}
                  <div className="text-center text-sm text-muted-foreground border-t pt-4">
                    <p>
                      Este orçamento é válido até{" "}
                      <strong>
                        {selectedBudget.validUntil 
                          ? format(new Date(selectedBudget.validUntil), "dd/MM/yyyy", { locale: ptBR })
                          : format(new Date(new Date(selectedBudget.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ptBR })
                        }
                      </strong>
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleSendWhatsApp(selectedBudget)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      toast.info("Funcionalidade de impressão em desenvolvimento");
                    }}
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  {selectedBudget.status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        className="gap-2"
                        onClick={() => {
                          handleApprove(selectedBudget.id);
                          setShowPreview(false);
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprovar Orçamento
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

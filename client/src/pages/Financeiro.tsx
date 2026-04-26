import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Banknote,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TransactionFormData = {
  id?: number;
  type: "income" | "expense";
  category: string;
  description: string;
  value: string;
  paymentMethod: string;
  date: string;
  patientId: number | "";
};

const initialFormData: TransactionFormData = {
  type: "income",
  category: "",
  description: "",
  value: "",
  paymentMethod: "",
  date: format(new Date(), "yyyy-MM-dd"),
  patientId: "",
};

const paymentMethods = [
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "credit_card", label: "Cartão de Crédito", icon: CreditCard },
  { value: "debit_card", label: "Cartão de Débito", icon: CreditCard },
  { value: "pix", label: "PIX", icon: Wallet },
  { value: "bank_transfer", label: "Transferência", icon: DollarSign },
  { value: "insurance", label: "Convênio", icon: DollarSign },
];

const incomeCategories = [
  "Consulta",
  "Procedimento",
  "Orçamento",
  "Retorno",
  "Manutenção",
  "Pagamento Fila",
  "Outros",
];

const expenseCategories = [
  "Material",
  "Equipamento",
  "Salário",
  "Aluguel",
  "Conta de Luz",
  "Conta de Água",
  "Internet",
  "Marketing",
  "Manutenção",
  "Outros",
];

export default function Financeiro() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState("all");

  const utils = trpc.useUtils();
  const { data: transactions, isLoading } = trpc.transactions.list.useQuery({
    type: activeTab !== "all" ? (activeTab as "income" | "expense") : undefined,
  });
  const { data: patients } = trpc.patients.list.useQuery();
  
  // Buscar pagamentos da fila de serviço para integrar ao financeiro
  const { data: queuePayments } = trpc.serviceQueue.list.useQuery({});
  const paidFromQueue = queuePayments?.filter(p => p.paymentStatus === "paid") || [];
  
  // Buscar atendimentos completados (ganhos)
  const { data: completedAppointments } = trpc.earnings.appointments.list.useQuery({});

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      toast.success("Transação registrada com sucesso!");
      utils.transactions.list.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao registrar transação: " + error.message);
    },
  });

  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      toast.success("Transação atualizada!");
      utils.transactions.list.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(initialFormData);
  };

  const handleOpenNew = (type: "income" | "expense" = "income") => {
    setFormData({ ...initialFormData, type });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction: any) => {
    setFormData({
      id: transaction.id,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description || "",
      value: transaction.value,
      paymentMethod: transaction.paymentMethod || "",
      date: format(new Date(transaction.date), "yyyy-MM-dd"),
      patientId: transaction.patientId || "",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleOpenCancelDialog = (transaction: any) => {
    setSelectedTransaction(transaction);
    setCancelReason("");
    setIsCancelDialogOpen(true);
  };

  const handleCancel = () => {
    if (!selectedTransaction) return;
    if (!cancelReason.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    updateMutation.mutate({
      id: selectedTransaction.id,
      data: {
        status: "cancelled",
      },
    });
    setIsCancelDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value || !formData.category) {
      toast.error("Valor e categoria são obrigatórios");
      return;
    }

    if (isEditMode && formData.id) {
      updateMutation.mutate({
        id: formData.id,
        data: {
          status: "paid",
          paymentMethod: formData.paymentMethod as any || undefined,
        },
      });
    } else {
      createMutation.mutate({
        type: formData.type,
        category: formData.category,
        description: formData.description || undefined,
        value: formData.value,
        paymentMethod: formData.paymentMethod as any || undefined,
        date: formData.date,
        patientId: formData.patientId ? formData.patientId as number : undefined,
        status: "paid",
      });
    }
  };

  const handleMarkAsPaid = (id: number) => {
    updateMutation.mutate({ id, data: { status: "paid" } });
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  // Calcular estatísticas incluindo pagamentos da fila
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    // Transações normais
    if (transactions) {
      income = transactions
        .filter((t) => t.type === "income" && t.status === "paid")
        .reduce((sum, t) => sum + parseFloat(t.value), 0);
      
      expense = transactions
        .filter((t) => t.type === "expense" && t.status === "paid")
        .reduce((sum, t) => sum + parseFloat(t.value), 0);
    }
    
    // Adicionar pagamentos da fila de serviço
    const queueIncome = paidFromQueue.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    
    // Adicionar receita de atendimentos completados
    const appointmentsIncome = completedAppointments?.reduce((sum, apt) => {
      return sum + parseFloat(apt.procedurePrice?.toString() || '0');
    }, 0) || 0;
    
    // Calcular comissão total
    const totalCommission = completedAppointments?.reduce((sum, apt) => {
      return sum + parseFloat(apt.commissionAmount?.toString() || '0');
    }, 0) || 0;
    
    return { 
      income: income + queueIncome + appointmentsIncome, 
      expense, 
      balance: (income + queueIncome + appointmentsIncome) - expense,
      queuePaymentsCount: paidFromQueue.length,
      queuePaymentsTotal: queueIncome,
      appointmentsCount: completedAppointments?.length || 0,
      appointmentsIncome,
      totalCommission,
    };
  }, [transactions, paidFromQueue, completedAppointments]);

  const getPatientName = (patientId: number | null) => {
    if (!patientId) return null;
    const patient = patients?.find((p) => p.id === patientId);
    return patient?.name || null;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return "-";
    const pm = paymentMethods.find((m) => m.value === method);
    return pm?.label || method;
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro da clínica</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenNew("income")} className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Receita
          </Button>
          <Button onClick={() => handleOpenNew("expense")} variant="outline" className="gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Despesa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stat-card stat-card-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</p>
                {stats.queuePaymentsCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats.queuePaymentsCount} pagamentos da fila ({formatCurrency(stats.queuePaymentsTotal)})
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card stat-card-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.expense)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card stat-card-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-primary" : "text-red-600"}`}>
                  {formatCurrency(stats.balance)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Fila</p>
                <p className="text-2xl font-bold text-amber-600">{stats.queuePaymentsCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.queuePaymentsTotal)} recebidos
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>Histórico de movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="expense">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      className={transaction.status === "cancelled" ? "opacity-60" : ""}
                    >
                      <TableCell className={`text-sm ${transaction.status === "cancelled" ? "line-through" : ""}`}>
                        {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className={transaction.status === "cancelled" ? "line-through" : ""}>
                        <div>
                          <p className="font-medium">
                            {transaction.description || transaction.category}
                          </p>
                          {transaction.patientId && (
                            <p className="text-xs text-muted-foreground">
                              {getPatientName(transaction.patientId)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`hidden md:table-cell ${transaction.status === "cancelled" ? "line-through" : ""}`}>
                        {transaction.category}
                      </TableCell>
                      <TableCell className={`hidden sm:table-cell ${transaction.status === "cancelled" ? "line-through" : ""}`}>
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </TableCell>
                      <TableCell className={transaction.status === "cancelled" ? "line-through" : ""}>
                        <span className={`font-medium ${
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.value)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.status === "paid" ? (
                          <Badge variant="default" className="bg-green-500">Pago</Badge>
                        ) : transaction.status === "pending" ? (
                          <Badge 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-green-500 hover:text-white"
                            onClick={() => handleMarkAsPaid(transaction.id)}
                          >
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Cancelado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status !== "cancelled" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenCancelDialog(transaction)}
                              title="Cancelar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma transação encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">Registre sua primeira transação</p>
              <Button onClick={() => handleOpenNew("income")} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagamentos da Fila */}
      {paidFromQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              Pagamentos Recebidos na Fila
            </CardTitle>
            <CardDescription>Pagamentos de pacientes após avaliação/orçamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidFromQueue.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patientName}</TableCell>
                      <TableCell>{payment.originQueue || "-"}</TableCell>
                      <TableCell>{payment.paymentMethod || "-"}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        +{formatCurrency(Number(payment.amountPaid || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Pago</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Transação" : formData.type === "income" ? "Registrar Receita" : "Registrar Despesa"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Atualize os dados da transação" : "Preencha os dados da transação"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any, category: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === "income" ? incomeCategories : expenseCategories).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {formData.type === "income" && (
                <div>
                  <Label>Paciente (opcional)</Label>
                  <Select
                    value={formData.patientId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, patientId: value ? parseInt(value) : "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descrição da transação"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditMode ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Cancelar Transação
            </DialogTitle>
            <DialogDescription>
              A transação será marcada como cancelada (não será excluída). Informe o motivo do cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Transação</p>
              <p className="font-medium">{selectedTransaction?.description || selectedTransaction?.category}</p>
              <p className="text-lg font-bold mt-1">
                {selectedTransaction?.type === "income" ? "+" : "-"}
                {formatCurrency(selectedTransaction?.value || 0)}
              </p>
            </div>
            <div>
              <Label>Motivo do Cancelamento *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Pagamento recusado pelo cartão, Erro de lançamento, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={updateMutation.isPending}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

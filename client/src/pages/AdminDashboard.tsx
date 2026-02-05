import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Building2, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Shield, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Key,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Clock,
  Ban,
  Play,
  Package
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("clinics");
  
  // Dialog states
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form states
  const [clinicForm, setClinicForm] = useState({
    name: "",
    slug: "",
    cnpj: "",
    phone: "",
    email: "",
    city: "",
    state: "",
  });

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user" as "user" | "admin" | "superadmin",
    clinicId: undefined as number | undefined,
  });

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedClinicForPayment, setSelectedClinicForPayment] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    slug: "",
    price: "",
    billingCycle: "monthly" as "monthly" | "yearly",
    maxUsers: "5",
    maxPatients: "100",
    features: "",
    isActive: true,
  });

  // Queries
  const statsQuery = trpc.admin.stats.useQuery(undefined, {
    enabled: user?.role === "superadmin",
  });
  const clinicsQuery = trpc.admin.clinics.list.useQuery(undefined, {
    enabled: user?.role === "superadmin",
  });
  const usersQuery = trpc.admin.users.list.useQuery(undefined, {
    enabled: user?.role === "superadmin",
  });
  const plansQuery = trpc.admin.plans.list.useQuery(undefined, {
    enabled: user?.role === "superadmin",
  });
  const subscriptionStatsQuery = trpc.admin.subscriptions.stats.useQuery(undefined, {
    enabled: user?.role === "superadmin",
  });
  const clinicsWithStatusQuery = trpc.admin.subscriptions.listClinicsWithStatus.useQuery(undefined, {
    enabled: user?.role === "superadmin",
  });

  // Mutations
  const createClinicMutation = trpc.admin.clinics.create.useMutation({
    onSuccess: () => {
      toast.success("Clínica criada com sucesso!");
      clinicsQuery.refetch();
      setClinicDialogOpen(false);
      resetClinicForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateClinicMutation = trpc.admin.clinics.update.useMutation({
    onSuccess: () => {
      toast.success("Clínica atualizada com sucesso!");
      clinicsQuery.refetch();
      setClinicDialogOpen(false);
      setEditingClinic(null);
      resetClinicForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteClinicMutation = trpc.admin.clinics.delete.useMutation({
    onSuccess: () => {
      toast.success("Clínica excluída com sucesso!");
      clinicsQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const createUserMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      usersQuery.refetch();
      setUserDialogOpen(false);
      resetUserForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateUserMutation = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      usersQuery.refetch();
      setUserDialogOpen(false);
      setEditingUser(null);
      resetUserForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteUserMutation = trpc.admin.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      usersQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetPasswordMutation = trpc.admin.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha resetada com sucesso!");
    },
    onError: (error) => toast.error(error.message),
  });

  // Subscription mutations
  const updateClinicPlanMutation = trpc.admin.subscriptions.updateClinicPlan.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!");
      clinicsWithStatusQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStatusMutation = trpc.admin.subscriptions.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      clinicsWithStatusQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const registerPaymentMutation = trpc.admin.subscriptions.registerPayment.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      clinicsWithStatusQuery.refetch();
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setSelectedClinicForPayment(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const suspendClinicMutation = trpc.admin.subscriptions.suspendClinic.useMutation({
    onSuccess: () => {
      toast.success("Clínica suspensa!");
      clinicsWithStatusQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const reactivateClinicMutation = trpc.admin.subscriptions.reactivateClinic.useMutation({
    onSuccess: () => {
      toast.success("Clínica reativada!");
      clinicsWithStatusQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Plan mutations
  const createPlanMutation = trpc.admin.plans.create.useMutation({
    onSuccess: () => {
      toast.success("Plano criado com sucesso!");
      plansQuery.refetch();
      setPlanDialogOpen(false);
      resetPlanForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updatePlanMutation = trpc.admin.plans.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!");
      plansQuery.refetch();
      setPlanDialogOpen(false);
      setEditingPlan(null);
      resetPlanForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deletePlanMutation = trpc.admin.plans.delete.useMutation({
    onSuccess: () => {
      toast.success("Plano excluído com sucesso!");
      plansQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetClinicForm = () => {
    setClinicForm({ name: "", slug: "", cnpj: "", phone: "", email: "", city: "", state: "" });
  };

  const resetUserForm = () => {
    setUserForm({ name: "", email: "", password: "", phone: "", role: "user", clinicId: undefined });
  };

  const resetPlanForm = () => {
    setPlanForm({ name: "", slug: "", price: "", billingCycle: "monthly", maxUsers: "5", maxPatients: "100", features: "", isActive: true });
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || "",
      slug: plan.slug || "",
      price: plan.price?.toString() || "",
      billingCycle: plan.billingCycle || "monthly",
      maxUsers: plan.maxUsers?.toString() || "5",
      maxPatients: plan.maxPatients?.toString() || "100",
      features: plan.features || "",
      isActive: plan.isActive ?? true,
    });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = () => {
    const data = {
      name: planForm.name,
      slug: planForm.slug || planForm.name.toLowerCase().replace(/\s+/g, '-'),
      price: planForm.price,
      billingCycle: planForm.billingCycle,
      maxUsers: parseInt(planForm.maxUsers) || 5,
      maxPatients: parseInt(planForm.maxPatients) || 100,
      features: planForm.features || undefined,
      isActive: planForm.isActive,
    };
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, ...data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleEditClinic = (clinic: any) => {
    setEditingClinic(clinic);
    setClinicForm({
      name: clinic.name || "",
      slug: clinic.slug || "",
      cnpj: clinic.cnpj || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      city: clinic.city || "",
      state: clinic.state || "",
    });
    setClinicDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role: user.role || "user",
      clinicId: user.clinicId || undefined,
    });
    setUserDialogOpen(true);
  };

  const handleSaveClinic = () => {
    if (editingClinic) {
      updateClinicMutation.mutate({ id: editingClinic.id, ...clinicForm });
    } else {
      createClinicMutation.mutate(clinicForm);
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        name: userForm.name,
        phone: userForm.phone || undefined,
        role: userForm.role,
        clinicId: userForm.clinicId || null,
      });
    } else {
      if (!userForm.password) {
        toast.error("Senha é obrigatória para novos usuários");
        return;
      }
      createUserMutation.mutate(userForm);
    }
  };

  const handleResetPassword = (userId: number) => {
    const newPassword = prompt("Digite a nova senha (mínimo 6 caracteres):");
    if (newPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ id: userId, newPassword });
    } else if (newPassword) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
    }
  };

  const handleRegisterPayment = () => {
    if (!selectedClinicForPayment || !paymentAmount) return;
    registerPaymentMutation.mutate({
      clinicId: selectedClinicForPayment,
      amount: parseFloat(paymentAmount),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      trial: { label: "Trial", className: "bg-blue-100 text-blue-700" },
      active: { label: "Ativo", className: "bg-green-100 text-green-700" },
      past_due: { label: "Inadimplente", className: "bg-yellow-100 text-yellow-700" },
      canceled: { label: "Cancelado", className: "bg-gray-100 text-gray-700" },
      suspended: { label: "Suspenso", className: "bg-red-100 text-red-700" },
    };
    const config = statusConfig[status] || statusConfig.trial;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user || user.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para administradores do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">Gerenciamento de Clínicas e Usuários</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Clínicas</p>
                  <p className="text-2xl font-bold">{statsQuery.data?.totalClinics || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Clínicas Ativas</p>
                  <p className="text-2xl font-bold">{statsQuery.data?.activeClinics || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Usuários</p>
                  <p className="text-2xl font-bold">{statsQuery.data?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{statsQuery.data?.activeUsers || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="clinics" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Clínicas
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Planos
            </TabsTrigger>
          </TabsList>

          {/* Clinics Tab */}
          <TabsContent value="clinics">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clínicas Cadastradas</CardTitle>
                  <CardDescription>Gerencie as clínicas do sistema</CardDescription>
                </div>
                <Dialog open={clinicDialogOpen} onOpenChange={(open) => {
                  setClinicDialogOpen(open);
                  if (!open) {
                    setEditingClinic(null);
                    resetClinicForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Clínica
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingClinic ? "Editar Clínica" : "Nova Clínica"}</DialogTitle>
                      <DialogDescription>
                        {editingClinic ? "Atualize os dados da clínica" : "Preencha os dados da nova clínica"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={clinicForm.name}
                            onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                            placeholder="Nome da clínica"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug *</Label>
                          <Input
                            value={clinicForm.slug}
                            onChange={(e) => setClinicForm({ ...clinicForm, slug: e.target.value })}
                            placeholder="identificador-unico"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input
                            value={clinicForm.cnpj}
                            onChange={(e) => setClinicForm({ ...clinicForm, cnpj: e.target.value })}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input
                            value={clinicForm.phone}
                            onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                            placeholder="(00) 0000-0000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={clinicForm.email}
                          onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                          placeholder="clinica@email.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Input
                            value={clinicForm.city}
                            onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                            placeholder="Cidade"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Input
                            value={clinicForm.state}
                            onChange={(e) => setClinicForm({ ...clinicForm, state: e.target.value })}
                            placeholder="UF"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setClinicDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveClinic}
                        disabled={createClinicMutation.isPending || updateClinicMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {(createClinicMutation.isPending || updateClinicMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingClinic ? "Salvar" : "Criar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinicsQuery.data?.map((clinic) => (
                      <TableRow key={clinic.id}>
                        <TableCell className="font-medium">{clinic.name}</TableCell>
                        <TableCell className="text-gray-500">{clinic.slug}</TableCell>
                        <TableCell>{clinic.email || "-"}</TableCell>
                        <TableCell>{clinic.city ? `${clinic.city}/${clinic.state}` : "-"}</TableCell>
                        <TableCell>
                          {clinic.isActive ? (
                            <Badge className="bg-green-100 text-green-700">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClinic(clinic)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir esta clínica?")) {
                                deleteClinicMutation.mutate({ id: clinic.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!clinicsQuery.data || clinicsQuery.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhuma clínica cadastrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Receita Mensal</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {(subscriptionStatsQuery.data?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Assinaturas Ativas</p>
                        <p className="text-2xl font-bold">{subscriptionStatsQuery.data?.active || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Inadimplentes</p>
                        <p className="text-2xl font-bold text-yellow-600">{subscriptionStatsQuery.data?.pastDue || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Em Trial</p>
                        <p className="text-2xl font-bold text-blue-600">{subscriptionStatsQuery.data?.trial || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Clinics with Subscription Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Assinaturas</CardTitle>
                  <CardDescription>Controle planos, pagamentos e status de cada clínica</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clínica</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Próx. Pagamento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clinicsWithStatusQuery.data?.map((clinic) => (
                        <TableRow key={clinic.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{clinic.name}</div>
                              <div className="text-sm text-gray-500">{clinic.email || "-"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={clinic.planId?.toString() || ""}
                              onValueChange={(value) => {
                                updateClinicPlanMutation.mutate({
                                  clinicId: clinic.id,
                                  planId: parseInt(value),
                                });
                              }}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {plansQuery.data?.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.id.toString()}>
                                    {plan.name} - R$ {Number(plan.price).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={clinic.subscriptionStatus || "trial"}
                              onValueChange={(value) => {
                                updateStatusMutation.mutate({
                                  clinicId: clinic.id,
                                  status: value as "trial" | "active" | "past_due" | "canceled" | "suspended",
                                });
                              }}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue>
                                  {getStatusBadge(clinic.subscriptionStatus || "trial")}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="past_due">Inadimplente</SelectItem>
                                <SelectItem value="canceled">Cancelado</SelectItem>
                                <SelectItem value="suspended">Suspenso</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {clinic.nextPaymentAt
                              ? new Date(clinic.nextPaymentAt).toLocaleDateString('pt-BR')
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedClinicForPayment(clinic.id);
                                  setPaymentDialogOpen(true);
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagamento
                              </Button>
                              {clinic.subscriptionStatus === "suspended" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => reactivateClinicMutation.mutate({ clinicId: clinic.id })}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Reativar
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => suspendClinicMutation.mutate({ clinicId: clinic.id })}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Suspender
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!clinicsWithStatusQuery.data || clinicsWithStatusQuery.data.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Nenhuma clínica cadastrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Dialog */}
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                    <DialogDescription>
                      Registrar pagamento manual para a clínica
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRegisterPayment}
                      disabled={registerPaymentMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {registerPaymentMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Registrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>Gerencie os usuários e suas permissões</CardDescription>
                </div>
                <Dialog open={userDialogOpen} onOpenChange={(open) => {
                  setUserDialogOpen(open);
                  if (!open) {
                    setEditingUser(null);
                    resetUserForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                      <DialogDescription>
                        {editingUser ? "Atualize os dados do usuário" : "Preencha os dados do novo usuário"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          disabled={!!editingUser}
                        />
                      </div>
                      {!editingUser && (
                        <div className="space-y-2">
                          <Label>Senha *</Label>
                          <Input
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={userForm.phone}
                          onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value: "user" | "admin" | "superadmin") => 
                            setUserForm({ ...userForm, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Clínica</Label>
                        <Select
                          value={userForm.clinicId?.toString() || "none"}
                          onValueChange={(value) => 
                            setUserForm({ ...userForm, clinicId: value === "none" ? undefined : parseInt(value) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma clínica" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {clinicsQuery.data?.map((clinic) => (
                              <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                {clinic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveUser}
                        disabled={createUserMutation.isPending || updateUserMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {(createUserMutation.isPending || updateUserMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingUser ? "Salvar" : "Criar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "-"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "superadmin" ? "default" : "secondary"}>
                            {u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {clinicsQuery.data?.find(c => c.id === u.clinicId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResetPassword(u.id)}
                            title="Resetar senha"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(u)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir este usuário?")) {
                                deleteUserMutation.mutate({ id: u.id });
                              }
                            }}
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!usersQuery.data || usersQuery.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhum usuário cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Planos de Assinatura</CardTitle>
                  <CardDescription>Gerencie os planos disponíveis para as clínicas</CardDescription>
                </div>
                <Dialog open={planDialogOpen} onOpenChange={(open) => {
                  setPlanDialogOpen(open);
                  if (!open) {
                    setEditingPlan(null);
                    resetPlanForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
                      <DialogDescription>
                        {editingPlan ? "Atualize os dados do plano" : "Configure um novo plano de assinatura"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome do Plano *</Label>
                          <Input
                            value={planForm.name}
                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                            placeholder="Ex: Básico, Profissional, Enterprise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug (identificador)</Label>
                          <Input
                            value={planForm.slug}
                            onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                            placeholder="basico, profissional, enterprise"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preço (R$) *</Label>
                          <Input
                            value={planForm.price}
                            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                            placeholder="199.90"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ciclo de Cobrança</Label>
                          <Select
                            value={planForm.billingCycle}
                            onValueChange={(value: "monthly" | "yearly") => setPlanForm({ ...planForm, billingCycle: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Máx. Usuários</Label>
                          <Input
                            type="number"
                            value={planForm.maxUsers}
                            onChange={(e) => setPlanForm({ ...planForm, maxUsers: e.target.value })}
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máx. Pacientes</Label>
                          <Input
                            type="number"
                            value={planForm.maxPatients}
                            onChange={(e) => setPlanForm({ ...planForm, maxPatients: e.target.value })}
                            placeholder="100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Recursos Incluídos</Label>
                        <textarea
                          className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                          value={planForm.features}
                          onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                          placeholder="Descreva os recursos incluídos neste plano (um por linha):\n- Agenda ilimitada\n- Prontuário eletrônico\n- Relatórios básicos"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={planForm.isActive}
                          onCheckedChange={(checked: boolean) => setPlanForm({ ...planForm, isActive: checked })}
                        />
                        <Label>Plano ativo (disponível para contratação)</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSavePlan}
                        disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingPlan ? "Salvar" : "Criar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Limites</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansQuery.data?.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>R$ {plan.price}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {plan.billingCycle === "monthly" ? "Mensal" : "Anual"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{plan.maxUsers || "∞"} usuários</div>
                            <div className="text-gray-500">{plan.maxPatients || "∞"} pacientes</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.isActive ? (
                            <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir este plano?")) {
                                deletePlanMutation.mutate({ id: plan.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!plansQuery.data || plansQuery.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhum plano cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

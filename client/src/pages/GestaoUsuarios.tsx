import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, Trash2, Edit, Users, Mail, Shield, Settings, Eye, EyeOff, Save, RefreshCw } from "lucide-react";

const ROLES = [
  { value: "owner", label: "Proprietário", color: "bg-purple-500", description: "Acesso total ao sistema" },
  { value: "admin", label: "Administrador", color: "bg-blue-500", description: "Gerencia usuários e configurações" },
  { value: "atendente", label: "Atendente", color: "bg-green-500", description: "Recepção e agendamentos" },
  { value: "dentista", label: "Dentista", color: "bg-orange-500", description: "Atendimento clínico geral" },
  { value: "protesista", label: "Protesista", color: "bg-pink-500", description: "Próteses dentárias" },
  { value: "ortodontista", label: "Ortodontista", color: "bg-cyan-500", description: "Ortodontia e aparelhos" },
  { value: "implantodontista", label: "Implantodontista", color: "bg-indigo-500", description: "Implantes dentários" },
  { value: "bucomaxilo", label: "Buco-Maxilo-Facial", color: "bg-red-500", description: "Cirurgias buco-maxilo-faciais" },
  { value: "odontopediatria", label: "Odontopediatria", color: "bg-yellow-500", description: "Atendimento infantil" },
] as const;

type RoleValue = typeof ROLES[number]["value"];

// Definição das áreas do sistema
const PERMISSION_AREAS = [
  { key: "canViewPainel", label: "Painel", category: "principal" },
  { key: "canViewAtendente", label: "Atendente", category: "principal" },
  { key: "canViewPacientes", label: "Pacientes", category: "principal" },
  { key: "canViewProntuarios", label: "Prontuários", category: "principal" },
  { key: "canViewAgenda", label: "Agenda", category: "principal" },
  { key: "canViewOrcamentista", label: "Orçamentista", category: "principal" },
  { key: "canViewAreaDentista", label: "Área Dentista", category: "especializada" },
  { key: "canViewAreaOrtodontista", label: "Área Ortodontista", category: "especializada" },
  { key: "canViewAreaImplantodontista", label: "Área Implantodontista", category: "especializada" },
  { key: "canViewAreaProtesista", label: "Área Protesista", category: "especializada" },
  { key: "canViewAreaBucomaxilo", label: "Área Buco-Maxilo", category: "especializada" },
  { key: "canViewAreaOdontopediatria", label: "Área Odontopediatria", category: "especializada" },
  { key: "canViewProcedimentos", label: "Procedimentos", category: "gestao" },
  { key: "canViewDentistas", label: "Dentistas", category: "gestao" },
  { key: "canViewProteses", label: "Próteses", category: "gestao" },
  { key: "canViewFinanceiro", label: "Financeiro", category: "gestao" },
  { key: "canViewConvenios", label: "Convênios", category: "gestao" },
  { key: "canViewEstoque", label: "Estoque", category: "gestao" },
  { key: "canViewRelatorios", label: "Relatórios", category: "analises" },
  { key: "canViewAnaliseIA", label: "Análise de IA", category: "analises" },
  { key: "canViewQRCheckin", label: "QR Check-in", category: "analises" },
  { key: "canViewPainelTV", label: "Painel TV", category: "analises" },
  { key: "canViewNotificacoes", label: "Notificações", category: "sistema" },
  { key: "canViewGestaoUsuarios", label: "Gestão de Usuários", category: "sistema" },
  { key: "canViewConfiguracoes", label: "Configurações", category: "sistema" },
  { key: "canViewAdmin", label: "Admin Clínicas", category: "sistema" },
];

const CATEGORIES = [
  { key: "principal", label: "Áreas Principais", color: "bg-blue-100 border-blue-300" },
  { key: "especializada", label: "Áreas Especializadas", color: "bg-green-100 border-green-300" },
  { key: "gestao", label: "Gestão", color: "bg-orange-100 border-orange-300" },
  { key: "analises", label: "Análises", color: "bg-purple-100 border-purple-300" },
  { key: "sistema", label: "Sistema", color: "bg-gray-100 border-gray-300" },
];

export default function GestaoUsuarios() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<RoleValue>("atendente");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: number; role: string } | null>(null);
  const [editingPassword, setEditingPassword] = useState<{ id: number; password: string } | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleValue>("atendente");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const utils = trpc.useUtils();

  // Buscar todos os usuários do sistema
  const { data: allUsers, isLoading: loadingUsers } = trpc.admin.users.list.useQuery(undefined, {
    retry: false,
  });

  // Buscar permissões
  const { data: allPermissions, isLoading: loadingPermissions } = trpc.admin.permissions.list.useQuery(undefined, {
    retry: false,
  });

  // Buscar permissões do cargo selecionado
  const { data: rolePermissions, isLoading: loadingRolePermissions } = trpc.admin.permissions.getByRole.useQuery(
    { role: selectedRole },
    { enabled: !!selectedRole }
  );

  // Atualizar permissões locais quando carregar do servidor
  useEffect(() => {
    if (rolePermissions) {
      const perms: Record<string, boolean> = {};
      PERMISSION_AREAS.forEach(area => {
        perms[area.key] = (rolePermissions as any)[area.key] ?? false;
      });
      setPermissions(perms);
      setHasChanges(false);
    } else if (!loadingRolePermissions) {
      // Se não há permissões salvas, usar defaults
      const perms: Record<string, boolean> = {};
      PERMISSION_AREAS.forEach(area => {
        perms[area.key] = false;
      });
      setPermissions(perms);
      setHasChanges(false);
    }
  }, [rolePermissions, loadingRolePermissions, selectedRole]);

  // Mutation para criar usuário
  const createUserMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário adicionado com sucesso!");
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("atendente");
      utils.admin.users.list.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao adicionar usuário");
    },
  });

  // Mutation para atualizar usuário
  const updateUserMutation = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!");
      setEditingUser(null);
      utils.admin.users.list.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao atualizar cargo");
    },
  });

  // Mutation para remover usuário
  const deleteUserMutation = trpc.admin.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido com sucesso!");
      setDeleteConfirmId(null);
      utils.admin.users.list.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao remover usuário");
    },
  });

  // Mutation para alterar senha
  const resetPasswordMutation = trpc.admin.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setEditingPassword(null);
      setShowEditPassword(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });

  const handleResetPassword = () => {
    if (!editingPassword) return;
    if (editingPassword.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    resetPasswordMutation.mutate({
      id: editingPassword.id,
      newPassword: editingPassword.password,
    });
  };

  // Mutation para salvar permissões
  const updatePermissionsMutation = trpc.admin.permissions.update.useMutation({
    onSuccess: () => {
      toast.success("Permissões salvas com sucesso!");
      setHasChanges(false);
      utils.admin.permissions.list.invalidate();
      utils.admin.permissions.getByRole.invalidate({ role: selectedRole });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao salvar permissões");
    },
  });

  // Mutation para inicializar permissões padrão
  const initPermissionsMutation = trpc.admin.permissions.initializeDefaults.useMutation({
    onSuccess: () => {
      toast.success("Permissões padrão inicializadas!");
      utils.admin.permissions.list.invalidate();
      utils.admin.permissions.getByRole.invalidate({ role: selectedRole });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao inicializar permissões");
    },
  });

  const handleAddUser = () => {
    if (!newUserEmail) {
      toast.error("Informe o email do usuário");
      return;
    }
    if (!newUserName) {
      toast.error("Informe o nome do usuário");
      return;
    }
    if (!newUserPassword) {
      toast.error("Informe a senha do usuário");
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    createUserMutation.mutate({
      email: newUserEmail,
      password: newUserPassword,
      name: newUserName,
      role: "user",
      clinicRole: newUserRole,
    });
  };

  const handleUpdateRole = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.id,
      role: editingUser.role as "user" | "admin" | "superadmin",
    });
  };

  const handlePermissionChange = (key: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    updatePermissionsMutation.mutate({
      role: selectedRole,
      permissions: permissions,
    });
  };

  const handleSelectAllCategory = (category: string, value: boolean) => {
    const categoryAreas = PERMISSION_AREAS.filter(a => a.category === category);
    const newPerms = { ...permissions };
    categoryAreas.forEach(area => {
      newPerms[area.key] = value;
    });
    setPermissions(newPerms);
    setHasChanges(true);
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = ROLES.find(r => r.value === role);
    if (roleInfo) {
      return (
        <Badge className={`${roleInfo.color} text-white`}>
          {roleInfo.label}
        </Badge>
      );
    }
    const systemRoles: Record<string, { label: string; color: string }> = {
      user: { label: "Usuário", color: "bg-gray-500" },
      admin: { label: "Admin", color: "bg-blue-500" },
      superadmin: { label: "Super Admin", color: "bg-purple-500" },
    };
    const sysRole = systemRoles[role] || { label: role, color: "bg-gray-500" };
    return (
      <Badge className={`${sysRole.color} text-white`}>
        {sysRole.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie usuários e configure permissões por cargo</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissões
            </TabsTrigger>
          </TabsList>

          {/* Aba de Usuários */}
          <TabsContent value="usuarios" className="space-y-6">
            {/* Formulário para Adicionar Usuário */}
            <Card className="border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <UserPlus className="h-5 w-5" />
                  Adicionar Novo Usuário
                </CardTitle>
                <CardDescription>
                  Informe o email, nome, senha e selecione o cargo do novo usuário.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Usuário</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email do Usuário
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@email.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="border-orange-200 focus:border-orange-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Cargo / Função
                    </Label>
                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as RoleValue)}>
                      <SelectTrigger className="border-orange-200 focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                              {role.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddUser}
                      disabled={!newUserEmail || !newUserName || !newUserPassword || createUserMutation.isPending}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      {createUserMutation.isPending ? "Adicionando..." : "Adicionar Usuário"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários Cadastrados
                </CardTitle>
                <CardDescription>
                  {allUsers?.length || 0} usuário(s) no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : allUsers && allUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Cadastrado em</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || "-"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {editingUser?.id === user.id ? (
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={editingUser?.role || "user"} 
                                  onValueChange={(v) => editingUser && setEditingUser({ id: editingUser.id, role: v })}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleUpdateRole} disabled={updateUserMutation.isPending}>
                                  Salvar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              getRoleBadge(user.role)
                            )}
                          </TableCell>
                          <TableCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell>
                            {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {editingUser?.id !== user.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUser({ id: user.id, role: user.role })}
                                  title="Editar cargo"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setEditingPassword({ id: user.id, password: "" });
                                  setShowEditPassword(false);
                                }}
                                title="Alterar senha"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteConfirmId(user.id)}
                                title="Remover usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Nenhum usuário cadastrado</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Use o formulário acima para adicionar o primeiro usuário
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Permissões */}
          <TabsContent value="permissoes" className="space-y-6">
            {/* Seleção de Cargo */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Settings className="h-5 w-5" />
                  Configurar Permissões por Cargo
                </CardTitle>
                <CardDescription>
                  Selecione um cargo e defina quais áreas do sistema ele pode acessar
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="selectRole" className="mb-2 block">Selecione o Cargo</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as RoleValue)}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                              {role.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => initPermissionsMutation.mutate()}
                      disabled={initPermissionsMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${initPermissionsMutation.isPending ? 'animate-spin' : ''}`} />
                      Restaurar Padrões
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={!hasChanges || updatePermissionsMutation.isPending}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updatePermissionsMutation.isPending ? "Salvando..." : "Salvar Permissões"}
                    </Button>
                  </div>
                </div>
                {hasChanges && (
                  <p className="text-sm text-amber-600 mt-2">
                    * Você tem alterações não salvas
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Grid de Permissões por Categoria */}
            {loadingRolePermissions ? (
              <div className="text-center py-8 text-gray-500">Carregando permissões...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map((category) => {
                  const categoryAreas = PERMISSION_AREAS.filter(a => a.category === category.key);
                  const allChecked = categoryAreas.every(a => permissions[a.key]);
                  const someChecked = categoryAreas.some(a => permissions[a.key]);
                  
                  return (
                    <Card key={category.key} className={`border-2 ${category.color}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.label}</CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {someChecked ? (allChecked ? "Todos" : "Parcial") : "Nenhum"}
                            </span>
                            <Checkbox
                              checked={allChecked}
                              onCheckedChange={(checked) => handleSelectAllCategory(category.key, !!checked)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {categoryAreas.map((area) => (
                          <div key={area.key} className="flex items-center justify-between py-1">
                            <Label htmlFor={area.key} className="flex items-center gap-2 cursor-pointer">
                              {permissions[area.key] ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                              {area.label}
                            </Label>
                            <Switch
                              id={area.key}
                              checked={permissions[area.key] || false}
                              onCheckedChange={(checked) => handlePermissionChange(area.key, checked)}
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Legenda dos Cargos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Cargos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {ROLES.map((role) => (
                    <div 
                      key={role.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRole === role.value 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'bg-white hover:shadow-md'
                      }`}
                      onClick={() => setSelectedRole(role.value)}
                    >
                      <Badge className={`${role.color} text-white mb-2`}>
                        {role.label}
                      </Badge>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteConfirmId && deleteUserMutation.mutate({ id: deleteConfirmId })}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Removendo..." : "Remover Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Alteração de Senha */}
        <Dialog open={editingPassword !== null} onOpenChange={() => {
          setEditingPassword(null);
          setShowEditPassword(false);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Digite a nova senha para este usuário. A senha deve ter pelo menos 6 caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative mt-2">
                <Input
                  id="newPassword"
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={editingPassword?.password || ""}
                  onChange={(e) => setEditingPassword(prev => prev ? { ...prev, password: e.target.value } : null)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingPassword(null);
                setShowEditPassword(false);
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleResetPassword}
                disabled={!editingPassword?.password || editingPassword.password.length < 6 || resetPasswordMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {resetPasswordMutation.isPending ? "Salvando..." : "Salvar Senha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

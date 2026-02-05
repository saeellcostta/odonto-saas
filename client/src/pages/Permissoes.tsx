import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Shield, Users, Plus, Key, Eye, Edit, Trash2, 
  CheckCircle, XCircle, User
} from "lucide-react";

const MODULES = [
  { id: "dashboard", name: "Dashboard", description: "Visualizar estatísticas e métricas" },
  { id: "patients", name: "Pacientes", description: "Gerenciar cadastro de pacientes" },
  { id: "appointments", name: "Agenda", description: "Gerenciar agendamentos" },
  { id: "dentists", name: "Dentistas", description: "Gerenciar cadastro de dentistas" },
  { id: "procedures", name: "Procedimentos", description: "Gerenciar procedimentos e preços" },
  { id: "financial", name: "Financeiro", description: "Gerenciar receitas e despesas" },
  { id: "stock", name: "Estoque", description: "Gerenciar estoque de materiais" },
  { id: "budgets", name: "Orçamentos", description: "Criar e gerenciar orçamentos" },
  { id: "prosthesis", name: "Próteses", description: "Gerenciar pedidos de próteses" },
  { id: "reports", name: "Relatórios", description: "Visualizar relatórios" },
  { id: "settings", name: "Configurações", description: "Configurações do sistema" },
  { id: "users", name: "Usuários", description: "Gerenciar usuários e permissões" },
];

const DEFAULT_PROFILES = [
  {
    name: "Administrador",
    description: "Acesso total ao sistema",
    permissions: MODULES.reduce((acc, m) => ({ ...acc, [m.id]: { view: true, create: true, edit: true, delete: true } }), {}),
  },
  {
    name: "Dentista",
    description: "Acesso a pacientes, agenda e prontuários",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      patients: { view: true, create: true, edit: true, delete: false },
      appointments: { view: true, create: true, edit: true, delete: false },
      budgets: { view: true, create: true, edit: true, delete: false },
      procedures: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    name: "Atendente",
    description: "Acesso a agenda, pacientes e filas",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      patients: { view: true, create: true, edit: true, delete: false },
      appointments: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    name: "Orçamentista",
    description: "Acesso a orçamentos e procedimentos",
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      patients: { view: true, create: false, edit: false, delete: false },
      budgets: { view: true, create: true, edit: true, delete: false },
      procedures: { view: true, create: false, edit: false, delete: false },
    },
  },
];

export default function Permissoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>,
  });

  const { data: profiles, refetch } = trpc.accessProfiles.list.useQuery();

  const createMutation = trpc.accessProfiles.create.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: () => toast.error("Erro ao criar perfil"),
  });

  const deleteMutation = trpc.accessProfiles.delete.useMutation({
    onSuccess: () => {
      toast.success("Perfil excluído!");
      refetch();
    },
  });

  const handleCreate = () => {
    if (!newProfile.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate({
      name: newProfile.name,
      description: newProfile.description,
      permissions: JSON.stringify(newProfile.permissions),
    });
  };

  const togglePermission = (moduleId: string, permission: "view" | "create" | "edit" | "delete") => {
    setNewProfile(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          view: prev.permissions[moduleId]?.view ?? false,
          create: prev.permissions[moduleId]?.create ?? false,
          edit: prev.permissions[moduleId]?.edit ?? false,
          delete: prev.permissions[moduleId]?.delete ?? false,
          [permission]: !prev.permissions[moduleId]?.[permission],
        },
      },
    }));
  };

  const applyDefaultProfile = (profile: typeof DEFAULT_PROFILES[0]) => {
    setNewProfile({
      name: profile.name,
      description: profile.description,
      permissions: profile.permissions as any,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permissões</h1>
            <p className="text-gray-500 mt-1">Gerencie perfis de acesso e permissões</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Perfil de Acesso</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Quick Templates */}
                <div className="space-y-2">
                  <Label>Usar modelo predefinido</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DEFAULT_PROFILES.map((profile) => (
                      <Button
                        key={profile.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyDefaultProfile(profile)}
                      >
                        {profile.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Perfil *</Label>
                    <Input
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      placeholder="Ex: Recepcionista"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={newProfile.description}
                      onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                      placeholder="Descrição do perfil"
                    />
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="space-y-2">
                  <Label>Permissões por Módulo</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-48">Módulo</TableHead>
                          <TableHead className="text-center w-24">Visualizar</TableHead>
                          <TableHead className="text-center w-24">Criar</TableHead>
                          <TableHead className="text-center w-24">Editar</TableHead>
                          <TableHead className="text-center w-24">Excluir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {MODULES.map((module) => (
                          <TableRow key={module.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{module.name}</p>
                                <p className="text-xs text-gray-500">{module.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={newProfile.permissions[module.id]?.view ?? false}
                                onCheckedChange={() => togglePermission(module.id, "view")}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={newProfile.permissions[module.id]?.create ?? false}
                                onCheckedChange={() => togglePermission(module.id, "create")}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={newProfile.permissions[module.id]?.edit ?? false}
                                onCheckedChange={() => togglePermission(module.id, "edit")}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={newProfile.permissions[module.id]?.delete ?? false}
                                onCheckedChange={() => togglePermission(module.id, "delete")}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate}>Criar Perfil</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profiles" className="gap-2">
              <Shield className="h-4 w-4" />
              Perfis de Acesso
            </TabsTrigger>
            <TabsTrigger value="default" className="gap-2">
              <Key className="h-4 w-4" />
              Perfis Padrão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Perfis Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profiles?.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhum perfil cadastrado</p>
                    <p className="text-sm mt-2">Crie um novo perfil ou use os perfis padrão</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles?.map((profile) => {
                      const permissions = profile.permissions ? JSON.parse(profile.permissions) : {};
                      const moduleCount = Object.keys(permissions).length;
                      
                      return (
                        <Card key={profile.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 rounded-lg">
                                  <Shield className="h-5 w-5 text-teal-600" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{profile.name}</h3>
                                  <p className="text-sm text-gray-500">{profile.description || "Sem descrição"}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => deleteMutation.mutate({ id: profile.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm text-gray-500">
                                {moduleCount} módulo(s) com permissões
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="default">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEFAULT_PROFILES.map((profile) => (
                <Card key={profile.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {profile.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{profile.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {MODULES.map((module) => {
                        const perms = (profile.permissions as any)[module.id];
                        if (!perms) return null;
                        
                        return (
                          <div key={module.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{module.name}</span>
                            <div className="flex gap-2">
                              {perms.view && <Badge variant="outline" className="text-xs"><Eye className="h-3 w-3 mr-1" />Ver</Badge>}
                              {perms.create && <Badge variant="outline" className="text-xs"><Plus className="h-3 w-3 mr-1" />Criar</Badge>}
                              {perms.edit && <Badge variant="outline" className="text-xs"><Edit className="h-3 w-3 mr-1" />Editar</Badge>}
                              {perms.delete && <Badge variant="outline" className="text-xs"><Trash2 className="h-3 w-3 mr-1" />Excluir</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

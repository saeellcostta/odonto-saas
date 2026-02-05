import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, RotateCcw, Shield, Users, Stethoscope, Smile, Bone, Crown, Skull, Baby, Info } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { id: "atendente", name: "Atendente", description: "Recepcionista e atendimento ao paciente", icon: Users },
  { id: "dentista", name: "Dentista", description: "Dentista clínico geral", icon: Stethoscope },
  { id: "ortodontista", name: "Ortodontista", description: "Especialista em ortodontia", icon: Smile },
  { id: "implantodontista", name: "Implantodontista", description: "Especialista em implantes", icon: Bone },
  { id: "protesista", name: "Protesista", description: "Especialista em próteses", icon: Crown },
  { id: "bucomaxilo", name: "Buco-Maxilo-Facial", description: "Cirurgião buco-maxilo-facial", icon: Skull },
  { id: "odontopediatria", name: "Odontopediatria", description: "Especialista em odontopediatria", icon: Baby },
];

const PERMISSION_CATEGORIES = {
  "Principal": [
    { key: "canViewPainel", label: "Painel", description: "Dashboard principal" },
    { key: "canViewAtendente", label: "Atendente", description: "Área do atendente" },
    { key: "canViewPacientes", label: "Pacientes", description: "Cadastro de pacientes" },
    { key: "canViewProntuarios", label: "Prontuários", description: "Prontuários eletrônicos" },
    { key: "canViewAgenda", label: "Agenda", description: "Agendamento de consultas" },
    { key: "canViewOrcamentista", label: "Orçamentista", description: "Área do orçamentista" },
  ],
  "Áreas Especializadas": [
    { key: "canViewAreaDentista", label: "Área do Dentista", description: "Consultas e atendimentos" },
    { key: "canViewAreaOrtodontista", label: "Área Ortodontista", description: "Tratamentos ortodônticos" },
    { key: "canViewAreaImplantodontista", label: "Área Implantodontista", description: "Implantes dentários" },
    { key: "canViewAreaProtesista", label: "Área Protesista", description: "Próteses dentárias" },
    { key: "canViewAreaBucomaxilo", label: "Buco-Maxilo-Facial", description: "Cirurgias buco-maxilo" },
    { key: "canViewAreaOdontopediatria", label: "Odontopediatria", description: "Odontologia infantil" },
  ],
  "Gestão": [
    { key: "canViewProcedimentos", label: "Procedimentos", description: "Cadastro de procedimentos" },
    { key: "canViewDentistas", label: "Dentistas", description: "Cadastro de profissionais" },
    { key: "canViewProteses", label: "Próteses", description: "Gestão de próteses" },
    { key: "canViewFinanceiro", label: "Financeiro", description: "Controle financeiro" },
    { key: "canViewConvenios", label: "Convênios", description: "Gestão de convênios" },
    { key: "canViewEstoque", label: "Estoque", description: "Controle de estoque" },
  ],
  "Análises e Ferramentas": [
    { key: "canViewRelatorios", label: "Relatórios", description: "Relatórios e análises" },
    { key: "canViewAnaliseIA", label: "Análise IA", description: "Ferramentas de IA" },
    { key: "canViewQRCheckin", label: "QR Check-in", description: "Check-in por QR Code" },
    { key: "canViewPainelTV", label: "Painel TV", description: "Painel para TV" },
  ],
  "Sistema": [
    { key: "canViewNotificacoes", label: "Notificações", description: "Configuração de notificações" },
    { key: "canViewGestaoUsuarios", label: "Gestão de Usuários", description: "Gerenciar usuários da clínica" },
    { key: "canViewConfiguracoes", label: "Configurações", description: "Configurações da clínica" },
    { key: "canViewAdmin", label: "Admin Clínicas", description: "Administração de múltiplas clínicas" },
  ],
};

type PermissionKey = keyof typeof DEFAULT_PERMISSIONS;

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  canViewPainel: true,
  canViewAtendente: false,
  canViewPacientes: false,
  canViewProntuarios: false,
  canViewAgenda: false,
  canViewOrcamentista: false,
  canViewAreaDentista: false,
  canViewAreaOrtodontista: false,
  canViewAreaImplantodontista: false,
  canViewAreaProtesista: false,
  canViewAreaBucomaxilo: false,
  canViewAreaOdontopediatria: false,
  canViewProcedimentos: false,
  canViewDentistas: false,
  canViewProteses: false,
  canViewFinanceiro: false,
  canViewConvenios: false,
  canViewEstoque: false,
  canViewRelatorios: false,
  canViewAnaliseIA: false,
  canViewQRCheckin: false,
  canViewPainelTV: false,
  canViewNotificacoes: false,
  canViewGestaoUsuarios: false,
  canViewConfiguracoes: false,
  canViewAdmin: false,
};

export default function GestaoPermissoes() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: rolePermissions, isLoading, refetch } = trpc.admin.permissions.getByRole.useQuery(
    { role: selectedRole },
    { enabled: !!selectedRole }
  );

  const updateMutation = trpc.admin.permissions.update.useMutation({
    onSuccess: () => {
      toast.success("Permissões salvas com sucesso!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao salvar permissões: " + error.message);
    },
  });

  const initMutation = trpc.admin.permissions.initializeDefaults.useMutation({
    onSuccess: () => {
      toast.success("Permissões padrão restauradas!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao restaurar permissões: " + error.message);
    },
  });

  useEffect(() => {
    if (rolePermissions) {
      const newPermissions: Record<string, boolean> = { ...DEFAULT_PERMISSIONS };
      Object.keys(DEFAULT_PERMISSIONS).forEach((key) => {
        const value = (rolePermissions as any)[key];
        newPermissions[key] = value === true || value === 1;
      });
      setPermissions(newPermissions);
      setHasChanges(false);
    }
  }, [rolePermissions]);

  const handlePermissionChange = (key: string, value: boolean) => {
    // Painel deve sempre ficar ativo - impedir desativação
    if (key === "canViewPainel" && value === false) {
      toast.error("O Painel deve sempre ficar ativo para que o sistema funcione corretamente.");
      return;
    }
    setPermissions((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      role: selectedRole,
      permissions: permissions as any,
    });
  };

  const handleRestoreDefaults = () => {
    initMutation.mutate();
  };

  const handleSelectAll = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
    const newPermissions = { ...permissions };
    categoryPermissions.forEach((p) => {
      newPermissions[p.key] = true;
    });
    setPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleDeselectAll = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
    const newPermissions = { ...permissions };
    categoryPermissions.forEach((p) => {
      // Painel deve sempre ficar ativo
      if (p.key === "canViewPainel") {
        return; // Não desativa o Painel
      }
      newPermissions[p.key] = false;
    });
    setPermissions(newPermissions);
    setHasChanges(true);
    
    // Avisar se tentou desmarcar categoria que contém o Painel
    if (category === "Principal") {
      toast.info("O Painel permanece ativo pois é necessário para o funcionamento do sistema.");
    }
  };

  const selectedRoleInfo = ROLES.find((r) => r.id === selectedRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Gestão de Permissões
          </h1>
          <p className="text-muted-foreground">
            Configure as permissões de acesso para cada cargo da clínica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRestoreDefaults} disabled={initMutation.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Cargos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Cargos</CardTitle>
            <CardDescription>Selecione um cargo para editar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedRole === role.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "hover:bg-muted border-2 border-transparent"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className={`font-medium ${selectedRole === role.id ? "text-primary" : ""}`}>
                      {role.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Permissões do Cargo */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-3">
              {selectedRoleInfo && <selectedRoleInfo.icon className="h-6 w-6 text-primary" />}
              <div>
                <CardTitle>{selectedRoleInfo?.name}</CardTitle>
                <CardDescription>{selectedRoleInfo?.description}</CardDescription>
              </div>
            </div>
            {hasChanges && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md inline-block mt-2">
                Alterações não salvas
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Tabs defaultValue="Principal" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                  {Object.keys(PERMISSION_CATEGORIES).map((category) => (
                    <TabsTrigger key={category} value={category} className="text-sm">
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">{category}</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleSelectAll(category)}>
                          Marcar Todos
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeselectAll(category)}>
                          Desmarcar Todos
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {perms.map((perm) => {
                        const isPainelObrigatorio = perm.key === "canViewPainel";
                        return (
                          <div
                            key={perm.key}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              isPainelObrigatorio 
                                ? "bg-green-50 border-green-200" 
                                : "bg-card hover:bg-muted/50"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <Label htmlFor={perm.key} className="font-medium cursor-pointer flex items-center gap-2">
                                {perm.label}
                                {isPainelObrigatorio && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Obrigatório
                                  </span>
                                )}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {isPainelObrigatorio 
                                  ? "Sempre ativo - necessário para o funcionamento do sistema" 
                                  : perm.description}
                              </p>
                            </div>
                            <Switch
                              id={perm.key}
                              checked={permissions[perm.key] || false}
                              onCheckedChange={(checked) => handlePermissionChange(perm.key, checked)}
                              disabled={isPainelObrigatorio}
                              className={isPainelObrigatorio ? "opacity-70" : ""}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre as Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            As permissões controlam o que cada cargo pode ver e acessar no sistema. Usuários com cargo de{" "}
            <strong>Admin</strong> ou <strong>Owner</strong> sempre têm acesso total a todas as funcionalidades.
            As alterações são aplicadas imediatamente após salvar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

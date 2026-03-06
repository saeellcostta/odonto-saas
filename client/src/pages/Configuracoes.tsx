import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Building2,
  Bell,
  DoorOpen,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Palette,
  Moon,
  Sun,
  Check,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

// Preset color themes
const colorPresets = [
  { name: "Laranja Dentrics", primary: "oklch(0.70 0.18 55)", sidebar: "oklch(0.25 0.06 30)", accent: "oklch(0.94 0.04 55)" },
  { name: "Azul Clássico", primary: "oklch(0.55 0.15 240)", sidebar: "oklch(0.20 0.04 240)", accent: "oklch(0.94 0.02 240)" },
  { name: "Verde Saúde", primary: "oklch(0.55 0.15 160)", sidebar: "oklch(0.20 0.05 160)", accent: "oklch(0.94 0.03 160)" },
  { name: "Roxo Moderno", primary: "oklch(0.55 0.18 290)", sidebar: "oklch(0.22 0.06 290)", accent: "oklch(0.94 0.04 290)" },
  { name: "Vermelho Elegante", primary: "oklch(0.55 0.20 25)", sidebar: "oklch(0.22 0.05 25)", accent: "oklch(0.94 0.04 25)" },
  { name: "Teal Profissional", primary: "oklch(0.55 0.15 195)", sidebar: "oklch(0.20 0.04 195)", accent: "oklch(0.94 0.02 195)" },
];

export default function Configuracoes() {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [clinicData, setClinicData] = useState({
    name: "",
    cnpj: "",
    cro: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    openTime: "08:00",
    closeTime: "18:00",
    appointmentDuration: 30,
    logoUrl: "",
    logoData: "", // Logo como base64 data URL
  });

  const [notifications, setNotifications] = useState({
    emailReminder: true,
    smsReminder: false,
    whatsappReminder: true,
    reminderTime: "24",
  });

  // Appearance settings
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Carregar configurações do banco de dados
  const { data: settingsData, isLoading: loadingSettings } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  // Mutation para salvar configurações
  const saveSettings = trpc.settings.save.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  // Não usamos mais upload para S3, salvamos direto como base64

  // Função para converter URL do CloudFront para URL do proxy
  const getProxyUrl = (url: string) => {
    if (!url) return "";
    // Se já é uma URL do proxy, retorna como está
    if (url.startsWith("/api/storage/image")) return url;
    // Se é uma URL do CloudFront, converte para proxy
    if (url.includes("cloudfront.net")) {
      // Extrair a key da URL do CloudFront
      // Formato: https://xxx.cloudfront.net/appId/projectId/key
      const parts = url.split("/");
      // A key começa após o projectId (3 partes após o domínio)
      if (parts.length > 5) {
        const key = parts.slice(5).join("/");
        return `/api/storage/image?key=${encodeURIComponent(key)}`;
      }
    }
    return url;
  };

  // Carregar dados quando disponíveis
  useEffect(() => {
    if (settingsData) {
      setClinicData({
        name: settingsData.name || "",
        cnpj: settingsData.cnpj || "",
        cro: settingsData.cro || "",
        phone: settingsData.phone || "",
        email: settingsData.email || "",
        address: settingsData.address || "",
        city: settingsData.city || "",
        state: settingsData.state || "",
        zipCode: settingsData.zipCode || "",
        openTime: settingsData.openTime || "08:00",
        closeTime: settingsData.closeTime || "18:00",
        appointmentDuration: settingsData.appointmentDuration || 30,
        logoUrl: settingsData.logoUrl || "",
        logoData: (settingsData as any).logoData || "", // Logo como base64
      });
    }
  }, [settingsData]);

  // Load saved theme settings
  useEffect(() => {
    const savedPreset = localStorage.getItem("dentrics-color-preset");
    if (savedPreset) {
      const presetIndex = parseInt(savedPreset);
      setSelectedPreset(presetIndex);
      // Aplicar as cores CSS imediatamente
      const preset = colorPresets[presetIndex];
      document.documentElement.style.setProperty("--primary", preset.primary);
      document.documentElement.style.setProperty("--sidebar", preset.sidebar);
      document.documentElement.style.setProperty("--accent", preset.accent);
      document.documentElement.style.setProperty("--ring", preset.primary);
      document.documentElement.style.setProperty("--sidebar-ring", preset.primary);
    }
  }, []);

  // Apply color preset
  const applyColorPreset = (index: number) => {
    setSelectedPreset(index);
    const preset = colorPresets[index];
    
    document.documentElement.style.setProperty("--primary", preset.primary);
    document.documentElement.style.setProperty("--sidebar", preset.sidebar);
    document.documentElement.style.setProperty("--accent", preset.accent);
    document.documentElement.style.setProperty("--ring", preset.primary);
    document.documentElement.style.setProperty("--sidebar-ring", preset.primary);
    
    localStorage.setItem("dentrics-color-preset", index.toString());
    toast.success(`Tema "${preset.name}" aplicado!`);
  };

  // Consultórios
  const [officeDialogOpen, setOfficeDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any>(null);
  const [officeForm, setOfficeForm] = useState({
    name: "",
    number: "",
    floor: "",
    description: "",
    specialties: "",
  });

  const { data: offices, isLoading: loadingOffices } = trpc.offices.list.useQuery();

  const createOffice = trpc.offices.create.useMutation({
    onSuccess: () => {
      utils.offices.list.invalidate();
      setOfficeDialogOpen(false);
      resetOfficeForm();
      toast.success("Consultório criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar consultório"),
  });

  const updateOffice = trpc.offices.update.useMutation({
    onSuccess: () => {
      utils.offices.list.invalidate();
      setOfficeDialogOpen(false);
      resetOfficeForm();
      toast.success("Consultório atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar consultório"),
  });

  const deleteOffice = trpc.offices.delete.useMutation({
    onSuccess: () => {
      utils.offices.list.invalidate();
      toast.success("Consultório excluído com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir consultório"),
  });

  const resetOfficeForm = () => {
    setOfficeForm({ name: "", number: "", floor: "", description: "", specialties: "" });
    setEditingOffice(null);
  };

  const handleEditOffice = (office: any) => {
    setEditingOffice(office);
    setOfficeForm({
      name: office.name,
      number: office.number || "",
      floor: office.floor || "",
      description: office.description || "",
      specialties: office.specialties || "",
    });
    setOfficeDialogOpen(true);
  };

  const handleSaveOffice = () => {
    if (!officeForm.name) {
      toast.error("Nome do consultório é obrigatório");
      return;
    }

    if (editingOffice) {
      updateOffice.mutate({ id: editingOffice.id, data: officeForm });
    } else {
      createOffice.mutate(officeForm);
    }
  };

  const handleDeleteOffice = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este consultório?")) {
      deleteOffice.mutate({ id });
    }
  };

  const handleSaveClinic = () => {
    saveSettings.mutate({
      name: clinicData.name || undefined,
      cnpj: clinicData.cnpj || undefined,
      cro: clinicData.cro || undefined,
      phone: clinicData.phone || undefined,
      email: clinicData.email || undefined,
      address: clinicData.address || undefined,
      city: clinicData.city || undefined,
      state: clinicData.state || undefined,
      zipCode: clinicData.zipCode || undefined,
      openTime: clinicData.openTime || undefined,
      closeTime: clinicData.closeTime || undefined,
      appointmentDuration: clinicData.appointmentDuration || undefined,
      logoUrl: clinicData.logoUrl || undefined,
      logoData: clinicData.logoData || undefined, // Logo como base64 data URL
    });
  };

  const handleSaveNotifications = () => {
    toast.success("Configurações de notificações salvas!");
  };

  // Handle logo upload - salva como base64 data URL diretamente
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máximo 2MB para base64)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setIsUploading(true);

    // Converter para base64 data URL
    const reader = new FileReader();
    reader.onload = () => {
      const base64DataUrl = reader.result as string;
      // Salvar o data URL completo (inclui o prefixo data:image/xxx;base64,)
      setClinicData(prev => ({ ...prev, logoData: base64DataUrl, logoUrl: "" }));
      setIsUploading(false);
      toast.success("Logo carregada! Clique em Salvar Configurações para confirmar.");
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Erro ao ler arquivo");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setClinicData(prev => ({ ...prev, logoUrl: "", logoData: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const specialtiesOptions = [
    "Clínica Geral",
    "Ortodontia",
    "Implantodontia",
    "Prótese",
    "Endodontia",
    "Periodontia",
    "Cirurgia",
    "Odontopediatria",
  ];

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="clinic" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:block" />
            Clínica
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:block" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="offices" className="gap-2">
            <DoorOpen className="h-4 w-4 hidden sm:block" />
            Consultórios
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:block" />
            Notificações
          </TabsTrigger>
        </TabsList>

        {/* Dados da Clínica */}
        <TabsContent value="clinic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Clínica</CardTitle>
              <CardDescription>Informações básicas da clínica que serão exibidas em todo o sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Logo da Clínica */}
                  <div className="space-y-3">
                    <Label>Logo da Clínica</Label>
                    <div className="flex items-start gap-4">
                      {/* Preview da Logo */}
                      <div className="relative">
                        {(clinicData.logoData || clinicData.logoUrl) ? (
                          <div className="relative">
                            <img
                              src={clinicData.logoData || clinicData.logoUrl}
                              alt="Logo da clínica"
                              className="w-24 h-24 rounded-xl object-cover border-2 border-border shadow-sm"
                            />
                            <button
                              onClick={handleRemoveLogo}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Button */}
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="gap-2"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {clinicData.logoUrl ? "Trocar Logo" : "Enviar Logo"}
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB.
                          <br />
                          A logo será exibida no check-in, painel TV e em todo o sistema.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="clinicName">Nome da Clínica</Label>
                      <Input
                        id="clinicName"
                        value={clinicData.name}
                        onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                        placeholder="Nome da clínica"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={clinicData.cnpj}
                        onChange={(e) => setClinicData({ ...clinicData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="cro">CRO</Label>
                      <Input
                        id="cro"
                        value={clinicData.cro}
                        onChange={(e) => setClinicData({ ...clinicData, cro: e.target.value })}
                        placeholder="CRO-XX 00000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clinicPhone">Telefone</Label>
                      <Input
                        id="clinicPhone"
                        value={clinicData.phone}
                        onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="clinicEmail">E-mail</Label>
                    <Input
                      id="clinicEmail"
                      type="email"
                      value={clinicData.email}
                      onChange={(e) => setClinicData({ ...clinicData, email: e.target.value })}
                      placeholder="contato@clinica.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={clinicData.address}
                      onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={clinicData.city}
                        onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={clinicData.state}
                        onChange={(e) => setClinicData({ ...clinicData, state: e.target.value })}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={clinicData.zipCode}
                        onChange={(e) => setClinicData({ ...clinicData, zipCode: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="openTime">Horário de Abertura</Label>
                      <Input
                        id="openTime"
                        type="time"
                        value={clinicData.openTime}
                        onChange={(e) => setClinicData({ ...clinicData, openTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="closeTime">Horário de Fechamento</Label>
                      <Input
                        id="closeTime"
                        type="time"
                        value={clinicData.closeTime}
                        onChange={(e) => setClinicData({ ...clinicData, closeTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="appointmentDuration">Duração Padrão (min)</Label>
                      <Input
                        id="appointmentDuration"
                        type="number"
                        min="15"
                        max="120"
                        step="15"
                        value={clinicData.appointmentDuration}
                        onChange={(e) => setClinicData({ ...clinicData, appointmentDuration: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveClinic} 
                    className="gap-2"
                    disabled={saveSettings.isPending}
                  >
                    {saveSettings.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Personalização de Cores
              </CardTitle>
              <CardDescription>
                Escolha as cores do sistema para combinar com a identidade da sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modo Escuro */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">Modo Escuro</p>
                    <p className="text-sm text-muted-foreground">
                      Ative para usar o tema escuro
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
              </div>

              {/* Temas Predefinidos */}
              <div>
                <Label className="text-base font-medium mb-3 block">Temas Predefinidos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {colorPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => applyColorPreset(index)}
                      className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        selectedPreset === index 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-6 h-6 rounded-full shadow-inner"
                          style={{ background: preset.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full shadow-inner"
                          style={{ background: preset.sidebar }}
                        />
                      </div>
                      <p className="text-sm font-medium text-left">{preset.name}</p>
                      {selectedPreset === index && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <Label className="text-sm font-medium mb-3 block">Pré-visualização</Label>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 rounded-lg bg-sidebar text-sidebar-foreground">
                    <p className="text-sm font-medium mb-2">Menu Lateral</p>
                    <div className="space-y-1">
                      <div className="h-6 bg-sidebar-accent rounded px-2 flex items-center">
                        <span className="text-xs text-sidebar-accent-foreground">Item Ativo</span>
                      </div>
                      <div className="h-6 px-2 flex items-center">
                        <span className="text-xs opacity-70">Item Normal</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 rounded-lg bg-background border">
                    <p className="text-sm font-medium mb-2">Área Principal</p>
                    <div className="space-y-2">
                      <Button size="sm" className="w-full">Botão Primário</Button>
                      <Button size="sm" variant="outline" className="w-full">Botão Secundário</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultórios */}
        <TabsContent value="offices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Consultórios</CardTitle>
                <CardDescription>Gerencie os consultórios da clínica</CardDescription>
              </div>
              <Dialog open={officeDialogOpen} onOpenChange={setOfficeDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetOfficeForm} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Consultório
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingOffice ? "Editar Consultório" : "Novo Consultório"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do consultório
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="officeName">Nome *</Label>
                      <Input
                        id="officeName"
                        value={officeForm.name}
                        onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                        placeholder="Ex: Consultório 1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="officeNumber">Número</Label>
                        <Input
                          id="officeNumber"
                          value={officeForm.number}
                          onChange={(e) => setOfficeForm({ ...officeForm, number: e.target.value })}
                          placeholder="Ex: 101"
                        />
                      </div>
                      <div>
                        <Label htmlFor="officeFloor">Andar</Label>
                        <Input
                          id="officeFloor"
                          value={officeForm.floor}
                          onChange={(e) => setOfficeForm({ ...officeForm, floor: e.target.value })}
                          placeholder="Ex: Térreo"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="officeSpecialties">Especialidades</Label>
                      <Select
                        value={officeForm.specialties}
                        onValueChange={(value) => setOfficeForm({ ...officeForm, specialties: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione as especialidades" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialtiesOptions.map((spec) => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="officeDescription">Descrição</Label>
                      <Textarea
                        id="officeDescription"
                        value={officeForm.description}
                        onChange={(e) => setOfficeForm({ ...officeForm, description: e.target.value })}
                        placeholder="Descrição do consultório..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOfficeDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveOffice}
                      disabled={createOffice.isPending || updateOffice.isPending}
                    >
                      {(createOffice.isPending || updateOffice.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingOffices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : offices && offices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Andar</TableHead>
                      <TableHead>Especialidades</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offices.map((office) => (
                      <TableRow key={office.id}>
                        <TableCell className="font-medium">{office.name}</TableCell>
                        <TableCell>{office.number || "-"}</TableCell>
                        <TableCell>{office.floor || "-"}</TableCell>
                        <TableCell>{office.specialties || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={office.isActive ? "default" : "secondary"}>
                            {office.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOffice(office)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOffice(office.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum consultório cadastrado</p>
                  <p className="text-sm">Clique em "Novo Consultório" para adicionar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como e quando os lembretes serão enviados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete por E-mail</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembrete de consulta por e-mail
                  </p>
                </div>
                <Switch
                  checked={notifications.emailReminder}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailReminder: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete por SMS</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembrete de consulta por SMS
                  </p>
                </div>
                <Switch
                  checked={notifications.smsReminder}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, smsReminder: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete por WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembrete de consulta por WhatsApp
                  </p>
                </div>
                <Switch
                  checked={notifications.whatsappReminder}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, whatsappReminder: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="reminderTime">Antecedência do Lembrete (horas)</Label>
                <Input
                  id="reminderTime"
                  type="number"
                  min="1"
                  max="72"
                  value={notifications.reminderTime}
                  onChange={(e) =>
                    setNotifications({ ...notifications, reminderTime: e.target.value })
                  }
                  className="w-32"
                />
              </div>

              <Button onClick={handleSaveNotifications} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Eye, 
  Pencil, 
  Trash2, 
  Phone, 
  Mail,
  User,
  Calendar,
  Clock,
  UserPlus,
  Users,
  Power,
  UserCheck,
} from "lucide-react";
import { useLocation } from "wouter";

type PatientFormData = {
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  gender: "male" | "female" | "other" | "";
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  profession: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
};

const initialFormData: PatientFormData = {
  name: "",
  cpf: "",
  rg: "",
  birthDate: "",
  gender: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  profession: "",
  emergencyContact: "",
  emergencyPhone: "",
  notes: "",
};

export default function Pacientes() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: patients, isLoading } = trpc.patients.list.useQuery({ search: search || undefined });
  const { data: patientsToday, isLoading: isLoadingToday } = trpc.patientsToday.list.useQuery();
  const { data: patientsActiveToday } = trpc.patients.listActiveToday.useQuery();
  
  // Mutation para ativar/desativar paciente do dia
  const toggleActiveTodayMutation = trpc.patients.toggleActiveToday.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.isActiveToday ? "Paciente ativado para hoje!" : "Paciente desativado");
      utils.patients.list.invalidate();
      utils.patients.listActiveToday.invalidate();
    },
    onError: (error: any) => {
      toast.error("Erro ao ativar paciente: " + error.message);
    },
  });
  
  // Mutation para adicionar paciente à fila de espera
  const addToQueueMutation = trpc.queue.add.useMutation({
    onSuccess: () => {
      toast.success("Paciente adicionado à fila de espera!");
      utils.patientsToday.list.invalidate();
      utils.queue.list.invalidate();
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar à fila: " + error.message);
    },
  });
  
  const createMutation = trpc.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      utils.patients.list.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar paciente: " + error.message);
    },
  });

  const updateMutation = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado com sucesso!");
      utils.patients.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar paciente: " + error.message);
    },
  });

  const deleteMutation = trpc.patients.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente excluído com sucesso!");
      utils.patients.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedPatient(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir paciente: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedPatient(null);
  };

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (patient: any) => {
    setFormData({
      name: patient.name || "",
      cpf: patient.cpf || "",
      rg: patient.rg || "",
      birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      whatsapp: patient.whatsapp || "",
      email: patient.email || "",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      zipCode: patient.zipCode || "",
      profession: patient.profession || "",
      emergencyContact: patient.emergencyContact || "",
      emergencyPhone: patient.emergencyPhone || "",
      notes: patient.notes || "",
    });
    setSelectedPatient(patient.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const data = {
      ...formData,
      gender: formData.gender || undefined,
    };

    if (isEditing && selectedPatient) {
      updateMutation.mutate({ id: selectedPatient, data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  const handleDelete = () => {
    if (selectedPatient) {
      deleteMutation.mutate({ id: selectedPatient });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie os pacientes da sua clínica
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            Todos os Pacientes
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Calendar className="h-4 w-4" />
            Pacientes do Dia
            {patientsActiveToday && patientsActiveToday.length > 0 && (
              <Badge variant="secondary" className="ml-1">{patientsActiveToday.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aba Pacientes do Dia */}
        <TabsContent value="today" className="space-y-4 mt-4">
          {/* Pacientes Ativados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                Pacientes Ativados
              </CardTitle>
              <CardDescription>
                {patientsActiveToday?.length ?? 0} paciente(s) ativado(s) para atendimento hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientsActiveToday && patientsActiveToday.length > 0 ? (
                <div className="space-y-3">
                  {patientsActiveToday.map((patient: any) => (
                    <div 
                      key={patient.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors border-green-200 bg-green-50/50"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className={`h-12 w-12 ${getAvatarColor(patient.name)}`}>
                          <AvatarFallback className="text-white font-medium">
                            {getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{patient.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {patient.cpf && (
                              <span>CPF: {patient.cpf}</span>
                            )}
                            {patient.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {patient.phone}
                              </span>
                            )}
                            {patient.activatedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Ativado às {new Date(patient.activatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">Ativo</Badge>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1"
                          onClick={() => addToQueueMutation.mutate({ 
                            patientId: patient.id,
                            queueType: 'dentist'
                          })}
                          disabled={addToQueueMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4" />
                          Fila de Espera
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActiveTodayMutation.mutate({ 
                            id: patient.id, 
                            isActiveToday: false 
                          })}
                          disabled={toggleActiveTodayMutation.isPending}
                        >
                          <Power className="h-4 w-4 mr-1" />
                          Desativar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/prontuario/${patient.id}`)}
                          title="Ver prontuário"
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Visualizar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Power className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum paciente ativado</p>
                  <p className="text-sm text-muted-foreground mt-1">Ative pacientes na aba "Todos os Pacientes" para que apareçam aqui</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pacientes Agendados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Pacientes Agendados para Hoje
              </CardTitle>
              <CardDescription>
                {patientsToday?.length ?? 0} paciente(s) com consulta agendada para hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingToday ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : patientsToday && patientsToday.length > 0 ? (
                <div className="space-y-3">
                  {patientsToday.map((appointment) => (
                    <div 
                      key={appointment.appointmentId} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className={`h-12 w-12 ${getAvatarColor(appointment.patientName)}`}>
                          <AvatarFallback className="text-white font-medium">
                            {getInitials(appointment.patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{appointment.patientName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {appointment.appointmentTime} - {appointment.appointmentEndTime}
                            </span>
                            {appointment.dentistName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                Dr(a). {appointment.dentistName}
                              </span>
                            )}
                            {appointment.appointmentType && (
                              <Badge variant="outline">{appointment.appointmentType}</Badge>
                            )}
                          </div>
                          {appointment.patientPhone && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {appointment.patientPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={appointment.appointmentStatus === 'confirmed' ? 'default' : 
                                   appointment.appointmentStatus === 'completed' ? 'secondary' :
                                   appointment.appointmentStatus === 'in_progress' ? 'default' : 'outline'}
                          className={appointment.appointmentStatus === 'in_progress' ? 'bg-green-500' : ''}
                        >
                          {appointment.appointmentStatus === 'scheduled' ? 'Agendado' :
                           appointment.appointmentStatus === 'confirmed' ? 'Confirmado' :
                           appointment.appointmentStatus === 'in_progress' ? 'Em Atendimento' :
                           appointment.appointmentStatus === 'completed' ? 'Concluído' :
                           appointment.appointmentStatus === 'cancelled' ? 'Cancelado' : 'Não Compareceu'}
                        </Badge>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1"
                          onClick={() => addToQueueMutation.mutate({ 
                            patientId: appointment.patientId,
                            queueType: 'dentist'
                          })}
                          disabled={addToQueueMutation.isPending || appointment.appointmentStatus === 'in_progress' || appointment.appointmentStatus === 'completed'}
                        >
                          <UserPlus className="h-4 w-4" />
                          Fila de Espera
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/prontuario/${appointment.patientId}`)}
                          title="Ver prontuário"
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Visualizar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum paciente agendado para hoje</p>
                  <p className="text-sm text-muted-foreground mt-1">Os pacientes com consultas agendadas aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Todos os Pacientes */}
        <TabsContent value="all" className="space-y-4 mt-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {patients?.length ?? 0} paciente(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">CPF</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-9 w-9 ${getAvatarColor(patient.name)}`}>
                            <AvatarFallback className="text-white text-xs font-medium">
                              {getInitials(patient.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {patient.phone || "Sem telefone"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {patient.cpf || "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {patient.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {patient.email || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant={(patient as any).isActiveToday ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleActiveTodayMutation.mutate({ 
                              id: patient.id, 
                              isActiveToday: !(patient as any).isActiveToday 
                            })}
                            title={(patient as any).isActiveToday ? "Desativar paciente" : "Ativar paciente para hoje"}
                            className={(patient as any).isActiveToday ? "bg-green-500 hover:bg-green-600" : ""}
                            disabled={toggleActiveTodayMutation.isPending}
                          >
                            <Power className="h-4 w-4 mr-1" />
                            {(patient as any).isActiveToday ? "Ativo" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/prontuario/${patient.id}`)}
                            title="Ver prontuário"
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Visualizar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(patient)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPatient(patient.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum paciente encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente uma busca diferente" : "Cadastre seu primeiro paciente"}
              </p>
              {!search && (
                <Button onClick={handleOpenNew} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Paciente
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Paciente" : "Cadastrar Novo Paciente"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo do paciente"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="RG"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Sexo</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Outros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Profissão</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Profissão"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações gerais sobre o paciente"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Salvando..." 
                  : isEditing ? "Salvar" : "Cadastrar"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

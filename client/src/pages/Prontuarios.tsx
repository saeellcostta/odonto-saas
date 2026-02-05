import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  FileText,
  User,
  Phone,
  Calendar,
  ChevronRight,
  ClipboardList,
  Heart,
  Receipt,
  History,
  Filter,
  SortAsc,
  Eye,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Prontuarios() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastVisit" | "created">("lastVisit");

  const { data: patients, isLoading } = trpc.patients.list.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery({});
  const { data: budgets } = trpc.budgets.list.useQuery();
  const { data: treatments } = trpc.treatments.list.useQuery({ patientId: 0 });

  // Filtrar e ordenar pacientes
  const filteredPatients = patients?.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf?.includes(searchTerm) ||
    patient.phone?.includes(searchTerm)
  ).sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "created") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // lastVisit - ordenar por última consulta
    const aLastVisit = appointments?.filter(ap => ap.patientId === a.id)
      .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
    const bLastVisit = appointments?.filter(ap => ap.patientId === b.id)
      .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
    
    if (!aLastVisit && !bLastVisit) return 0;
    if (!aLastVisit) return 1;
    if (!bLastVisit) return -1;
    return new Date(bLastVisit.date).getTime() - new Date(aLastVisit.date).getTime();
  });

  // Obter estatísticas do paciente
  const getPatientStats = (patientId: number) => {
    const patientAppointments = appointments?.filter(a => a.patientId === patientId) || [];
    const patientBudgets = budgets?.filter(b => b.patientId === patientId) || [];
    const patientTreatments = treatments?.filter(t => t.patientId === patientId) || [];
    
    const lastAppointment = patientAppointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      totalAppointments: patientAppointments.length,
      totalBudgets: patientBudgets.length,
      totalTreatments: patientTreatments.length,
      lastVisit: lastAppointment ? new Date(lastAppointment.date) : null,
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenProntuario = (patientId: number) => {
    setLocation(`/prontuario/${patientId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Prontuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Acesse e gerencie os prontuários dos pacientes
            </p>
          </div>
          <Button onClick={() => setLocation("/pacientes")} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Prontuários</p>
                  <p className="text-3xl font-bold text-blue-600">{patients?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultas Realizadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {appointments?.filter(a => a.status === "completed").length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Orçamentos</p>
                  <p className="text-3xl font-bold text-amber-600">{budgets?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tratamentos Ativos</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {treatments?.length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Lista de Prontuários</CardTitle>
                <CardDescription>Clique em um paciente para acessar o prontuário completo</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortBy(sortBy === "name" ? "lastVisit" : sortBy === "lastVisit" ? "created" : "name")}
                  title={`Ordenar por ${sortBy === "name" ? "última visita" : sortBy === "lastVisit" ? "data de cadastro" : "nome"}`}
                >
                  <SortAsc className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredPatients && filteredPatients.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredPatients.map((patient) => {
                    const stats = getPatientStats(patient.id);
                    return (
                      <div
                        key={patient.id}
                        onClick={() => handleOpenProntuario(patient.id)}
                        className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 cursor-pointer transition-all duration-200"
                      >
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-lg font-semibold">
                            {getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                              {patient.name}
                            </h3>
                            {stats.totalTreatments > 0 && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                {stats.totalTreatments} tratamento(s)
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            {patient.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {patient.phone}
                              </span>
                            )}
                            {patient.cpf && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {patient.cpf}
                              </span>
                            )}
                            {stats.lastVisit && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Última visita: {format(stats.lastVisit, "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden md:flex items-center gap-6 text-center">
                          <div>
                            <p className="text-2xl font-bold text-primary">{stats.totalAppointments}</p>
                            <p className="text-xs text-muted-foreground">Consultas</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.totalBudgets}</p>
                            <p className="text-xs text-muted-foreground">Orçamentos</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 group-hover:bg-primary group-hover:text-white transition-colors"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">Nenhum prontuário encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {searchTerm 
                    ? "Tente buscar com outros termos" 
                    : "Cadastre um novo paciente para criar seu prontuário"}
                </p>
                <Button onClick={() => setLocation("/pacientes")} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Paciente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Acesso Rápido ao Prontuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Dados Pessoais</p>
                  <p className="text-xs text-muted-foreground">Informações do paciente</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <Receipt className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">Orçamentos</p>
                  <p className="text-xs text-muted-foreground">Propostas e valores</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <ClipboardList className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">Tratamentos</p>
                  <p className="text-xs text-muted-foreground">Procedimentos realizados</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <Heart className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">Anamnese</p>
                  <p className="text-xs text-muted-foreground">Histórico de saúde</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <History className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Histórico</p>
                  <p className="text-xs text-muted-foreground">Consultas anteriores</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

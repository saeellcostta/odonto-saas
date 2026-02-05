import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Baby, Calendar, Users, FileText, Clock,
  CheckCircle, Play, User, MapPin, Send, Loader2, Stethoscope, Heart, ClipboardList, CheckSquare
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AreaOdontopediatria() {
  const [, setLocation] = useLocation();
  const [selectedDentist, setSelectedDentist] = useState<number | null>(null);
  const [selectedOffice, setSelectedOffice] = useState("");
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [finishNotes, setFinishNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: dentists } = trpc.dentists.list.useQuery();
  const { data: offices } = trpc.offices.list.useQuery();
  const { data: patients } = trpc.patients.listActiveToday.useQuery();
  const { data: pedoQueue, isLoading: loadingQueue } = trpc.serviceQueue.list.useQuery({ queueType: "pediatric" });

  // Filter patients by queue status
  const waitingPatients = pedoQueue?.filter(p => p.status === "waiting") || [];
  const calledPatients = pedoQueue?.filter(p => p.status === "called") || [];
  const inServicePatients = pedoQueue?.filter(p => p.status === "in_service") || [];
  
  // Estados para controle de procedimentos
  const [completedProcedures, setCompletedProcedures] = useState<number[]>([]);
  
  // Query para procedimentos do paciente em atendimento (para especialista - sem valores)
  const currentInServicePatient = inServicePatients[0];
  const { data: treatmentProcedures } = trpc.treatmentProcedures.getForSpecialist.useQuery(
    { 
      queueEntryId: selectedEntry?.id || currentInServicePatient?.id || 0,
      patientId: selectedEntry?.patientId || currentInServicePatient?.patientId,
    },
    { 
      enabled: !!(selectedEntry || currentInServicePatient),
      refetchInterval: 5000,
    }
  );
  
  const markProceduresCompleted = trpc.treatmentProcedures.markMultipleCompleted.useMutation({
    onSuccess: () => {
      utils.treatmentProcedures.getForSpecialist.invalidate();
      toast.success("Procedimentos marcados como concluídos!");
    },
    onError: () => toast.error("Erro ao marcar procedimentos"),
  });

  // Mutations
  const callPatient = trpc.serviceQueue.callPatient.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.tvPanel.activeCalls.invalidate();
      toast.success("Paciente chamado! Aparecerá no Painel TV.");
    },
    onError: () => toast.error("Erro ao chamar paciente"),
  });

  const startService = trpc.serviceQueue.startService.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      toast.success("Atendimento iniciado!");
    },
    onError: () => toast.error("Erro ao iniciar atendimento"),
  });

  const forwardPatient = trpc.serviceQueue.forward.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      setFinishDialogOpen(false);
      setSelectedEntry(null);
      setFinishNotes("");
      toast.success("Paciente encaminhado com sucesso!");
    },
    onError: () => toast.error("Erro ao encaminhar paciente"),
  });

  const handleCallPatient = (entry: any) => {
    if (!selectedOffice) {
      toast.error("Selecione um consultório primeiro");
      return;
    }
    const office = offices?.find(o => o.id === parseInt(selectedOffice));
    if (!office) return;

    const dentist = dentists?.find(d => d.id === selectedDentist);

    callPatient.mutate({
      id: entry.id,
      officeId: office.id,
      officeName: office.name,
      professionalId: selectedDentist || undefined,
      professionalName: dentist?.name || "Odontopediatra",
    });
  };

  const handleStartService = (entry: any) => {
    startService.mutate({ id: entry.id });
  };

  const openFinishDialog = (entry: any) => {
    setSelectedEntry(entry);
    setFinishDialogOpen(true);
  };

  // Funções para controle de procedimentos
  const toggleProcedureCompleted = (procId: number) => {
    setCompletedProcedures(prev => 
      prev.includes(procId) 
        ? prev.filter(id => id !== procId)
        : [...prev, procId]
    );
  };

  const selectAllPendingProcedures = () => {
    if (treatmentProcedures) {
      const pendingIds = treatmentProcedures
        .filter(p => p.status !== "completed")
        .map(p => p.id);
      setCompletedProcedures(pendingIds);
    }
  };

  const handleFinishService = async () => {
    if (!selectedEntry) {
      toast.error("Nenhum paciente selecionado");
      return;
    }
    
    // Primeiro marca os procedimentos como concluídos
    if (completedProcedures.length > 0) {
      await markProceduresCompleted.mutateAsync({ ids: completedProcedures });
    }
    
    // Depois encaminha o paciente
    forwardPatient.mutate({
      id: selectedEntry.id,
      nextQueue: "reception",
      notes: finishNotes,
    });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getWaitTime = (arrivalTime: Date | string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      default: return "bg-yellow-500";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Baby className="h-8 w-8 text-yellow-500" />
              Área de Odontopediatria
            </h1>
            <p className="text-muted-foreground">Atendimento odontológico infantil com carinho e cuidado</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Odontopediatra:</Label>
              <Select onValueChange={(v) => setSelectedDentist(Number(v))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {dentists?.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Consultório:</Label>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {offices?.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {office.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                  <p className="text-2xl font-bold">{waitingPatients.length}</p>
                </div>
                <Users className="h-8 w-8 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chamados</p>
                  <p className="text-2xl font-bold">{calledPatients.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Atendimento</p>
                  <p className="text-2xl font-bold">{inServicePatients.length}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crianças Ativas</p>
                  <p className="text-2xl font-bold">{patients?.length ?? 0}</p>
                </div>
                <Baby className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fila de Espera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Fila de Espera
              </CardTitle>
              <CardDescription>Crianças aguardando atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {loadingQueue ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : waitingPatients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Baby className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    Nenhuma criança na fila
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitingPatients.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-10 rounded-full ${getPriorityColor(entry.priority)}`} />
                          <div>
                            <p className="font-medium flex items-center gap-1">
                              <Heart className="h-4 w-4 text-pink-400" />
                              {entry.patientName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Chegou: {formatTime(entry.arrivalTime)} • Espera: {getWaitTime(entry.arrivalTime)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleCallPatient(entry)}
                          disabled={!selectedOffice || callPatient.isPending}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Chamar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Em Atendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-500" />
                Em Atendimento
              </CardTitle>
              <CardDescription>Crianças sendo atendidas agora</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {/* Pacientes Chamados */}
                {calledPatients.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Chamados</h4>
                    <div className="space-y-3">
                      {calledPatients.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">{entry.patientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {entry.officeName || "Consultório Infantil"}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleStartService(entry)}
                            disabled={startService.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Em Atendimento */}
                {inServicePatients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Em Atendimento</h4>
                    <div className="space-y-3">
                      {inServicePatients.map((entry) => (
                        <div key={entry.id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Stethoscope className="h-5 w-5 text-emerald-500" />
                              <div>
                                <p className="font-medium">{entry.patientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Início: {formatTime(entry.serviceStartTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Lista de Procedimentos a Realizar */}
                          {treatmentProcedures && treatmentProcedures.length > 0 && (
                            <div className="mt-4 p-3 bg-white rounded-lg border">
                              <div className="flex items-center gap-2 mb-2">
                                <ClipboardList className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-sm">Procedimentos a Realizar</span>
                                <Badge variant="outline" className="ml-auto">
                                  {treatmentProcedures.filter(p => p.status !== "completed").length} pendente(s)
                                </Badge>
                              </div>
                              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                {treatmentProcedures.map((proc) => (
                                  <div
                                    key={proc.id}
                                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                                      proc.status === "completed"
                                        ? "bg-emerald-50 text-muted-foreground"
                                        : "bg-blue-50"
                                    }`}
                                  >
                                    {proc.status === "completed" ? (
                                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-blue-500 flex-shrink-0" />
                                    )}
                                    <span className={proc.status === "completed" ? "line-through" : "font-medium"}>
                                      {proc.procedureName}
                                    </span>
                                    {proc.toothNumber && (
                                      <span className="text-xs text-muted-foreground">
                                        (Dente {proc.toothNumber}{proc.faces ? ` - ${proc.faces}` : ""})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setLocation(`/prontuario/${entry.patientId}`)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Prontuário
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => openFinishDialog(entry)}
                              className="bg-yellow-500 hover:bg-yellow-600 flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {calledPatients.length === 0 && inServicePatients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-2 opacity-30 text-pink-300" />
                    Nenhuma criança em atendimento
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Procedimentos Comuns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-yellow-500" />
              Procedimentos Odontopediátricos
            </CardTitle>
            <CardDescription>Procedimentos mais comuns para crianças</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Aplicação de Flúor",
                "Selante",
                "Restauração Infantil",
                "Pulpotomia",
                "Pulpectomia",
                "Extração Decíduo",
                "Mantenedor de Espaço",
                "Orientação de Higiene"
              ].map((proc) => (
                <Badge key={proc} variant="outline" className="justify-center py-2 text-sm border-yellow-300 text-yellow-700">
                  {proc}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dicas de Atendimento */}
        <Card className="bg-gradient-to-r from-yellow-50 to-pink-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Heart className="h-5 w-5 text-pink-500" />
              Dicas para Atendimento Infantil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
              <div className="flex items-start gap-2">
                <span className="text-lg">🎈</span>
                <p>Use linguagem lúdica e apropriada para a idade</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">⭐</span>
                <p>Recompense comportamento positivo com elogios</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">🎵</span>
                <p>Música ambiente pode ajudar a relaxar</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">👨‍👩‍👧</span>
                <p>Envolva os pais no processo de orientação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Finalizar com Procedimentos */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-500" />
              Finalizar Atendimento
            </DialogTitle>
            <DialogDescription>
              Marque os procedimentos realizados e encaminhe {selectedEntry?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Lista de Procedimentos para marcar como concluídos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Procedimentos Realizados
                </Label>
                {treatmentProcedures && treatmentProcedures.filter(p => p.status !== "completed").length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllPendingProcedures}
                  >
                    Marcar Todos
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[200px] border rounded-lg p-3">
                {!treatmentProcedures || treatmentProcedures.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum procedimento cadastrado para este paciente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {treatmentProcedures.map((proc) => (
                      <div
                        key={proc.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                          proc.status === "completed"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200"
                            : completedProcedures.includes(proc.id)
                            ? "bg-blue-50 dark:bg-blue-950/20 border-blue-300"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={completedProcedures.includes(proc.id) || proc.status === "completed"}
                          disabled={proc.status === "completed"}
                          onCheckedChange={() => toggleProcedureCompleted(proc.id)}
                        />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            proc.status === "completed" ? "line-through text-muted-foreground" : ""
                          }`}>
                            {proc.procedureName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {proc.toothNumber && (
                              <span>Dente: {proc.toothNumber}</span>
                            )}
                            {proc.faces && (
                              <span>Faces: {proc.faces}</span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={proc.status === "completed" ? "default" : completedProcedures.includes(proc.id) ? "default" : "outline"}
                          className={proc.status === "completed" ? "bg-emerald-500" : completedProcedures.includes(proc.id) ? "bg-blue-500" : ""}
                        >
                          {proc.status === "completed" ? "Já Concluído" : completedProcedures.includes(proc.id) ? "A Marcar" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {completedProcedures.length > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  {completedProcedures.length} procedimento(s) serão marcados como concluídos
                </p>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <Send className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">Encaminhar para o Atendente</p>
                  <p className="text-sm text-muted-foreground">
                    O Atendente irá decidir o próximo passo: finalizar, agendar retorno ou encaminhar para outra especialidade
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label>Observações do Atendimento</Label>
              <Textarea
                value={finishNotes}
                onChange={(e) => setFinishNotes(e.target.value)}
                placeholder="Descreva o procedimento realizado, comportamento da criança, orientações aos pais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFinishService} 
              disabled={forwardPatient.isPending || markProceduresCompleted.isPending}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {(forwardPatient.isPending || markProceduresCompleted.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Send className="mr-2 h-4 w-4" />
              Finalizar e Encaminhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

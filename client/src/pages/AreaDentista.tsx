import { useState, useEffect, useRef, useCallback } from "react";
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
  Stethoscope, Calendar, Users, FileText, Clock,
  CheckCircle, Play, User, ArrowRight, MapPin, Send, Loader2,
  Bell, BellRing, Volume2, VolumeX, ClipboardList, CheckSquare
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AreaDentista() {
  const [, setLocation] = useLocation();
  const [selectedDentist, setSelectedDentist] = useState<number | null>(null);
  const [selectedOffice, setSelectedOffice] = useState("");
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [finishNotes, setFinishNotes] = useState("");
  const [nextDestination, setNextDestination] = useState("");
  
  // Estados para notificações
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastQueueCount, setLastQueueCount] = useState(0);
  const [hasNewPatient, setHasNewPatient] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Estados para controle de procedimentos
  const [completedProcedures, setCompletedProcedures] = useState<number[]>([]);

  const utils = trpc.useUtils();

  const { data: dentists } = trpc.dentists.list.useQuery();
  const { data: offices } = trpc.offices.list.useQuery();
  const { data: stats } = trpc.dentistArea.stats.useQuery(
    { dentistId: selectedDentist! },
    { enabled: !!selectedDentist }
  );
  const { data: patients } = trpc.patients.listActiveToday.useQuery();
  const { data: dentistQueue, isLoading: loadingQueue } = trpc.serviceQueue.list.useQuery(
    { queueType: "dentist" },
    { refetchInterval: 3000 }
  );

  // Filter patients by queue status
  const waitingPatients = dentistQueue?.filter(p => p.status === "waiting") || [];
  const calledPatients = dentistQueue?.filter(p => p.status === "called") || [];
  const inServicePatients = dentistQueue?.filter(p => p.status === "in_service") || [];
  
  // Query para procedimentos do paciente em atendimento (para especialista - sem valores)
  // Busca para qualquer paciente em atendimento, não apenas quando abre o dialog
  const currentInServicePatient = inServicePatients[0];
  const { data: treatmentProcedures, refetch: refetchProcedures } = trpc.treatmentProcedures.getForSpecialist.useQuery(
    { 
      queueEntryId: selectedEntry?.id || currentInServicePatient?.id || 0,
      patientId: selectedEntry?.patientId || currentInServicePatient?.patientId,
    },
    { 
      enabled: !!(selectedEntry || currentInServicePatient),
      refetchInterval: 5000, // Atualiza a cada 5 segundos
    }
  );

  // Função para tocar som de notificação
  const playNotificationSound = useCallback((type: 'new' | 'call' | 'urgent' = 'new') => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      
      const playSequence = (frequencies: number[], durations: number[]) => {
        let time = audioContext.currentTime;
        frequencies.forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.4, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
          osc.start(time);
          osc.stop(time + durations[i]);
          time += durations[i] * 0.8;
        });
      };

      switch (type) {
        case 'new':
          // Som de novo paciente - acorde maior alegre
          playSequence([523, 659, 784, 1047], [0.12, 0.12, 0.12, 0.25]);
          break;
        case 'call':
          // Som de chamada
          playSequence([880, 1100, 880], [0.15, 0.15, 0.25]);
          break;
        case 'urgent':
          // Som urgente
          playSequence([880, 440, 880, 440], [0.1, 0.1, 0.1, 0.2]);
          break;
      }
    } catch (e) {
      console.warn("Erro ao tocar som:", e);
    }
  }, [soundEnabled]);

  // Detectar novos pacientes na fila
  useEffect(() => {
    const currentCount = waitingPatients.length;
    
    if (currentCount > lastQueueCount && lastQueueCount >= 0) {
      // Novo paciente na fila!
      const newPatient = waitingPatients[0];
      setHasNewPatient(true);
      setNewPatientName(newPatient?.patientName || "Paciente");
      setShowCallOverlay(true);
      
      // Tocar som
      playNotificationSound(newPatient?.priority === 'urgent' ? 'urgent' : 'new');
      
      // Mostrar toast
      toast.info("👤 Novo Paciente na Fila!", {
        description: `${newPatient?.patientName} entrou na fila de Dentista`,
        duration: 6000,
        className: "border-l-4 border-l-green-500",
      });
      
      // Esconder overlay após 5 segundos
      setTimeout(() => {
        setShowCallOverlay(false);
        setHasNewPatient(false);
      }, 5000);
    }
    
    setLastQueueCount(currentCount);
  }, [waitingPatients.length, lastQueueCount, playNotificationSound]);

  // Mutations
  const callPatient = trpc.serviceQueue.callPatient.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.tvPanel.activeCalls.invalidate();
      playNotificationSound('call');
      toast.success("🔔 Paciente chamado! Aparecerá no Painel TV.");
    },
    onError: () => toast.error("Erro ao chamar paciente"),
  });

  const startService = trpc.serviceQueue.startService.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      toast.success("✅ Atendimento iniciado!");
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
      setNextDestination("");
      setCompletedProcedures([]);
      toast.success("Paciente encaminhado com sucesso!");
    },
    onError: () => toast.error("Erro ao encaminhar paciente"),
  });

  const markProceduresCompleted = trpc.treatmentProcedures.markMultipleCompleted.useMutation({
    onSuccess: () => {
      utils.treatmentProcedures.getForSpecialist.invalidate();
      toast.success("Procedimentos marcados como concluídos!");
    },
    onError: () => toast.error("Erro ao marcar procedimentos"),
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
      professionalName: dentist?.name || "Dentista",
    });
  };

  const handleStartService = (entry: any) => {
    startService.mutate({ id: entry.id });
  };

  const openFinishDialog = (entry: any) => {
    setSelectedEntry(entry);
    setCompletedProcedures([]);
    setFinishDialogOpen(true);
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

    // Sempre encaminha para o Atendente (reception)
    forwardPatient.mutate({
      id: selectedEntry.id,
      nextQueue: "reception",
      notes: finishNotes,
    });
  };

  const toggleProcedureCompleted = (procedureId: number) => {
    setCompletedProcedures(prev => 
      prev.includes(procedureId)
        ? prev.filter(id => id !== procedureId)
        : [...prev, procedureId]
    );
  };

  const selectAllPendingProcedures = () => {
    const pendingIds = treatmentProcedures
      ?.filter(p => p.status !== "completed")
      .map(p => p.id) || [];
    setCompletedProcedures(pendingIds);
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
      default: return "bg-blue-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      scheduled: { color: "bg-blue-100 text-blue-700", label: "Agendado" },
      confirmed: { color: "bg-green-100 text-green-700", label: "Confirmado" },
      in_progress: { color: "bg-yellow-100 text-yellow-700", label: "Em Atendimento" },
      completed: { color: "bg-gray-100 text-gray-700", label: "Concluído" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      {/* Overlay de Notificação de Novo Paciente */}
      {showCallOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowCallOverlay(false)}
        >
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-white/20 animate-pulse">
                <BellRing className="h-8 w-8 text-white" />
              </div>
              <span className="text-xl font-semibold text-white tracking-wide">
                NOVO PACIENTE NA FILA
              </span>
            </div>
            
            <div className="text-4xl font-bold text-white mb-4 animate-pulse">
              {newPatientName}
            </div>
            
            <div className="flex items-center gap-2 text-white/90">
              <span className="bg-white/20 px-4 py-2 rounded-lg">
                🦷 Fila de Dentista
              </span>
            </div>
            
            <p className="text-white/70 mt-4 text-sm">
              Clique para fechar
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Área do Dentista</h1>
            <p className="text-muted-foreground">Gerencie sua fila e consultas do dia</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Botão de Som */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? "text-green-600" : "text-muted-foreground"}
              title={soundEnabled ? "Som ativado" : "Som desativado"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            {/* Indicador de Notificações */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className={hasNewPatient ? "animate-bounce border-green-500" : ""}
              >
                {hasNewPatient ? (
                  <BellRing className="h-4 w-4 text-green-500" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
              {waitingPatients.length > 0 && (
                <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold rounded-full bg-amber-500 text-white ${hasNewPatient ? 'animate-pulse' : ''}`}>
                  {waitingPatients.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">Dentista:</Label>
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
          <Card className={`border-t-4 border-t-amber-500 ${hasNewPatient ? 'ring-2 ring-green-500 animate-pulse' : ''}`}>
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
          
          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultas Hoje</p>
                  <p className="text-2xl font-bold">{stats?.todayAppointments?.length ?? 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fila de Espera */}
          <Card className={hasNewPatient ? "ring-2 ring-green-500" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Fila de Espera
                {hasNewPatient && (
                  <Badge className="bg-green-500 animate-pulse">Novo!</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Pacientes aguardando atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQueue ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : waitingPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum paciente aguardando</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {waitingPatients.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                          index === 0 && hasNewPatient 
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-500 animate-pulse' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                            <span className="font-medium">{entry.patientName}</span>
                            {index === 0 && hasNewPatient && (
                              <Badge className="bg-green-500 text-xs">Novo</Badge>
                            )}
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(entry.priority)}`} />
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Chegou: {formatTime(entry.arrivalTime)}
                            </span>
                            <span>Espera: {getWaitTime(entry.arrivalTime)}</span>
                          </div>
                          {entry.evaluationNotes && (
                            <p className="text-sm mt-1 text-blue-600 dark:text-blue-400 truncate">
                              {entry.evaluationNotes}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCallPatient(entry)}
                          disabled={!selectedOffice || callPatient.isPending}
                          className="gap-1"
                        >
                          <Play className="h-4 w-4" />
                          Chamar
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Em Atendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-500" />
                Em Atendimento
              </CardTitle>
              <CardDescription>
                Pacientes chamados e sendo atendidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calledPatients.length === 0 && inServicePatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum paciente em atendimento</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {/* Pacientes chamados */}
                    {calledPatients.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.patientName}</span>
                              <Badge variant="secondary" className="bg-blue-500 text-white">
                                Chamado
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {entry.officeName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => handleStartService(entry)}
                            disabled={startService.isPending}
                            className="gap-1"
                          >
                            <Play className="h-4 w-4" />
                            Iniciar Atendimento
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pacientes em atendimento */}
                    {inServicePatients.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.patientName}</span>
                              <Badge variant="default" className="bg-emerald-500">
                                Em Atendimento
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {entry.officeName}
                              </span>
                              <span>Início: {formatTime(entry.serviceStartTime)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Lista de Procedimentos a Realizar */}
                        {treatmentProcedures && treatmentProcedures.length > 0 && (
                          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border">
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
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-muted-foreground"
                                      : "bg-blue-50 dark:bg-blue-950/30"
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
                            onClick={() => entry.patientId && setLocation(`/prontuario/${entry.patientId}`)}
                            className="gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Prontuário
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openFinishDialog(entry)}
                            className="gap-1 flex-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Finalizar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Consultas Agendadas */}
        {selectedDentist && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Consultas Agendadas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.todayAppointments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma consulta agendada para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.todayAppointments?.map((appt: any) => {
                    const patient = patients?.find(p => p.id === appt.patientId);
                    return (
                      <div 
                        key={appt.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{patient?.name || `Paciente #${appt.patientId}`}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {appt.startTime} - {appt.endTime}
                              {appt.type && <span className="ml-2">• {appt.type}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(appt.status)}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setLocation(`/prontuario/${appt.patientId}`)}
                            className="gap-1"
                          >
                            Prontuário
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de Finalização com Procedimentos */}
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
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ArrowRight className="h-5 w-5 text-primary" />
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
                  placeholder="Descreva o procedimento realizado, observações, etc."
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
      </div>
    </DashboardLayout>
  );
}

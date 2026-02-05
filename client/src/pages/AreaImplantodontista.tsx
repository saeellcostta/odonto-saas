import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Bone, Plus, Calendar, CheckCircle, Clock, Activity,
  User, Wrench, Heart, Users, Play, MapPin, Send, Loader2,
  Bell, BellRing, Volume2, VolumeX, ClipboardList, CheckSquare
} from "lucide-react";

export default function AreaImplantodontista() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState("");
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [finishNotes, setFinishNotes] = useState("");
  const [nextDestination, setNextDestination] = useState("");
  const [newPlan, setNewPlan] = useState({
    patientId: 0,
    toothNumber: "",
    implantBrand: "",
    implantModel: "",
    implantDiameter: "",
    implantLength: "",
    boneGraft: false,
    boneGraftType: "",
    sinusLift: false,
    surgeryDate: "",
    healingTime: 90,
    totalValue: "",
    notes: "",
  });

  // Estados para notificações
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastQueueCount, setLastQueueCount] = useState(0);
  const [hasNewPatient, setHasNewPatient] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const audioContextRef = useRef<AudioContext | null>(null);

  const utils = trpc.useUtils();

  const { data: stats } = trpc.implants.stats.useQuery();
  const { data: plans, refetch } = trpc.implants.list.useQuery();
  const { data: patients } = trpc.patients.listActiveToday.useQuery();
  const { data: offices } = trpc.offices.list.useQuery();
  const { data: implantQueue, isLoading: loadingQueue } = trpc.serviceQueue.list.useQuery(
    { queueType: "implant" },
    { refetchInterval: 3000 }
  );

  // Filter patients by queue status
  const waitingPatients = implantQueue?.filter(p => p.status === "waiting") || [];
  const calledPatients = implantQueue?.filter(p => p.status === "called") || [];
  const inServicePatients = implantQueue?.filter(p => p.status === "in_service") || [];
  
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
          playSequence([523, 659, 784, 1047], [0.12, 0.12, 0.12, 0.25]);
          break;
        case 'call':
          playSequence([880, 1100, 880], [0.15, 0.15, 0.25]);
          break;
        case 'urgent':
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
      const newPatient = waitingPatients[0];
      setHasNewPatient(true);
      setNewPatientName(newPatient?.patientName || "Paciente");
      setShowCallOverlay(true);
      
      playNotificationSound(newPatient?.priority === 'urgent' ? 'urgent' : 'new');
      
      toast.info("👤 Novo Paciente na Fila!", {
        description: `${newPatient?.patientName} entrou na fila de Implante`,
        duration: 6000,
        className: "border-l-4 border-l-rose-500",
      });
      
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
      toast.success("🔔 Paciente chamado!");
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
      setFinishDialogOpen(false);
      setSelectedEntry(null);
      setFinishNotes("");
      setNextDestination("");
      toast.success("Paciente encaminhado!");
    },
    onError: () => toast.error("Erro ao encaminhar paciente"),
  });

  const createMutation = trpc.implants.create.useMutation({
    onSuccess: () => {
      toast.success("Planejamento criado com sucesso!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: () => toast.error("Erro ao criar planejamento"),
  });

  const updateMutation = trpc.implants.update.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
  });

  const handleCallPatient = (entry: any) => {
    if (!selectedOffice) {
      toast.error("Selecione um consultório");
      return;
    }
    const office = offices?.find(o => o.id === parseInt(selectedOffice));
    if (!office) return;

    callPatient.mutate({
      id: entry.id,
      officeId: office.id,
      officeName: office.name,
      professionalName: "Implantodontista",
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

  const handleCreate = () => {
    if (!newPlan.patientId) {
      toast.error("Selecione um paciente");
      return;
    }
    createMutation.mutate(newPlan);
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

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      planning: { color: "bg-gray-100 text-gray-700", label: "Planejamento" },
      scheduled: { color: "bg-blue-100 text-blue-700", label: "Agendado" },
      surgery_done: { color: "bg-amber-100 text-amber-700", label: "Cirurgia Realizada" },
      healing: { color: "bg-purple-100 text-purple-700", label: "Osseointegração" },
      prosthesis: { color: "bg-teal-100 text-teal-700", label: "Prótese" },
      completed: { color: "bg-green-100 text-green-700", label: "Concluído" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelado" },
    };
    const config = statusConfig[status || "planning"] || statusConfig.planning;
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
          <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300">
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
                🦴 Fila de Implante
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Área do Implantodontista</h1>
            <p className="text-muted-foreground">Gerencie sua fila e planejamentos de implantes</p>
          </div>
          <div className="flex items-center gap-2">
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
                className={hasNewPatient ? "animate-bounce border-rose-500" : ""}
              >
                {hasNewPatient ? (
                  <BellRing className="h-4 w-4 text-rose-500" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
              {waitingPatients.length > 0 && (
                <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold rounded-full bg-rose-500 text-white ${hasNewPatient ? 'animate-pulse' : ''}`}>
                  {waitingPatients.length}
                </span>
              )}
            </div>

            <Label className="text-sm ml-2">Consultório:</Label>
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

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue" className="relative">
              Fila de Atendimento
              {waitingPatients.length > 0 && (
                <Badge className={`ml-2 ${hasNewPatient ? 'animate-pulse bg-rose-500' : 'bg-amber-500'}`}>
                  {waitingPatients.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="plans">Planejamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={hasNewPatient ? "ring-2 ring-rose-500 animate-pulse" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium">Aguardando</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{waitingPatients.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">Chamados</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{calledPatients.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Bone className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium">Em Atendimento</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{inServicePatients.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-rose-500" />
                    <span className="text-sm font-medium">Planejamentos Ativos</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats?.planningPhase ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Fila de Espera */}
              <Card className={hasNewPatient ? "ring-2 ring-rose-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Fila de Espera
                    {hasNewPatient && (
                      <Badge className="bg-rose-500 animate-pulse">Novo!</Badge>
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
                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 animate-pulse' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                <span className="font-medium">{entry.patientName}</span>
                                {index === 0 && hasNewPatient && (
                                  <Badge className="bg-rose-500 text-xs">Novo</Badge>
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
                    <Bone className="h-5 w-5 text-emerald-500" />
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
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Planejamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Novo Planejamento de Implante</DialogTitle>
                    <DialogDescription>
                      Cadastre um novo planejamento de implante
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Paciente *</Label>
                        <Select
                          value={newPlan.patientId?.toString() || ""}
                          onValueChange={(v) => setNewPlan({ ...newPlan, patientId: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients?.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Dente/Região</Label>
                        <Input
                          value={newPlan.toothNumber}
                          onChange={(e) => setNewPlan({ ...newPlan, toothNumber: e.target.value })}
                          placeholder="Ex: 36, 46"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Marca do Implante</Label>
                        <Input
                          value={newPlan.implantBrand}
                          onChange={(e) => setNewPlan({ ...newPlan, implantBrand: e.target.value })}
                          placeholder="Ex: Straumann, Nobel"
                        />
                      </div>
                      <div>
                        <Label>Modelo</Label>
                        <Input
                          value={newPlan.implantModel}
                          onChange={(e) => setNewPlan({ ...newPlan, implantModel: e.target.value })}
                          placeholder="Ex: BLT, Active"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Diâmetro (mm)</Label>
                        <Input
                          value={newPlan.implantDiameter}
                          onChange={(e) => setNewPlan({ ...newPlan, implantDiameter: e.target.value })}
                          placeholder="Ex: 4.1"
                        />
                      </div>
                      <div>
                        <Label>Comprimento (mm)</Label>
                        <Input
                          value={newPlan.implantLength}
                          onChange={(e) => setNewPlan({ ...newPlan, implantLength: e.target.value })}
                          placeholder="Ex: 10"
                        />
                      </div>
                      <div>
                        <Label>Tempo Cicatrização (dias)</Label>
                        <Input
                          type="number"
                          value={newPlan.healingTime}
                          onChange={(e) => setNewPlan({ ...newPlan, healingTime: parseInt(e.target.value) || 90 })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="boneGraft"
                          checked={newPlan.boneGraft}
                          onCheckedChange={(checked) => setNewPlan({ ...newPlan, boneGraft: !!checked })}
                        />
                        <Label htmlFor="boneGraft">Enxerto Ósseo</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sinusLift"
                          checked={newPlan.sinusLift}
                          onCheckedChange={(checked) => setNewPlan({ ...newPlan, sinusLift: !!checked })}
                        />
                        <Label htmlFor="sinusLift">Levantamento de Seio</Label>
                      </div>
                    </div>
                    {newPlan.boneGraft && (
                      <div>
                        <Label>Tipo de Enxerto</Label>
                        <Input
                          value={newPlan.boneGraftType}
                          onChange={(e) => setNewPlan({ ...newPlan, boneGraftType: e.target.value })}
                          placeholder="Ex: Autógeno, Xenógeno"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data da Cirurgia</Label>
                        <Input
                          type="date"
                          value={newPlan.surgeryDate}
                          onChange={(e) => setNewPlan({ ...newPlan, surgeryDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Valor Total (R$)</Label>
                        <Input
                          type="number"
                          value={newPlan.totalValue}
                          onChange={(e) => setNewPlan({ ...newPlan, totalValue: e.target.value })}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        value={newPlan.notes}
                        onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
                        placeholder="Observações sobre o planejamento"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Planejamento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Planejamentos de Implantes</CardTitle>
                <CardDescription>
                  Lista de todos os planejamentos de implantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Dente</TableHead>
                      <TableHead>Implante</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cirurgia</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans?.map((plan) => {
                      const patient = patients?.find(p => p.id === plan.patientId);
                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {patient?.name || `Paciente #${plan.patientId}`}
                          </TableCell>
                          <TableCell>{plan.toothNumber || "-"}</TableCell>
                          <TableCell>
                            {plan.implantBrand} {plan.implantModel}
                            {plan.implantDiameter && plan.implantLength && (
                              <span className="text-muted-foreground text-xs block">
                                {plan.implantDiameter}x{plan.implantLength}mm
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(plan.status)}</TableCell>
                          <TableCell>
                            {plan.surgeryDate ? new Date(plan.surgeryDate).toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell>
                            R$ {Number(plan.totalValue || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                    <Send className="h-5 w-5 text-primary" />
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

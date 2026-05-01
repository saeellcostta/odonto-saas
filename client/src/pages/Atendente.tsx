import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Users,
  UserPlus,
  Clock,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Loader2,
  CreditCard,
  Send,
  CalendarPlus,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type QueueType = "reception" | "budget" | "dentist" | "orthodontics" | "implant" | "prosthetics" | "maxillofacial" | "pediatric";

const queueLabels: Record<QueueType, string> = {
  reception: "Recepção",
  budget: "Orçamento",
  dentist: "Dentista",
  orthodontics: "Ortodontia",
  implant: "Implante",
  prosthetics: "Prótese",
  maxillofacial: "Buco-Maxilo-Facial",
  pediatric: "Odontopediatria",
};

const queueColors: Record<QueueType, string> = {
  reception: "bg-blue-500",
  budget: "bg-amber-500",
  dentist: "bg-emerald-500",
  orthodontics: "bg-purple-500",
  implant: "bg-rose-500",
  prosthetics: "bg-cyan-500",
  maxillofacial: "bg-orange-500",
  pediatric: "bg-pink-500",
};

// Componente para mostrar paciente pago com procedimentos pendentes
function PaidPatientCard({ 
  entry, 
  getWaitTime, 
  openForwardWithProceduresDialog,
  openForwardDialog,
  openScheduleDialog,
  handleComplete 
}: {
  entry: any;
  getWaitTime: (date: Date | string | null) => string;
  openForwardWithProceduresDialog: (entry: any) => void;
  openForwardDialog: (entry: any) => void;
  openScheduleDialog: (entry: any) => void;
  handleComplete: (entry: any) => void;
}) {
  // Query para procedimentos do paciente
  const { data: procedures } = trpc.treatmentProcedures.getForSpecialist.useQuery(
    { queueEntryId: entry.id, patientId: entry.patientId },
    { enabled: !!entry.patientId && !!entry.id, refetchInterval: 5000 }
  );
  
  // Query para histórico de filas do paciente
  const { data: queueHistory } = trpc.serviceQueue.history.useQuery(
    { patientId: entry.patientId },
    { enabled: !!entry.patientId }
  );
  
  const pendingProcedures = procedures?.filter(p => p.status !== "completed") || [];
  const completedProcedures = procedures?.filter(p => p.status === "completed") || [];
  
  // Processar histórico para mostrar áreas visitadas
  const getVisitedAreas = () => {
    if (!queueHistory || queueHistory.length === 0) return [];
    
    // Filtrar apenas ações relevantes (added, forwarded, started)
    const relevantActions = queueHistory.filter(
      (h: any) => ['added', 'forwarded', 'started', 'called'].includes(h.action)
    );
    
    // Extrair áreas únicas visitadas
    const areas: string[] = [];
    relevantActions.forEach((h: any) => {
      if (h.fromQueue && !areas.includes(h.fromQueue)) {
        areas.push(h.fromQueue);
      }
      if (h.toQueue && !areas.includes(h.toQueue)) {
        areas.push(h.toQueue);
      }
    });
    
    return areas;
  };
  
  const getLastArea = () => {
    if (!queueHistory || queueHistory.length === 0) return null;
    
    // Encontrar a última área de onde veio (fromQueue mais recente)
    const lastForward = queueHistory.find(
      (h: any) => h.action === 'forwarded' || h.action === 'payment_requested'
    );
    
    return lastForward?.fromQueue || entry.originQueue || null;
  };
  
  const visitedAreas = getVisitedAreas();
  const lastArea = getLastArea();
  
  return (
    <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.patientName}</span>
            <Badge variant="default" className="bg-emerald-500">
              Pago
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Espera: {getWaitTime(entry.arrivalTime)}
            </span>
            <span>
              Valor: R$ {Number(entry.amountPaid || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Histórico de Áreas Visitadas */}
      {(lastArea || visitedAreas.length > 0) && (
        <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-sm text-orange-800 dark:text-orange-200">Trajeto do Paciente</span>
          </div>
          
          {/* Última Área - Destacada */}
          {lastArea && (
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-orange-500 text-white font-bold animate-pulse">
                🏥 VEIO DE: {queueLabels[lastArea as QueueType] || lastArea}
              </Badge>
            </div>
          )}
          
          {/* Trajeto Completo */}
          {visitedAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-muted-foreground">Passou por:</span>
              {visitedAreas.map((area, index) => (
                <span key={area} className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      area === lastArea 
                        ? 'bg-orange-100 border-orange-400 text-orange-700 font-bold' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  >
                    {queueLabels[area as QueueType] || area}
                  </Badge>
                  {index < visitedAreas.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Lista de Procedimentos Pendentes */}
      {procedures && procedures.length > 0 && (
        <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-sm">Procedimentos do Tratamento</span>
            {pendingProcedures.length > 0 && (
              <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-300">
                {pendingProcedures.length} pendente(s)
              </Badge>
            )}
            {completedProcedures.length > 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                {completedProcedures.length} concluído(s)
              </Badge>
            )}
          </div>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {procedures.map((proc) => (
              <div
                key={proc.id}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  proc.status === "completed"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-muted-foreground"
                    : "bg-amber-50 dark:bg-amber-950/30"
                }`}
              >
                {proc.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-amber-500 flex-shrink-0" />
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
      
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          size="sm"
          onClick={() => openForwardWithProceduresDialog(entry)}
          className="gap-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Stethoscope className="h-4 w-4" />
          Especialista
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openForwardDialog(entry)}
          className="gap-1"
        >
          <Send className="h-4 w-4" />
          Encaminhar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openScheduleDialog(entry)}
          className="gap-1"
        >
          <CalendarPlus className="h-4 w-4" />
          Agendar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleComplete(entry)}
          className="gap-1"
        >
          <CheckCircle className="h-4 w-4" />
          Finalizar
        </Button>
      </div>
    </div>
  );
}

export default function Atendente() {
  const { user } = useAuth();
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isCompletingWithPayment, setIsCompletingWithPayment] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedQueue, setSelectedQueue] = useState<QueueType>("budget");
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [notes, setNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [forwardQueue, setForwardQueue] = useState<QueueType>("dentist");
  const [forwardDentistId, setForwardDentistId] = useState<number | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleType, setScheduleType] = useState<QueueType>("dentist");
  const [scheduleDentistId, setScheduleDentistId] = useState<number | null>(null);
  
  // Estados para notificações
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPaymentCount, setLastPaymentCount] = useState(0);
  const [hasNewPayment, setHasNewPayment] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [currentCallPatient, setCurrentCallPatient] = useState<string>("");
  const [returnFromArea, setReturnFromArea] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Estados para encaminhamento com procedimentos
  const [forwardWithProceduresOpen, setForwardWithProceduresOpen] = useState(false);
  const [selectedProcedures, setSelectedProcedures] = useState<number[]>([]);

  const utils = trpc.useUtils();
  
  // Queries - Usar apenas pacientes ativados para o dia
  const { data: patients } = trpc.patients.listActiveToday.useQuery();
  
  // Query para buscar dentistas da clínica (para agendamento)
  const { data: clinicUsers } = trpc.admin.clinics.getUsersWithDetails.useQuery(
    { clinicId: user?.clinicId || 0 },
    { enabled: !!user?.clinicId }
  );
  
  // Filtrar apenas dentistas e especialistas
  const dentists = clinicUsers?.filter((u: any) => 
    ['dentista', 'ortodontista', 'implantodontista', 'protesista', 'bucomaxilo', 'odontopediatria'].includes(u.role)
  ) || [];
  const { data: queueStats } = trpc.serviceQueue.stats.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const { data: receptionQueue, isLoading: loadingReception } = trpc.serviceQueue.list.useQuery(
    { queueType: "reception" },
    { refetchInterval: 3000 }
  );
  const { data: pendingPayments } = trpc.serviceQueue.list.useQuery(
    {},
    { refetchInterval: 3000 }
  );
  
  // Filter pending payments
  const paymentsToReceive = pendingPayments?.filter(p => p.status === "pending_payment" && p.queueType === "reception") || [];
  
  // Query para procedimentos do tratamento (quando modal de encaminhamento está aberto)
  // Usa getForSpecialist que busca por queueEntryId OU por patientId
  const { data: treatmentProcedures } = trpc.treatmentProcedures.getForSpecialist.useQuery(
    { queueEntryId: selectedEntry?.id || 0, patientId: selectedEntry?.patientId },
    { enabled: !!selectedEntry && (forwardDialogOpen || forwardWithProceduresOpen) }
  );
  
  // Função para buscar procedimentos de um paciente específico
  const getProceduresForPatient = (patientId: number) => {
    return trpc.treatmentProcedures.getForSpecialist.useQuery(
      { queueEntryId: 0, patientId },
      { enabled: !!patientId, refetchInterval: 5000 }
    );
  };

  // Função para tocar som de notificação
  const playNotificationSound = useCallback((type: 'return' | 'new' | 'urgent' = 'return') => {
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
        case 'return':
          // Som de retorno - melodia ascendente suave
          playSequence([523, 659, 784], [0.15, 0.15, 0.25]);
          break;
        case 'new':
          // Som de novo paciente - dois tons
          playSequence([440, 550], [0.2, 0.3]);
          break;
        case 'urgent':
          // Som urgente - alternado
          playSequence([880, 440, 880], [0.1, 0.1, 0.2]);
          break;
      }
    } catch (e) {
      console.warn("Erro ao tocar som:", e);
    }
  }, [soundEnabled]);

  // Detectar novos pagamentos pendentes (pacientes retornando)
  useEffect(() => {
    const currentCount = paymentsToReceive.length;
    
    if (currentCount > lastPaymentCount && lastPaymentCount > 0) {
      // Novo paciente retornou!
      const newPatient = paymentsToReceive[0];
      const originArea = queueLabels[newPatient?.originQueue as QueueType] || 'atendimento';
      
      setHasNewPayment(true);
      setCurrentCallPatient(newPatient?.patientName || "Paciente");
      setReturnFromArea(originArea);
      setShowCallOverlay(true);
      
      // Tocar som
      playNotificationSound('return');
      
      // Mostrar toast destacado
      toast.info(`🔔 RETORNO DE ${originArea.toUpperCase()}`, {
        description: `${newPatient?.patientName} retornou do ${originArea}`,
        duration: 10000,
        className: "border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/30",
      });
      
      // Esconder overlay após 8 segundos
      setTimeout(() => {
        setShowCallOverlay(false);
        setHasNewPayment(false);
      }, 8000);
    }
    
    setLastPaymentCount(currentCount);
  }, [paymentsToReceive.length, lastPaymentCount, playNotificationSound]);

  // Mutations
  const addToQueue = trpc.serviceQueue.add.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      setAddPatientOpen(false);
      resetForm();
      toast.success("Paciente adicionado à fila!");
    },
    onError: () => toast.error("Erro ao adicionar paciente à fila"),
  });

  const receivePayment = trpc.serviceQueue.receivePayment.useMutation({
    onSuccess: (data) => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      
      // Se estava finalizando com pagamento, finalizar o atendimento agora
      if (isCompletingWithPayment && selectedEntry) {
        setTimeout(() => handleCompleteAfterPayment(), 500);
      }
      
      setPaymentDialogOpen(false);
      resetPaymentForm();
      playNotificationSound('new');
      toast.success(data.paymentStatus === "paid" ? "✅ Pagamento recebido!" : "Pagamento parcial registrado!");
    },
    onError: () => toast.error("Erro ao registrar pagamento"),
  });

  const forwardPatient = trpc.serviceQueue.forward.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      utils.tvPanel.activeCalls.invalidate();
      setForwardDialogOpen(false);
      setForwardWithProceduresOpen(false);
      setSelectedProcedures([]);
      toast.success("Paciente encaminhado!");
    },
    onError: () => toast.error("Erro ao encaminhar paciente"),
  });

  const linkProcedures = trpc.treatmentProcedures.linkToQueueEntry.useMutation({
    onSuccess: () => {
      utils.treatmentProcedures.getByQueueEntry.invalidate();
    },
  });

  const completeService = trpc.serviceQueue.complete.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      toast.success("Atendimento finalizado!");
    },
    onError: () => toast.error("Erro ao finalizar atendimento"),
  });

  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      utils.appointments.list.invalidate();
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      setScheduleDialogOpen(false);
      resetScheduleForm();
      toast.success("Consulta agendada com sucesso!");
    },
    onError: () => toast.error("Erro ao agendar consulta"),
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedQueue("budget");
    setPriority("normal");
    setNotes("");
  };

  const resetPaymentForm = () => {
    setSelectedEntry(null);
    setPaymentAmount("");
    setPaymentMethod("");
  };

  const resetScheduleForm = () => {
    setSelectedEntry(null);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleType("dentist");
  };

  const handleSchedule = () => {
    if (!selectedEntry || !scheduleDate || !scheduleTime) {
      toast.error("Preencha data e horário");
      return;
    }

    createAppointment.mutate({
      patientId: selectedEntry.patientId,
      date: scheduleDate,
      startTime: scheduleTime,
      endTime: scheduleTime,
      type: scheduleType,
      notes: notes || `Retorno agendado - ${queueLabels[scheduleType]}`,
    });

    // Finaliza o atendimento atual
    completeService.mutate({ id: selectedEntry.id });
  };

  const openScheduleDialog = (entry: any) => {
    setSelectedEntry(entry);
    setScheduleDialogOpen(true);
  };

  const handleAddToQueue = () => {
    if (!selectedPatient) {
      toast.error("Selecione um paciente");
      return;
    }

    addToQueue.mutate({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      queueType: selectedQueue,
      priority,
      notes,
    });
  };

  const handleReceivePayment = () => {
    if (!selectedEntry || !paymentAmount || !paymentMethod) {
      toast.error("Preencha todos os campos");
      return;
    }

    receivePayment.mutate({
      id: selectedEntry.id,
      amountPaid: parseFloat(paymentAmount),
      paymentMethod,
    });
  };

  const handleForward = () => {
    if (!selectedEntry) return;

    forwardPatient.mutate({
      id: selectedEntry.id,
      nextQueue: forwardQueue,
      notes,
      professionalId: forwardDentistId || undefined,
    });
  };

  const handleComplete = (entry: any) => {
    // Abrir diálogo de pagamento para registrar o valor antes de finalizar
    setIsCompletingWithPayment(true);
    openPaymentDialog(entry);
  };

  const handleCompleteAfterPayment = () => {
    if (!selectedEntry) return;
    completeService.mutate({ id: selectedEntry.id });
    setIsCompletingWithPayment(false);
  };

  const openPaymentDialog = (entry: any) => {
    setSelectedEntry(entry);
    setPaymentAmount(entry.amountToPay?.toString() || "");
    setPaymentDialogOpen(true);
  };

  const openForwardDialog = (entry: any) => {
    setSelectedEntry(entry);
    setSelectedProcedures([]);
    setForwardDialogOpen(true);
  };

  const openForwardWithProceduresDialog = (entry: any) => {
    setSelectedEntry(entry);
    setSelectedProcedures([]);
    setForwardWithProceduresOpen(true);
  };

  const handleForwardWithProcedures = () => {
    if (!selectedEntry) return;

    // Encaminhar paciente
    forwardPatient.mutate({
      id: selectedEntry.id,
      nextQueue: forwardQueue,
      notes,
    });
  };

  const toggleProcedureSelection = (procedureId: number) => {
    setSelectedProcedures(prev => 
      prev.includes(procedureId)
        ? prev.filter(id => id !== procedureId)
        : [...prev, procedureId]
    );
  };

  const selectAllPendingProcedures = () => {
    const pendingIds = treatmentProcedures
      ?.filter(p => p.status !== "completed")
      .map(p => p.id) || [];
    setSelectedProcedures(pendingIds);
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getWaitTime = (arrivalTime: Date | string | null) => {
    if (!arrivalTime) return "-";
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
  };

  return (
    <DashboardLayout>
      {/* Overlay de Notificação de Retorno */}
      {showCallOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowCallOverlay(false)}
        >
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300 border-4 border-white/30">
            {/* Badge de Retorno Destacado */}
            <div className="bg-white/20 rounded-xl p-3 mb-4 border border-white/30">
              <div className="flex items-center justify-center gap-2">
                <ArrowRight className="h-5 w-5 text-white animate-pulse" />
                <span className="text-lg font-bold text-white uppercase tracking-wider">
                  RETORNO DE: {returnFromArea.toUpperCase()}
                </span>
                <ArrowRight className="h-5 w-5 text-white animate-pulse rotate-180" />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-white/20 animate-pulse">
                <BellRing className="h-8 w-8 text-white" />
              </div>
              <span className="text-xl font-semibold text-white tracking-wide">
                PACIENTE RETORNOU
              </span>
            </div>
            
            <div className="text-4xl font-bold text-white mb-4 animate-pulse">
              {currentCallPatient}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-white/90">
              <span className="bg-emerald-600/80 px-4 py-2 rounded-lg font-medium">
                🏥 Veio do {returnFromArea}
              </span>
              <span className="bg-white/20 px-4 py-2 rounded-lg">
                💰 Aguardando Pagamento
              </span>
            </div>
            
            <p className="text-white/70 mt-4 text-sm">
              Clique para fechar
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Área do Atendente</h1>
            <p className="text-muted-foreground">Gerencie a recepção e filas de atendimento</p>
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
                className={hasNewPayment ? "animate-bounce border-blue-500" : ""}
              >
                {hasNewPayment ? (
                  <BellRing className="h-4 w-4 text-blue-500" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
              {paymentsToReceive.length > 0 && (
                <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold rounded-full bg-red-500 text-white ${hasNewPayment ? 'animate-pulse' : ''}`}>
                  {paymentsToReceive.length}
                </span>
              )}
            </div>

            <Dialog open={addPatientOpen} onOpenChange={setAddPatientOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Adicionar à Fila
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Paciente à Fila</DialogTitle>
                  <DialogDescription>
                    Selecione o paciente e a fila de destino
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Paciente *</Label>
                    <Select
                      value={selectedPatient?.id?.toString() || ""}
                      onValueChange={(value) => {
                        const patient = patients?.find(p => p.id === parseInt(value));
                        setSelectedPatient(patient);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients?.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fila de Destino *</Label>
                    <Select value={selectedQueue} onValueChange={(v) => setSelectedQueue(v as QueueType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Orçamento</SelectItem>
                        <SelectItem value="dentist">Dentista</SelectItem>
                        <SelectItem value="orthodontics">Ortodontia</SelectItem>
                        <SelectItem value="implant">Implante</SelectItem>
                        <SelectItem value="prosthetics">Prótese</SelectItem>
                        <SelectItem value="maxillofacial">Buco-Maxilo-Facial</SelectItem>
                        <SelectItem value="pediatric">Odontopediatria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre o atendimento"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddPatientOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddToQueue} disabled={addToQueue.isPending}>
                    {addToQueue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {(["budget", "dentist", "orthodontics", "implant", "prosthetics", "maxillofacial", "pediatric", "reception"] as QueueType[]).map((queue) => (
            <Card key={queue} className={queue === "reception" && (queueStats?.reception || 0) > 0 ? "ring-2 ring-blue-500 animate-pulse" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${queueColors[queue]}`} />
                  <span className="text-sm font-medium">{queueLabels[queue]}</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {queueStats?.[queue] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">na fila</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments" className="gap-2 relative">
              <DollarSign className="h-4 w-4" />
              Pagamentos Pendentes
              {paymentsToReceive.length > 0 && (
                <Badge variant="destructive" className={`ml-1 ${hasNewPayment ? 'animate-pulse' : ''}`}>
                  {paymentsToReceive.length}
                </Badge>
              )}
              {hasNewPayment && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forward" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Encaminhar/Finalizar
            </TabsTrigger>
          </TabsList>

          {/* Pagamentos Pendentes */}
          <TabsContent value="payments">
            <Card className={hasNewPayment ? "ring-2 ring-blue-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  Pagamentos Pendentes
                  {hasNewPayment && (
                    <Badge className="bg-blue-500 animate-pulse">Novo!</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Pacientes aguardando pagamento após avaliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsToReceive.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pagamento pendente</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {paymentsToReceive.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                            index === 0 && hasNewPayment 
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 animate-pulse' 
                              : 'bg-amber-50 dark:bg-amber-950/20'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.patientName}</span>
                              {index === 0 && hasNewPayment && (
                                <Badge className="bg-blue-500 text-xs">Novo</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                Veio de: {queueLabels[entry.originQueue as QueueType] || entry.originQueue}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(entry.arrivalTime)}
                              </span>
                              {entry.originProfessional && (
                                <span>Por: {entry.originProfessional}</span>
                              )}
                            </div>
                            {entry.evaluationNotes && (
                              <p className="text-sm mt-2 text-muted-foreground italic">
                                "{entry.evaluationNotes}"
                              </p>
                            )}
                            <div className="mt-2">
                              <span className="text-lg font-bold text-amber-600">
                                R$ {Number(entry.amountToPay || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {entry.paymentStatus === 'paid' ? (
                              <Button
                                size="sm"
                                disabled
                                className="gap-1 bg-emerald-500 hover:bg-emerald-500 text-white cursor-default"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Pago
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openPaymentDialog(entry)}
                                className="gap-1"
                              >
                                <CreditCard className="h-4 w-4" />
                                Receber
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Encaminhar/Finalizar */}
          <TabsContent value="forward">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-emerald-500" />
                  Pacientes Pagos - Encaminhar ou Finalizar
                </CardTitle>
                <CardDescription>
                  Pacientes que já pagaram e aguardam encaminhamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReception ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : receptionQueue && receptionQueue.filter(e => e.paymentStatus === "paid").length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {receptionQueue.filter(e => e.paymentStatus === "paid").map((entry) => (
                        <PaidPatientCard 
                          key={entry.id} 
                          entry={entry} 
                          getWaitTime={getWaitTime}
                          openForwardWithProceduresDialog={openForwardWithProceduresDialog}
                          openForwardDialog={openForwardDialog}
                          openScheduleDialog={openScheduleDialog}
                          handleComplete={handleComplete}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum paciente aguardando encaminhamento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Pagamento */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receber Pagamento</DialogTitle>
              <DialogDescription>
                Registre o pagamento do paciente {selectedEntry?.patientName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Valor a Receber</p>
                <p className="text-2xl font-bold">
                  R$ {Number(selectedEntry?.amountToPay || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <Label>Valor Recebido *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Forma de Pagamento *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_credito_parcelado">Cartão Parcelado</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReceivePayment} disabled={receivePayment.isPending}>
                {receivePayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Agendamento */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Retorno</DialogTitle>
              <DialogDescription>
                Agende um retorno para {selectedEntry?.patientName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div>
                <Label>Tipo de Atendimento *</Label>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as QueueType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="dentist">Dentista</SelectItem>
                    <SelectItem value="orthodontics">Ortodontia</SelectItem>
                    <SelectItem value="implant">Implante</SelectItem>
                    <SelectItem value="prosthetics">Prótese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dentista (opcional)</Label>
                <Select 
                  value={scheduleDentistId?.toString() || "none"} 
                  onValueChange={(v) => setScheduleDentistId(v === "none" ? null : parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um dentista (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (qualquer disponível)</SelectItem>
                    {dentists.map((dentist: any) => (
                      <SelectItem key={dentist.userId} value={dentist.userId.toString()}>
                        {dentist.name || dentist.email} - {dentist.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Deixe em branco para agendar com qualquer dentista disponível</p>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações para o agendamento"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSchedule} disabled={createAppointment.isPending}>
                {createAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agendar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Encaminhamento */}
        <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Encaminhar Paciente</DialogTitle>
              <DialogDescription>
                Encaminhe {selectedEntry?.patientName} para outra área
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Encaminhar para *</Label>
                <Select value={forwardQueue} onValueChange={(v) => setForwardQueue(v as QueueType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dentist">Dentista</SelectItem>
                    <SelectItem value="orthodontics">Ortodontia</SelectItem>
                    <SelectItem value="implant">Implante</SelectItem>
                    <SelectItem value="prosthetics">Prótese</SelectItem>
                    <SelectItem value="maxillofacial">Buco-Maxilo-Facial</SelectItem>
                    <SelectItem value="pediatric">Odontopediatria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profissional (Opcional)</Label>
                <Select value={forwardDentistId?.toString() || ""} onValueChange={(v) => setForwardDentistId(v ? parseInt(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem profissional específico</SelectItem>
                    {dentists.map((dentist: any) => (
                      <SelectItem key={dentist.id} value={dentist.id.toString()}>
                        {dentist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações para o próximo atendimento"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleForward} disabled={forwardPatient.isPending}>
                {forwardPatient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Encaminhar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Encaminhamento com Procedimentos (para especialistas - sem valores) */}
        <Dialog open={forwardWithProceduresOpen} onOpenChange={setForwardWithProceduresOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-500" />
                Encaminhar para Especialista
              </DialogTitle>
              <DialogDescription>
                Encaminhe {selectedEntry?.patientName} com os procedimentos a realizar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Encaminhar para *</Label>
                <Select value={forwardQueue} onValueChange={(v) => setForwardQueue(v as QueueType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dentist">Dentista</SelectItem>
                    <SelectItem value="orthodontics">Ortodontia</SelectItem>
                    <SelectItem value="implant">Implante</SelectItem>
                    <SelectItem value="prosthetics">Prótese</SelectItem>
                    <SelectItem value="maxillofacial">Buco-Maxilo-Facial</SelectItem>
                    <SelectItem value="pediatric">Odontopediatria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Procedimentos (SEM VALORES) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Procedimentos a Realizar
                  </Label>
                  {treatmentProcedures && treatmentProcedures.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllPendingProcedures}
                    >
                      Selecionar Pendentes
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[200px] border rounded-lg p-3">
                  {!treatmentProcedures || treatmentProcedures.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum procedimento cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {treatmentProcedures.map((proc) => (
                        <div
                          key={proc.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                            proc.status === "completed"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200"
                              : selectedProcedures.includes(proc.id)
                              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-300"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            checked={selectedProcedures.includes(proc.id) || proc.status === "completed"}
                            disabled={proc.status === "completed"}
                            onCheckedChange={() => toggleProcedureSelection(proc.id)}
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
                            variant={proc.status === "completed" ? "default" : "outline"}
                            className={proc.status === "completed" ? "bg-emerald-500" : ""}
                          >
                            {proc.status === "completed" ? "Concluído" : "Pendente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-1">
                  * Valores não são exibidos para especialistas
                </p>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações para o especialista"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForwardWithProceduresOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleForwardWithProcedures} disabled={forwardPatient.isPending}>
                {forwardPatient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Encaminhar para {queueLabels[forwardQueue]}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

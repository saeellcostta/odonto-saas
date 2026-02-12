import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Calculator, Users, Clock, Play, DollarSign, Loader2, Phone, ArrowRight, CheckCircle, Stethoscope, Receipt, UserPlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dentes permanentes (adulto)
const permanentTeeth = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

// Dentes decíduos (criança) - Notação FDI
const deciduousTeeth = {
  upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
};

// Condições dentárias
const toothConditions = [
  { id: "healthy", name: "Saudável", color: "bg-green-500", textColor: "text-green-700" },
  { id: "caries", name: "Cárie", color: "bg-red-500", textColor: "text-red-700" },
  { id: "restoration", name: "Restauração", color: "bg-blue-500", textColor: "text-blue-700" },
  { id: "extraction", name: "Extração", color: "bg-gray-500", textColor: "text-gray-700" },
  { id: "implant", name: "Implante", color: "bg-purple-500", textColor: "text-purple-700" },
  { id: "crown", name: "Coroa", color: "bg-yellow-500", textColor: "text-yellow-700" },
  { id: "bridge", name: "Ponte", color: "bg-blue-600", textColor: "text-blue-800" },
  { id: "canal", name: "Canal", color: "bg-orange-500", textColor: "text-orange-700" },
  { id: "fracture", name: "Fratura", color: "bg-red-600", textColor: "text-red-800" },
  { id: "absent", name: "Ausente", color: "bg-gray-300", textColor: "text-gray-500" },
];

// Faces do dente
const toothFaces = [
  { id: "V", name: "Vestibular", short: "V" },
  { id: "L", name: "Lingual", short: "L" },
  { id: "M", name: "Mesial", short: "M" },
  { id: "D", name: "Distal", short: "D" },
  { id: "O", name: "Oclusal", short: "O" },
];

type ToothTreatment = {
  toothNumber: number;
  condition: string;
  conditionName: string;
  faces: string[];
};

type BudgetItem = {
  toothNumber: number | "upper_arch" | "lower_arch" | "full";
  procedureId: number;
  procedureName: string;
  price: number;
  condition?: string;
  faces?: string[];
};

export default function Orcamentista() {
  // Estados do atendimento atual
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<number | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState("");
  
  // Estados da área de Tratamento
  const [selectedCondition, setSelectedCondition] = useState<string>("caries");
  const [selectedFaces, setSelectedFaces] = useState<string[]>([]);
  const [toothTreatments, setToothTreatments] = useState<ToothTreatment[]>([]);
  const [activeTab, setActiveTab] = useState<string>("treatment");
  
  // Estados da Fila
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedDentist, setSelectedDentist] = useState("");
  const [teethType, setTeethType] = useState<"permanent" | "deciduous">("permanent");
  
  // Estados do Modal de Cadastro Manual
  const [showManualPatientDialog, setShowManualPatientDialog] = useState(false);
  const [manualPatientName, setManualPatientName] = useState("");
  const [manualPatientPhone, setManualPatientPhone] = useState("");

  const utils = trpc.useUtils();
  const { data: procedures, isLoading: loadingProcedures } = trpc.procedures.list.useQuery({});
  const { data: offices } = trpc.offices.list.useQuery();
  const { data: dentists } = trpc.dentists.list.useQuery();
  const { data: budgetQueue, isLoading: loadingQueue } = trpc.serviceQueue.list.useQuery({ queueType: "budget" });
  const { data: stats } = trpc.serviceQueue.stats.useQuery();

  // Filter waiting patients
  const waitingPatients = budgetQueue?.filter(p => p.status === "waiting") || [];
  const inServicePatients = budgetQueue?.filter(p => p.status === "in_service" || p.status === "called") || [];

  // Mutations
  const callPatient = trpc.serviceQueue.callPatient.useMutation({
    onSuccess: (data, variables) => {
      utils.serviceQueue.list.invalidate();
      utils.tvPanel.activeCalls.invalidate();
      const patient = waitingPatients.find(p => p.id === variables.id);
      if (patient) {
        setCurrentPatient(patient);
      }
      toast.success("Paciente chamado!");
    },
    onError: () => toast.error("Erro ao chamar paciente"),
  });

  const startService = trpc.serviceQueue.startService.useMutation({
    onSuccess: (data, variables) => {
      utils.serviceQueue.list.invalidate();
      // Encontrar o paciente nos dados atualizados
      const updatedPatient = budgetQueue?.find(p => p.id === variables.id);
      if (updatedPatient) {
        setCurrentPatient(updatedPatient);
      }
      toast.success("Atendimento iniciado!");
    },
    onError: () => toast.error("Erro ao iniciar atendimento"),
  });

  const cancelService = trpc.serviceQueue.cancel.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      setCurrentPatient(null);
      setBudgetItems([]);
      setSelectedTeeth([]);
      setToothTreatments([]);
      setTreatmentNotes("");
      setActiveTab("treatment");
      toast.success("Atendimento cancelado!");
    },
    onError: () => toast.error("Erro ao cancelar atendimento"),
  });

  const requestPayment = trpc.serviceQueue.requestPayment.useMutation({
    onSuccess: () => {
      utils.serviceQueue.list.invalidate();
      utils.serviceQueue.stats.invalidate();
      setCurrentPatient(null);
      setBudgetItems([]);
      setSelectedTeeth([]);
      setToothTreatments([]);
      setTreatmentNotes("");
      setActiveTab("treatment");
      toast.success("Avaliação concluída! Paciente encaminhado para o Atendente.");
    },
    onError: () => toast.error("Erro ao finalizar avaliação"),
  });

  const createTreatmentProcedures = trpc.treatmentProcedures.create.useMutation({
    onSuccess: () => {
      utils.treatmentProcedures.getByPatient.invalidate();
    },
    onError: () => toast.error("Erro ao criar procedimentos do tratamento"),
  });

  // Mutation para criar paciente manual
  const createPatient = trpc.patients.createManualWithQueue.useMutation({
    onSuccess: (result) => {
      utils.patients.list.invalidate();
      utils.serviceQueue.list.invalidate();
      // Apos criar o paciente e a entrada na fila, define como paciente atual
      setCurrentPatient({
        id: result.queueEntryId,
        patientId: result.patientId,
        patientName: manualPatientName.trim(),
        patientPhone: manualPatientPhone.trim() || "",
        status: "in_service",
      });
      const savedName = manualPatientName.trim();
      setShowManualPatientDialog(false);
      setManualPatientName("");
      setManualPatientPhone("");
      toast.success(`Paciente ${savedName} cadastrado e pronto para atendimento!`);
    },
    onError: () => toast.error("Erro ao cadastrar paciente"),
  });

  // Handler para cadastro manual de paciente
  const handleManualPatientSubmit = () => {
    if (!manualPatientName.trim()) {
      toast.error("Digite o nome do paciente");
      return;
    }
    if (!selectedOffice) {
      toast.error("Selecione um consultório primeiro");
      return;
    }
    if (!selectedDentist) {
      toast.error("Selecione um dentista primeiro");
      return;
    }
    const office = offices?.find(o => o.id === Number(selectedOffice));
    const dentist = dentists?.find(d => d.id === Number(selectedDentist));
    
    if (!office || !dentist) {
      toast.error("Consultorio ou dentista nao encontrado");
      return;
    }
    
    createPatient.mutate({
      name: manualPatientName.trim(),
      phone: manualPatientPhone.trim() || undefined,
      officeId: Number(selectedOffice),
      officeName: office.name,
      professionalName: dentist.name,
    });
  };

  // Handlers da Fila
  const handleCallPatient = (entry: any) => {
    if (!selectedOffice) {
      toast.error("Selecione um consultório primeiro");
      return;
    }
    if (!selectedDentist) {
      toast.error("Selecione um dentista primeiro");
      return;
    }
    const office = offices?.find(o => o.id === parseInt(selectedOffice));
    const dentist = dentists?.find(d => d.id === parseInt(selectedDentist));
    if (!office || !dentist) return;

    callPatient.mutate({
      id: entry.id,
      officeId: office.id,
      officeName: office.name,
      professionalName: dentist.name,
    });
  };

  const handleStartService = (entry: any) => {
    if (!entry || !entry.id) {
      toast.error("Erro: Paciente inválido");
      return;
    }
    setCurrentPatient(entry);
    startService.mutate({ id: entry.id });
  };

  // Enviar para o Atendente
  const handleFinishAndSendToAttendant = async () => {
    if (!currentPatient) {
      toast.error("Nenhum paciente em atendimento");
      return;
    }

    if (budgetItems.length === 0) {
      toast.error("Adicione pelo menos um procedimento ao orçamento");
      return;
    }

    const treatmentDescription = budgetItems.map(item => 
      `${item.procedureName} - ${getToothLabel(item.toothNumber)} - ${formatCurrency(item.price)}`
    ).join("\n");

    const fullNotes = treatmentNotes 
      ? `${treatmentDescription}\n\nObservações: ${treatmentNotes}`
      : treatmentDescription;

    // Criar procedimentos do tratamento para rastreamento pelos especialistas
    try {
      await createTreatmentProcedures.mutateAsync({
        patientId: currentPatient.patientId,
        queueEntryId: currentPatient.id,
        procedures: budgetItems.map(item => ({
          procedureId: item.procedureId,
          procedureName: item.procedureName,
          toothNumber: typeof item.toothNumber === 'number' ? item.toothNumber.toString() : item.toothNumber,
          faces: item.faces?.join(','),
          condition: item.condition,
          price: item.price,
        })),
      });
    } catch (error) {
      console.error("Erro ao criar procedimentos:", error);
      // Continua mesmo se falhar
    }

    requestPayment.mutate({
      id: currentPatient.id,
      amountToPay: totalValue,
      evaluationNotes: fullNotes,
    });
  };

  // Handlers do Odontograma - Área de Tratamento
  const handleToothClickTreatment = (tooth: number) => {
    const condition = toothConditions.find(c => c.id === selectedCondition);
    if (!condition) return;

    // Verificar se já existe tratamento para este dente
    const existingIndex = toothTreatments.findIndex(t => t.toothNumber === tooth);
    
    if (existingIndex >= 0) {
      // Atualizar tratamento existente
      setToothTreatments(prev => prev.map((t, i) => 
        i === existingIndex 
          ? { ...t, condition: selectedCondition, conditionName: condition.name, faces: selectedFaces.length > 0 ? selectedFaces : [] }
          : t
      ));
    } else {
      // Adicionar novo tratamento
      setToothTreatments(prev => [...prev, {
        toothNumber: tooth,
        condition: selectedCondition,
        conditionName: condition.name,
        faces: selectedFaces.length > 0 ? [...selectedFaces] : [],
      }]);
    }

    const facesText = selectedFaces.length > 0 ? ` (${selectedFaces.join(", ")})` : "";
    toast.success(`Dente ${tooth}: ${condition.name}${facesText}`);
  };

  // Handlers do Odontograma - Área de Orçamento
  const handleToothClick = (tooth: number) => {
    setSelectedTeeth((prev) =>
      prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]
    );
  };

  const currentTeeth = teethType === "permanent" ? permanentTeeth : deciduousTeeth;

  const handleSelectAllUpper = () => {
    const allUpper = currentTeeth.upper;
    const allSelected = allUpper.every((t) => selectedTeeth.includes(t));
    if (allSelected) {
      setSelectedTeeth((prev) => prev.filter((t) => !allUpper.includes(t)));
    } else {
      setSelectedTeeth((prev) => Array.from(new Set([...prev, ...allUpper])));
    }
  };

  const handleSelectAllLower = () => {
    const allLower = currentTeeth.lower;
    const allSelected = allLower.every((t) => selectedTeeth.includes(t));
    if (allSelected) {
      setSelectedTeeth((prev) => prev.filter((t) => !allLower.includes(t)));
    } else {
      setSelectedTeeth((prev) => Array.from(new Set([...prev, ...allLower])));
    }
  };

  const handleTeethTypeChange = (type: "permanent" | "deciduous") => {
    setTeethType(type);
    setSelectedTeeth([]);
    setToothTreatments([]);
  };

  const handleFaceToggle = (faceId: string) => {
    setSelectedFaces(prev => 
      prev.includes(faceId) 
        ? prev.filter(f => f !== faceId)
        : [...prev, faceId]
    );
  };

  const handleRemoveTreatment = (toothNumber: number) => {
    setToothTreatments(prev => prev.filter(t => t.toothNumber !== toothNumber));
  };

  // Mapeamento de condições para procedimentos sugeridos
  // Inclui múltiplas variações de nomes para aumentar a chance de match
  const conditionToProcedureMap: Record<string, string[]> = {
    "caries": ["Restauração", "Restauracao", "Resina", "Amal"],
    "restoration": ["Restauração", "Restauracao", "Resina", "Amal"],
    "extraction": ["Extração", "Extracao", "Exodontia", "Avulsão"],
    "implant": ["Implante", "Implant", "Ósseo", "Osseo"],
    "crown": ["Coroa", "Prótese", "Protese", "Metaloc"],
    "bridge": ["Ponte", "Prótese", "Protese", "Fixa"],
    "canal": ["Canal", "Endodontia", "Endodôntico", "Tratamento de canal", "Pulpectomia"],
    "fracture": ["Extração", "Restauração", "Extracao", "Restauracao"],
    "healthy": [],
    "absent": [],
  };

  // Ir para Orçamento com dados do tratamento - transferência automática
  const handleGoTobudget = () => {
    if (toothTreatments.length === 0) {
      toast.error("Adicione pelo menos um tratamento antes de ir para o orçamento");
      return;
    }

    // Transferir tratamentos para seleção de dentes no orçamento
    const teethFromTreatments = toothTreatments.map(t => t.toothNumber);
    setSelectedTeeth(teethFromTreatments);

    // Criar itens de orçamento automaticamente baseado nas condições
    const newBudgetItems: BudgetItem[] = [];
    
    toothTreatments.forEach(treatment => {
      const suggestedProcedureNames = conditionToProcedureMap[treatment.condition] || [];
      
      // Buscar procedimento correspondente - tenta múltiplas estratégias
      let matchedProcedure = null;
      
      // Estratégia 1: Buscar pelo mapeamento de condições
      for (const procName of suggestedProcedureNames) {
        matchedProcedure = procedures?.find(p => 
          p.name.toLowerCase().includes(procName.toLowerCase())
        );
        if (matchedProcedure) break;
      }
      
      // Estratégia 2: Se não encontrou, busca pelo nome da condição diretamente
      if (!matchedProcedure && treatment.condition) {
        const conditionName = toothConditions.find(c => c.id === treatment.condition)?.name || "";
        matchedProcedure = procedures?.find(p => 
          p.name.toLowerCase().includes(conditionName.toLowerCase()) ||
          conditionName.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
        );
      }
      
      // Estratégia 3: Se ainda não encontrou, tenta match parcial mais flexível
      if (!matchedProcedure && suggestedProcedureNames.length > 0) {
        const firstSuggestion = suggestedProcedureNames[0].toLowerCase();
        matchedProcedure = procedures?.find(p => {
          const procNameLower = p.name.toLowerCase();
          // Verifica se as 3 primeiras letras coincidem
          return procNameLower.substring(0, 3) === firstSuggestion.substring(0, 3);
        });
      }

      if (matchedProcedure) {
        newBudgetItems.push({
          toothNumber: treatment.toothNumber,
          procedureId: matchedProcedure.id,
          procedureName: matchedProcedure.name,
          price: parseFloat(matchedProcedure.pricePerTooth || "0"),
          condition: treatment.condition,
          faces: treatment.faces,
        });
      } else {
        // Log para debug - tratamento não encontrou procedimento correspondente
        console.log(`Tratamento ${treatment.condition} não encontrou procedimento correspondente. Procedimentos disponíveis:`, procedures?.map(p => p.name));
      }
    });

    if (newBudgetItems.length > 0) {
      setBudgetItems(prev => [...prev, ...newBudgetItems]);
    }

    // Mostrar mensagem de transição para o usuário saber que mudou de aba
    const message = newBudgetItems.length > 0 
      ? `📄 Indo para Orçamento - ${newBudgetItems.length} procedimento(s) adicionado(s)!`
      : "📄 Indo para Orçamento - Selecione os procedimentos manualmente.";
    
    toast.success(message, { 
      duration: 5000,
      style: {
        background: '#f97316',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        padding: '16px',
      }
    });

    setActiveTab("budget");
  };

  const handleAddProcedure = () => {
    if (!selectedProcedure) {
      toast.error("Selecione um procedimento");
      return;
    }

    const procedure = procedures?.find((p) => p.id === selectedProcedure);
    if (!procedure) return;

    if (selectedTeeth.length === 0) {
      toast.error("Selecione pelo menos um dente");
      return;
    }

    const newItems: BudgetItem[] = selectedTeeth.map((tooth) => {
      const treatment = toothTreatments.find(t => t.toothNumber === tooth);
      return {
        toothNumber: tooth,
        procedureId: procedure.id,
        procedureName: procedure.name,
        price: parseFloat(procedure.pricePerTooth || "0"),
        condition: treatment?.condition,
        faces: treatment?.faces,
      };
    });

    setBudgetItems((prev) => [...prev, ...newItems]);
    setSelectedTeeth([]);
    toast.success(`${newItems.length} procedimento(s) adicionado(s)`);
  };

  const handleAddArchProcedure = (arch: "upper_arch" | "lower_arch" | "full") => {
    if (!selectedProcedure) {
      toast.error("Selecione um procedimento");
      return;
    }

    const procedure = procedures?.find((p) => p.id === selectedProcedure);
    if (!procedure) return;

    let price = 0;
    let label = "";

    if (arch === "upper_arch") {
      price = parseFloat(procedure.priceUpperArch || procedure.pricePerTooth || "0");
      label = "Arcada Superior";
    } else if (arch === "lower_arch") {
      price = parseFloat(procedure.priceLowerArch || procedure.pricePerTooth || "0");
      label = "Arcada Inferior";
    } else {
      price =
        parseFloat(procedure.priceUpperArch || procedure.pricePerTooth || "0") +
        parseFloat(procedure.priceLowerArch || procedure.pricePerTooth || "0");
      label = "Arcada Completa";
    }

    setBudgetItems((prev) => [
      ...prev,
      {
        toothNumber: arch,
        procedureId: procedure.id,
        procedureName: `${procedure.name} (${label})`,
        price,
      },
    ]);
    toast.success("Procedimento adicionado");
  };

  const handleRemoveItem = (index: number) => {
    setBudgetItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Editar valor de um item do orçamento
  const handleEditItemPrice = (index: number, newPrice: number) => {
    setBudgetItems((prev) => prev.map((item, i) => 
      i === index ? { ...item, price: newPrice } : item
    ));
  };

  const totalValue = useMemo(() => {
    return budgetItems.reduce((sum, item) => sum + item.price, 0);
  }, [budgetItems]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getToothLabel = (tooth: number | string) => {
    if (typeof tooth === "string") {
      if (tooth === "upper_arch") return "Arcada Superior";
      if (tooth === "lower_arch") return "Arcada Inferior";
      if (tooth === "full") return "Arcada Completa";
    }
    return `Dente ${tooth}`;
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

  const getToothConditionColor = (toothNumber: number) => {
    const treatment = toothTreatments.find(t => t.toothNumber === toothNumber);
    if (!treatment) return null;
    return toothConditions.find(c => c.id === treatment.condition);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Área do Orçamentista</h1>
            <p className="text-muted-foreground">
              Avalie pacientes, defina tratamentos e valores
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Seleção de Consultório - Destacado */}
            <div className={`p-1 rounded-lg ${selectedOffice ? 'bg-green-100 border-2 border-green-500' : 'bg-orange-100 border-2 border-orange-500 animate-pulse'}`}>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger className={`w-48 ${selectedOffice ? 'border-green-500 bg-white' : 'border-orange-500 bg-white'}`}>
                  <SelectValue placeholder="🏥 Selecione consultório" />
                </SelectTrigger>
                <SelectContent>
                  {offices?.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Seleção de Dentista - Destacado */}
            <div className={`p-1 rounded-lg ${selectedDentist ? 'bg-green-100 border-2 border-green-500' : 'bg-orange-100 border-2 border-orange-500 animate-pulse'}`}>
              <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                <SelectTrigger className={`w-56 ${selectedDentist ? 'border-green-500 bg-white' : 'border-orange-500 bg-white'}`}>
                  <SelectValue placeholder="👨‍⚕️ Selecione dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists?.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id.toString()}>
                      {dentist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{waitingPatients.length}</p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inServicePatients.length}</p>
                  <p className="text-sm text-muted-foreground">Em Atendimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.budget || 0}</p>
                  <p className="text-sm text-muted-foreground">Avaliações Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fila de Espera */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Fila de Espera
                  </CardTitle>
                  <CardDescription>
                    Pacientes aguardando avaliação
                  </CardDescription>
                </div>
                {/* Botão de Cadastro Manual - Destacado */}
                <Dialog open={showManualPatientDialog} onOpenChange={setShowManualPatientDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 bg-green-50 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800"
                    >
                      <UserPlus className="h-4 w-4" />
                      Cadastro Manual
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        Cadastro Manual de Paciente
                      </DialogTitle>
                      <DialogDescription>
                        Cadastre um paciente diretamente sem passar pelo atendente
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="manualName">Nome do Paciente *</Label>
                        <Input
                          id="manualName"
                          placeholder="Digite o nome completo"
                          value={manualPatientName}
                          onChange={(e) => setManualPatientName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manualPhone">Telefone (opcional)</Label>
                        <Input
                          id="manualPhone"
                          placeholder="(00) 00000-0000"
                          value={manualPatientPhone}
                          onChange={(e) => setManualPatientPhone(e.target.value)}
                        />
                      </div>
                      {(!selectedOffice || !selectedDentist) && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                          ⚠️ Selecione um consultório e um dentista antes de cadastrar
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowManualPatientDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleManualPatientSubmit}
                        disabled={createPatient.isPending || !selectedOffice || !selectedDentist}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {createPatient.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Cadastrar e Atender
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingQueue ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : waitingPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum paciente na fila</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {waitingPatients.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="font-medium">{entry.patientName}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Chegou: {formatTime(entry.createdAt)}</span>
                          <span>Espera: {getWaitTime(entry.createdAt)}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2 gap-2"
                          onClick={() => handleCallPatient(entry)}
                          disabled={callPatient.isPending || !selectedOffice}
                        >
                          <Phone className="h-4 w-4" />
                          Chamar Paciente
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Área de Atendimento - Tratamento e Orçamento */}
          <div className="lg:col-span-2 space-y-4">
            {inServicePatients.length > 0 || currentPatient ? (
              <>
                {/* Info do Paciente Atual */}
                <Card className="border-primary">
                  <CardHeader className="bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          Paciente em Atendimento
                        </CardTitle>
                        <CardDescription>
                          {currentPatient?.patientName || inServicePatients[0]?.patientName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {inServicePatients[0]?.status === "called" && (
                          <Button onClick={() => handleStartService(inServicePatients[0])}>
                            <Play className="mr-2 h-4 w-4" />
                            Iniciar Atendimento
                          </Button>
                        )}
                        {/* Botão para cancelar/remover paciente do atendimento */}
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            const patientId = currentPatient?.id || inServicePatients[0]?.id;
                            if (patientId) {
                              cancelService.mutate({ id: patientId, reason: "Cancelado manualmente" });
                            } else {
                              // Se não tem ID da fila, apenas limpa o estado local
                              setCurrentPatient(null);
                              setBudgetItems([]);
                              setSelectedTeeth([]);
                              setToothTreatments([]);
                              setTreatmentNotes("");
                              setActiveTab("treatment");
                              toast.success("Atendimento cancelado!");
                            }
                          }}
                          disabled={cancelService.isPending}
                          title="Cancelar atendimento"
                        >
                          {cancelService.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Tabs: Tratamento e Orçamento */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="treatment" 
                      className={`gap-2 ${activeTab === 'treatment' ? 'bg-green-500 text-white data-[state=active]:bg-green-500 data-[state=active]:text-white' : ''}`}
                    >
                      <Stethoscope className="h-4 w-4" />
                      Tratamento
                    </TabsTrigger>
                    <TabsTrigger 
                      value="budget" 
                      className={`gap-2 ${activeTab === 'budget' ? 'bg-orange-500 text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white' : ''}`}
                    >
                      <Receipt className="h-4 w-4" />
                      Orçamento
                      {budgetItems.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{budgetItems.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Tratamento */}
                  <TabsContent value="treatment" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Odontograma</CardTitle>
                            <CardDescription>
                              Selecione uma condição e clique nas faces dos dentes
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                            <Button
                              variant={teethType === "permanent" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleTeethTypeChange("permanent")}
                              className="text-xs"
                            >
                              Perm.
                            </Button>
                            <Button
                              variant={teethType === "deciduous" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleTeethTypeChange("deciduous")}
                              className="text-xs"
                            >
                              Decíduo
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Seleção de Condição */}
                        <div>
                          <Label className="mb-2 block">Selecione uma condição e clique nas faces dos dentes</Label>
                          <div className="flex flex-wrap gap-2">
                            {toothConditions.map((condition) => (
                              <button
                                key={condition.id}
                                onClick={() => setSelectedCondition(condition.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                  selectedCondition === condition.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <div className={`w-3 h-3 rounded-full ${condition.color}`} />
                                <span className="text-sm font-medium">{condition.name}</span>
                                {selectedCondition === condition.id && toothTreatments.filter(t => t.condition === condition.id).length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {toothTreatments.filter(t => t.condition === condition.id).length}
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Seleção de Faces */}
                        <div>
                          <Label className="mb-2 block">Faces do Dente</Label>
                          <div className="flex gap-2">
                            {toothFaces.map((face) => (
                              <button
                                key={face.id}
                                onClick={() => handleFaceToggle(face.id)}
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 transition-all ${
                                  selectedFaces.includes(face.id)
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <span className="text-lg font-bold">{face.short}</span>
                                <span className="text-[10px]">{face.name.slice(0, 4)}.</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            V=Vest. L=Ling. M=Mes. D=Dist. O=Ocl.
                          </p>
                        </div>

                        {/* Arcada Superior */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Arcada Superior</span>
                          </div>
                          <div className="flex justify-center gap-1 flex-wrap">
                            {currentTeeth.upper.map((tooth) => {
                              const conditionColor = getToothConditionColor(tooth);
                              return (
                                <button
                                  key={tooth}
                                  onClick={() => handleToothClickTreatment(tooth)}
                                  className={`w-10 h-14 rounded-lg border-2 text-xs font-medium transition-all flex flex-col items-center justify-center ${
                                    conditionColor
                                      ? `${conditionColor.color} text-white border-transparent`
                                      : "bg-background border-border hover:border-primary"
                                  }`}
                                >
                                  <span className="text-[10px]">{tooth}</span>
                                  <div className="w-6 h-6 border rounded mt-0.5 bg-white/20" />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Arcada Inferior */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Arcada Inferior</span>
                          </div>
                          <div className="flex justify-center gap-1 flex-wrap">
                            {currentTeeth.lower.map((tooth) => {
                              const conditionColor = getToothConditionColor(tooth);
                              return (
                                <button
                                  key={tooth}
                                  onClick={() => handleToothClickTreatment(tooth)}
                                  className={`w-10 h-14 rounded-lg border-2 text-xs font-medium transition-all flex flex-col items-center justify-center ${
                                    conditionColor
                                      ? `${conditionColor.color} text-white border-transparent`
                                      : "bg-background border-border hover:border-primary"
                                  }`}
                                >
                                  <div className="w-6 h-6 border rounded mb-0.5 bg-white/20" />
                                  <span className="text-[10px]">{tooth}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Resumo do Tratamento */}
                    <Card className="bg-blue-50/50">
                      <CardHeader>
                        <CardTitle>Resumo do Tratamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {toothTreatments.length > 0 ? (
                          <>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {toothTreatments.map((treatment) => {
                                const condition = toothConditions.find(c => c.id === treatment.condition);
                                return (
                                  <div
                                    key={treatment.toothNumber}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full ${condition?.color}`} />
                                      <div>
                                        <p className="font-medium">Dente {treatment.toothNumber}:</p>
                                        <div className="flex items-center gap-1">
                                          {treatment.faces.map(face => (
                                            <Badge key={face} variant="outline" className="text-xs">
                                              {face}: {treatment.conditionName}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleRemoveTreatment(treatment.toothNumber)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>

                            <div>
                              <Label>Observações do Tratamento</Label>
                              <Textarea
                                value={treatmentNotes}
                                onChange={(e) => setTreatmentNotes(e.target.value)}
                                placeholder="Observações clínicas, recomendações, etc."
                                rows={3}
                              />
                            </div>

                            <Button
                              className="w-full gap-2"
                              size="lg"
                              onClick={handleGoTobudget}
                            >
                              <ArrowRight className="h-4 w-4" />
                              Ir para Orçamento
                            </Button>
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum tratamento adicionado</p>
                            <p className="text-xs mt-1">Selecione uma condição, as faces e clique nos dentes</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab: Orçamento */}
                  <TabsContent value="budget" className="space-y-4">
                    {/* Odontograma para Orçamento */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Odontograma - Selecione os Dentes</CardTitle>
                            <CardDescription>
                              Clique nos dentes para adicionar procedimentos
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                            <Button
                              variant={teethType === "permanent" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleTeethTypeChange("permanent")}
                              className="text-xs"
                            >
                              Perm.
                            </Button>
                            <Button
                              variant={teethType === "deciduous" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => handleTeethTypeChange("deciduous")}
                              className="text-xs"
                            >
                              Decíduo
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {teethType === "permanent" ? "Dentição Permanente (Adulto)" : "Dentição Decídua (Criança)"}
                          </Badge>
                        </div>

                        {/* Arcada Superior */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Arcada Superior</span>
                            <Button variant="outline" size="sm" onClick={handleSelectAllUpper}>
                              Selecionar Todos
                            </Button>
                          </div>
                          <div className="flex justify-center gap-1 flex-wrap">
                            {currentTeeth.upper.map((tooth) => {
                              const hasTreatment = toothTreatments.some(t => t.toothNumber === tooth);
                              const conditionColor = getToothConditionColor(tooth);
                              return (
                                <button
                                  key={tooth}
                                  onClick={() => handleToothClick(tooth)}
                                  className={`w-10 h-12 rounded-lg border-2 text-xs font-medium transition-all flex flex-col items-center justify-center ${
                                    selectedTeeth.includes(tooth)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : budgetItems.some((i) => i.toothNumber === tooth)
                                      ? "bg-green-100 border-green-500 text-green-700"
                                      : hasTreatment && conditionColor
                                      ? `${conditionColor.color} text-white border-transparent`
                                      : "bg-background border-border hover:border-primary"
                                  }`}
                                >
                                  <span className="text-[10px]">{tooth}</span>
                                  <div className={`${teethType === "deciduous" ? "w-5 h-5" : "w-6 h-6"} border rounded mt-0.5`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Arcada Inferior */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Arcada Inferior</span>
                            <Button variant="outline" size="sm" onClick={handleSelectAllLower}>
                              Selecionar Todos
                            </Button>
                          </div>
                          <div className="flex justify-center gap-1 flex-wrap">
                            {currentTeeth.lower.map((tooth) => {
                              const hasTreatment = toothTreatments.some(t => t.toothNumber === tooth);
                              const conditionColor = getToothConditionColor(tooth);
                              return (
                                <button
                                  key={tooth}
                                  onClick={() => handleToothClick(tooth)}
                                  className={`w-10 h-12 rounded-lg border-2 text-xs font-medium transition-all flex flex-col items-center justify-center ${
                                    selectedTeeth.includes(tooth)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : budgetItems.some((i) => i.toothNumber === tooth)
                                      ? "bg-green-100 border-green-500 text-green-700"
                                      : hasTreatment && conditionColor
                                      ? `${conditionColor.color} text-white border-transparent`
                                      : "bg-background border-border hover:border-primary"
                                  }`}
                                >
                                  <div className={`${teethType === "deciduous" ? "w-5 h-5" : "w-6 h-6"} border rounded mb-0.5`} />
                                  <span className="text-[10px]">{tooth}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedTeeth.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">{selectedTeeth.length} dente(s) selecionado(s)</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTeeth([])}>
                              Limpar seleção
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Adicionar Procedimento */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Adicionar Tratamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Procedimento</Label>
                          {loadingProcedures ? (
                            <Skeleton className="h-10 w-full" />
                          ) : (
                            <Select
                              value={selectedProcedure?.toString() || ""}
                              onValueChange={(v) => setSelectedProcedure(parseInt(v))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o procedimento" />
                              </SelectTrigger>
                              <SelectContent>
                                {procedures?.map((proc) => (
                                  <SelectItem key={proc.id} value={proc.id.toString()}>
                                    {proc.name} - {formatCurrency(parseFloat(proc.pricePerTooth || "0"))}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button onClick={handleAddProcedure} disabled={selectedTeeth.length === 0} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Adicionar aos Dentes
                          </Button>
                          <Button variant="outline" onClick={() => handleAddArchProcedure("upper_arch")}>
                            Arcada Superior
                          </Button>
                          <Button variant="outline" onClick={() => handleAddArchProcedure("lower_arch")}>
                            Arcada Inferior
                          </Button>
                          <Button variant="outline" onClick={() => handleAddArchProcedure("full")}>
                            Arcada Completa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Resumo do Orçamento */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Resumo do Orçamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {budgetItems.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {budgetItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.procedureName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {getToothLabel(item.toothNumber)}
                                    {item.condition && ` - ${toothConditions.find(c => c.id === item.condition)?.name}`}
                                    {item.faces && item.faces.length > 0 && ` (${item.faces.join(", ")})`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">R$</span>
                                    <input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => handleEditItemPrice(index, parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-right font-medium text-primary bg-background border rounded text-sm"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum procedimento adicionado</p>
                          </div>
                        )}

                        <div>
                          <Label>Observações do Tratamento</Label>
                          <Textarea
                            value={treatmentNotes}
                            onChange={(e) => setTreatmentNotes(e.target.value)}
                            placeholder="Observações clínicas, recomendações, etc."
                            rows={3}
                          />
                        </div>

                        {budgetItems.length > 0 && (
                          <>
                            <div className="border-t pt-4">
                              <div className="flex items-center justify-between text-xl font-bold">
                                <span>Total do Orçamento</span>
                                <span className="text-primary">{formatCurrency(totalValue)}</span>
                              </div>
                            </div>

                            <Button
                              className="w-full gap-2"
                              size="lg"
                              onClick={handleFinishAndSendToAttendant}
                              disabled={requestPayment.isPending}
                            >
                              {requestPayment.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4" />
                              )}
                              Finalizar e Enviar para Atendente
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                              O paciente será encaminhado ao Atendente com as informações do tratamento e valor
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card className="lg:col-span-2">
                <CardContent className="py-16">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Nenhum paciente em atendimento</h3>
                    <p className="text-sm">
                      Selecione um consultório e chame um paciente da fila para iniciar a avaliação
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

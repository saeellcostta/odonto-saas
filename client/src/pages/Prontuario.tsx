import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  ClipboardList,
  Heart,
  Image,
  File,
  Receipt,
  History,
  Camera,
  Brain,
  Plus,
  Upload,
  Smile,
  Loader2,
  Printer,
  Download,
  Eye,
  Trash2,
  PenTool,
  Link,
  Check,
  Copy,
  Send,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Odontograma component
const Odontograma = ({ treatments }: { treatments: any[] }) => {
  const teethUpper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const teethLower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const getToothStatus = (toothNumber: number) => {
    const treatment = treatments?.find(t => parseInt(t.toothNumber) === toothNumber);
    if (!treatment) return "none";
    if (treatment.condition === "restoration" || treatment.condition === "crown") return "completed";
    if (treatment.condition === "canal" || treatment.condition === "bridge") return "in_progress";
    return "planned";
  };

  const getToothColor = (status: string) => {
    switch (status) {
      case "planned": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1">
        {teethUpper.map((tooth) => (
          <div
            key={tooth}
            className={`w-8 h-10 rounded-t-lg border-2 border-gray-300 flex items-center justify-center text-xs font-medium ${getToothColor(getToothStatus(tooth))}`}
          >
            {tooth}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1">
        {teethLower.map((tooth) => (
          <div
            key={tooth}
            className={`w-8 h-10 rounded-b-lg border-2 border-gray-300 flex items-center justify-center text-xs font-medium ${getToothColor(getToothStatus(tooth))}`}
          >
            {tooth}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>Planejado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" />
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Concluído</span>
        </div>
      </div>
    </div>
  );
};

// Checkbox field component
const CheckboxField = ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
    <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
      {label}
    </Label>
  </div>
);

// Anamnese item component
const AnamneseItem = ({ label, value }: { label: string; value: boolean | null }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm">{label}</span>
    <Badge variant={value ? "default" : "secondary"} className="text-xs">
      {value ? "Sim" : "Não"}
    </Badge>
  </div>
);

export default function Prontuario() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const patientId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState("sobre");
  const [isAnamneseDialogOpen, setIsAnamneseDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  
  // Estados para os modais de documentos específicos
  const [isAtestadoDialogOpen, setIsAtestadoDialogOpen] = useState(false);
  const [isReceituarioDialogOpen, setIsReceituarioDialogOpen] = useState(false);
  const [isTermoDialogOpen, setIsTermoDialogOpen] = useState(false);
  const [isContratoDialogOpen, setIsContratoDialogOpen] = useState(false);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Estados para assinatura digital e link de validação
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<"patient" | "professional">("patient");
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedDocumentForSign, setSelectedDocumentForSign] = useState<any>(null);
  const [isValidationLinkDialogOpen, setIsValidationLinkDialogOpen] = useState(false);
  const [validationExpirationDays, setValidationExpirationDays] = useState<number | null>(null);
  const [generatedValidationLink, setGeneratedValidationLink] = useState<string | null>(null);
  
  // Estados dos formulários de documentos
  const [selectedDentistId, setSelectedDentistId] = useState<number | null>(null);
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const [atestadoForm, setAtestadoForm] = useState({
    tipo: "dias" as "dias" | "presenca",
    dias: "1",
    motivo: "",
    cid: "",
    includeCid: false,
    observacoes: "",
  });
  
  const [receituarioForm, setReceituarioForm] = useState({
    medicamentos: "",
    posologia: "",
    observacoes: "",
  });
  
  const [termoForm, setTermoForm] = useState({
    procedimento: "",
    riscos: "",
    beneficios: "",
    alternativas: "",
  });
  
  const [contratoForm, setContratoForm] = useState({
    servicos: "",
    valor: "",
    formaPagamento: "",
    prazo: "",
  });

  const utils = trpc.useUtils();
  const { data: patient, isLoading: loadingPatient } = trpc.patients.getById.useQuery({ id: patientId });
  const { data: anamnesis, isLoading: loadingAnamnesis } = trpc.anamnesis.get.useQuery({ patientId });
  const { data: budgets } = trpc.budgets.list.useQuery({ patientId });
  const { data: dentists } = trpc.dentists.list.useQuery();
  const { data: medicalDocs, refetch: refetchMedicalDocs } = trpc.medicalDocuments.list.useQuery({ patientId });
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: treatments } = trpc.treatments.list.useQuery({ patientId });
  const { data: documents } = trpc.documents.list.useQuery({ patientId });

  const [anamneseForm, setAnamneseForm] = useState({
    heartDisease: false,
    hypertension: false,
    diabetes: false,
    pregnancy: false,
    allergies: false,
    allergiesDescription: "",
    medications: false,
    medicationsDescription: "",
    surgeries: false,
    surgeriesDescription: "",
    smoker: false,
    alcohol: false,
    notes: "",
  });

  const saveAnamnesisMutation = trpc.anamnesis.save.useMutation({
    onSuccess: () => {
      toast.success("Anamnese salva com sucesso!");
      utils.anamnesis.get.invalidate({ patientId });
      setIsAnamneseDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar anamnese: " + error.message);
    },
  });

  const createDocumentMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success("Documento criado com sucesso!");
      utils.documents.list.invalidate({ patientId });
      setIsSavingDocument(false);
    },
    onError: (error) => {
      toast.error("Erro ao criar documento: " + error.message);
      setIsSavingDocument(false);
    },
  });

  // Mutações para documentos médicos (nova tabela)
  const createAtestadoMutation = trpc.medicalDocuments.createAtestado.useMutation({
    onSuccess: () => {
      toast.success("Atestado emitido com sucesso!");
      refetchMedicalDocs();
      setIsSavingDocument(false);
      setIsAtestadoDialogOpen(false);
      setAtestadoForm({ tipo: "dias", dias: "1", motivo: "", cid: "", includeCid: false, observacoes: "" });
      setSelectedDentistId(null);
    },
    onError: (error) => {
      toast.error("Erro ao emitir atestado: " + error.message);
      setIsSavingDocument(false);
    },
  });

  const createReceituarioMutation = trpc.medicalDocuments.createReceituario.useMutation({
    onSuccess: () => {
      toast.success("Receituário emitido com sucesso!");
      refetchMedicalDocs();
      setIsSavingDocument(false);
      setIsReceituarioDialogOpen(false);
      setReceituarioForm({ medicamentos: "", posologia: "", observacoes: "" });
      setSelectedDentistId(null);
    },
    onError: (error) => {
      toast.error("Erro ao emitir receituário: " + error.message);
      setIsSavingDocument(false);
    },
  });

  const createTermoMutation = trpc.medicalDocuments.createTermoConsentimento.useMutation({
    onSuccess: () => {
      toast.success("Termo de consentimento gerado com sucesso!");
      refetchMedicalDocs();
      setIsSavingDocument(false);
      setIsTermoDialogOpen(false);
      setTermoForm({ procedimento: "", riscos: "", beneficios: "", alternativas: "" });
      setSelectedDentistId(null);
    },
    onError: (error) => {
      toast.error("Erro ao gerar termo: " + error.message);
      setIsSavingDocument(false);
    },
  });

  const createContratoMutation = trpc.medicalDocuments.createContrato.useMutation({
    onSuccess: () => {
      toast.success("Contrato gerado com sucesso!");
      refetchMedicalDocs();
      setIsSavingDocument(false);
      setIsContratoDialogOpen(false);
      setContratoForm({ servicos: "", valor: "", formaPagamento: "", prazo: "" });
      setSelectedDentistId(null);
    },
    onError: (error) => {
      toast.error("Erro ao gerar contrato: " + error.message);
      setIsSavingDocument(false);
    },
  });

  const deleteMedicalDocMutation = trpc.medicalDocuments.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento excluído com sucesso!");
      refetchMedicalDocs();
    },
    onError: (error) => {
      toast.error("Erro ao excluir documento: " + error.message);
    },
  });

  // Mutação para assinar documento
  const signDocumentMutation = trpc.medicalDocuments.signDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento assinado com sucesso!");
      refetchMedicalDocs();
      setIsSignatureDialogOpen(false);
      setSelectedDocumentId(null);
      setSelectedDocumentForSign(null);
    },
    onError: (error) => {
      toast.error("Erro ao assinar documento: " + error.message);
    },
  });

  // Mutação para gerar link de validação
  const generateValidationLinkMutation = trpc.medicalDocuments.generateValidationLink.useMutation({
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/validar-documento/${data.token}`;
      setGeneratedValidationLink(link);
      toast.success("Link de validação gerado com sucesso!");
      refetchMedicalDocs();
    },
    onError: (error) => {
      toast.error("Erro ao gerar link: " + error.message);
    },
  });

  const updatePatientMutation = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Foto atualizada com sucesso!");
      utils.patients.getById.invalidate({ id: patientId });
      setIsUploadingPhoto(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar foto: " + error.message);
      setIsUploadingPhoto(false);
    },
  });

  // Função para gerar PDF do documento
  const handlePrintDocument = async (doc: any) => {
    toast.info("Gerando documento para impressão...");
    
    const typeLabels: Record<string, string> = {
      atestado: "ATESTADO",
      receituario: "RECEITUÁRIO",
      termo_consentimento: "TERMO DE CONSENTIMENTO",
      contrato: "CONTRATO DE SERVIÇOS",
    };
    
    // Criar conteúdo HTML do documento
    const documentContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${typeLabels[doc.type] || doc.type}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #333; }
          .document-type { font-size: 18px; margin-top: 10px; color: #666; }
          .content { margin: 30px 0; min-height: 300px; }
          .content p { margin-bottom: 15px; text-align: justify; }
          .patient-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .patient-info strong { color: #333; }
          .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
          .signature-box { text-align: center; width: 45%; }
          .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 60px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${doc.clinicName || "Clínica Odontológica"}</div>
          <div class="document-type">${typeLabels[doc.type] || doc.type}</div>
        </div>
        
        <div class="patient-info">
          <p><strong>Paciente:</strong> ${patient?.name || "Não informado"}</p>
          <p><strong>CPF:</strong> ${patient?.cpf || "Não informado"}</p>
          <p><strong>Data:</strong> ${doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div class="content">
          ${doc.type === "atestado" ? `
            <p>Atesto para os devidos fins que o(a) paciente acima identificado(a) esteve sob meus cuidados profissionais${doc.attestationType === "dias" ? `, necessitando de ${doc.attestationDays} dia(s) de afastamento de suas atividades` : " nesta data"}.</p>
            ${doc.cidCode ? `<p><strong>CID:</strong> ${doc.cidCode}</p>` : ""}
          ` : ""}
          ${doc.type === "receituario" ? `
            <p><strong>Prescrição:</strong></p>
            <p style="white-space: pre-wrap;">${doc.prescription || ""}</p>
          ` : ""}
          ${doc.type === "termo_consentimento" ? `
            <p>Eu, ${patient?.name || "paciente"}, declaro que fui devidamente informado(a) sobre o procedimento de <strong>${doc.consentProcedure || "tratamento odontológico"}</strong>, seus riscos, benefícios e alternativas.</p>
            <p>Autorizo a realização do procedimento proposto.</p>
          ` : ""}
          ${doc.type === "contrato" ? `
            <p><strong>Procedimentos:</strong> ${doc.contractProcedures || ""}</p>
            <p><strong>Valor Total:</strong> R$ ${doc.contractValue || "0,00"}</p>
            <p><strong>Forma de Pagamento:</strong> ${doc.paymentMethod?.replace("_", " ") || "A definir"}</p>
          ` : ""}
        </div>
        
        <div class="signatures">
          ${doc.type === "atestado" || doc.type === "receituario" ? `
            <!-- Apenas assinatura do profissional centralizada -->
            <div style="text-align: center; margin: 80px auto 0; width: 100%;">
              ${doc.professionalSignature ? `
                <img src="${doc.professionalSignature}" alt="Assinatura" style="max-width: 300px; height: auto; margin-bottom: 10px;" />
              ` : ''}
              <div class="signature-line" style="margin: 0 auto; max-width: 300px;">
                ${doc.dentistName || "Profissional"}<br>
                <small>CRO: ${doc.dentistCro || ""}</small>
              </div>
            </div>
          ` : `
            <!-- Assinaturas de paciente e profissional -->
            <div class="signature-box">
              ${doc.professionalSignature ? `
                <img src="${doc.professionalSignature}" alt="Assinatura Profissional" style="max-width: 200px; height: auto; margin-bottom: 10px;" />
              ` : ''}
              <div class="signature-line">
                ${doc.dentistName || "Profissional"}<br>
                <small>CRO: ${doc.dentistCro || ""}</small>
              </div>
            </div>
            <div class="signature-box">
              ${doc.patientSignature ? `
                <img src="${doc.patientSignature}" alt="Assinatura Paciente" style="max-width: 200px; height: auto; margin-bottom: 10px;" />
              ` : ''}
              <div class="signature-line">
                ${patient?.name || "Paciente"}<br>
                <small>CPF: ${patient?.cpf || ""}</small>
              </div>
            </div>
          `}
        </div>
        
        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;
    
    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(documentContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      toast.success("Documento pronto para impressão!");
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique se popups estão bloqueados.");
    }
  };

  // Função para compartilhar via WhatsApp
  const handleShareWhatsApp = (doc: any) => {
    const typeLabels: Record<string, string> = {
      atestado: "Atestado",
      receituario: "Receituário",
      termo_consentimento: "Termo de Consentimento",
      contrato: "Contrato",
    };
    
    let message = `*${typeLabels[doc.type] || doc.type}*\n\n`;
    message += `Clínica: ${doc.clinicName || "Dentrics"}\n`;
    message += `Paciente: ${patient?.name || "Não informado"}\n`;
    message += `Data: ${doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}\n`;
    message += `Profissional: ${doc.dentistName || "Não informado"}\n\n`;
    
    if (doc.type === "atestado") {
      message += doc.attestationType === "dias" 
        ? `Afastamento: ${doc.attestationDays} dia(s)\n`
        : "Atestado de presença\n";
      if (doc.cidCode) message += `CID: ${doc.cidCode}\n`;
    }
    if (doc.type === "receituario" && doc.prescription) {
      message += `Prescrição:\n${doc.prescription}\n`;
    }
    if (doc.type === "contrato") {
      message += `Valor: R$ ${doc.contractValue || "0,00"}\n`;
      message += `Pagamento: ${doc.paymentMethod?.replace("_", " ") || "A definir"}\n`;
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Abrindo WhatsApp para compartilhar...");
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploadingPhoto(true);

    // Converter para base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updatePatientMutation.mutate({
        id: patientId,
        data: { photoUrl: base64 },
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAtestado = () => {
    if (!selectedDentistId) {
      toast.error("Selecione o profissional");
      return;
    }
    if (atestadoForm.tipo === "dias" && !atestadoForm.dias) {
      toast.error("Informe a quantidade de dias");
      return;
    }
    setIsSavingDocument(true);
    createAtestadoMutation.mutate({
      patientId,
      dentistId: selectedDentistId,
      attestationType: atestadoForm.tipo,
      attestationDays: atestadoForm.tipo === "dias" ? parseInt(atestadoForm.dias) : undefined,
      includeCid: atestadoForm.includeCid,
      cidCode: atestadoForm.includeCid ? atestadoForm.cid : undefined,
      documentDate: new Date().toISOString(),
    });
  };

  const handleSaveReceituario = () => {
    if (!selectedDentistId) {
      toast.error("Selecione o profissional");
      return;
    }
    if (!receituarioForm.medicamentos) {
      toast.error("Preencha a prescrição");
      return;
    }
    setIsSavingDocument(true);
    const prescription = `${receituarioForm.medicamentos}${receituarioForm.posologia ? `\n\nPosologia:\n${receituarioForm.posologia}` : ""}${receituarioForm.observacoes ? `\n\nObs: ${receituarioForm.observacoes}` : ""}`;
    createReceituarioMutation.mutate({
      patientId,
      dentistId: selectedDentistId,
      prescription,
      documentDate: new Date().toISOString(),
    });
  };

  const handleSaveTermo = () => {
    if (!selectedDentistId) {
      toast.error("Selecione o profissional");
      return;
    }
    if (!termoForm.procedimento) {
      toast.error("Preencha o procedimento");
      return;
    }
    setIsSavingDocument(true);
    createTermoMutation.mutate({
      patientId,
      dentistId: selectedDentistId,
      consentProcedure: termoForm.procedimento,
      customProcedure: termoForm.riscos ? `Riscos: ${termoForm.riscos}\nBenefícios: ${termoForm.beneficios}\nAlternativas: ${termoForm.alternativas}` : undefined,
      documentDate: new Date().toISOString(),
    });
  };

  const handleSaveContrato = () => {
    if (!selectedDentistId) {
      toast.error("Selecione o profissional");
      return;
    }
    if (!contratoForm.servicos || !contratoForm.valor) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setIsSavingDocument(true);
    const valorNumerico = parseFloat(contratoForm.valor.replace(/[^\d,]/g, "").replace(",", "."));
    createContratoMutation.mutate({
      patientId,
      dentistId: selectedDentistId,
      contractProcedures: contratoForm.servicos,
      contractValue: valorNumerico || 0,
      paymentMethod: contratoForm.formaPagamento || "a_vista",
      contractObservations: contratoForm.prazo ? `Prazo: ${contratoForm.prazo}` : undefined,
      documentDate: new Date().toISOString(),
    });
  };

  const handleOpenAnamnese = () => {
    if (anamnesis) {
      setAnamneseForm({
        heartDisease: anamnesis.heartDisease || false,
        hypertension: anamnesis.hypertension || false,
        diabetes: anamnesis.diabetes || false,
        pregnancy: anamnesis.pregnancy || false,
        allergies: anamnesis.allergies || false,
        allergiesDescription: anamnesis.allergiesDescription || "",
        medications: anamnesis.medications || false,
        medicationsDescription: anamnesis.medicationsDescription || "",
        surgeries: anamnesis.surgeries || false,
        surgeriesDescription: anamnesis.surgeriesDescription || "",
        smoker: anamnesis.smoker || false,
        alcohol: anamnesis.alcohol || false,
        notes: anamnesis.notes || "",
      });
    }
    setIsAnamneseDialogOpen(true);
  };

  const handleSaveAnamnese = (e: React.FormEvent) => {
    e.preventDefault();
    saveAnamnesisMutation.mutate({
      patientId,
      ...anamneseForm,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const patientAppointments = appointments?.filter((a) => a.patientId === patientId) || [];
  
  // Calculate budget stats
  const budgetStats = {
    total: budgets?.length || 0,
    approved: budgets?.filter(b => b.status === "approved").length || 0,
    pending: budgets?.filter(b => b.status === "pending").length || 0,
    totalValue: budgets?.filter(b => b.status === "approved").reduce((acc, b) => acc + parseFloat(b.finalValue), 0) || 0,
  };

  // Calculate treatment stats
  const treatmentStats = {
    total: treatments?.length || 0,
    completed: treatments?.filter(t => t.condition === "restoration" || t.condition === "crown").length || 0,
    inProgress: treatments?.filter(t => t.condition === "canal" || t.condition === "bridge").length || 0,
    planned: treatments?.filter(t => t.condition === "cavity" || t.condition === "fracture").length || 0,
  };

  if (loadingPatient) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Paciente não encontrado</h3>
          <Button onClick={() => setLocation("/pacientes")} className="mt-4">
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/pacientes")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Prontuário</h1>
              <p className="text-muted-foreground">Prontuário do paciente</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">ID: {patient.id}</span>
        </div>

        {/* Patient Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 bg-primary">
                  {(patient as any).photoUrl ? (
                    <AvatarImage src={(patient as any).photoUrl} alt={patient.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-white text-2xl font-medium">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                  {isUploadingPhoto ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </label>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{patient.name}</h2>
                <p className="text-muted-foreground">Prontuário do Paciente</p>
                <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {patient.phone || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {patient.email || "-"}
                  </div>
                  {patient.birthDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(patient.birthDate), "dd/MM/yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - Layout responsivo igual ao Dentrics */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-muted/50 rounded-lg p-1">
            {/* Primeira linha de abas */}
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-max bg-transparent h-auto p-0 gap-1">
                <TabsTrigger value="sobre" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Sobre</span>
                </TabsTrigger>
                <TabsTrigger value="orcamentos" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Orçamentos</span>
                </TabsTrigger>
                <TabsTrigger value="tratamentos" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Tratamentos</span>
                </TabsTrigger>
                <TabsTrigger value="anamnese" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Anamnese</span>
                </TabsTrigger>
                <TabsTrigger value="imagens" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Imagens</span>
                </TabsTrigger>
                <TabsTrigger value="documentos" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <File className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Documentos</span>
                </TabsTrigger>
                <TabsTrigger value="recibos" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Recibos</span>
                </TabsTrigger>
                <TabsTrigger value="historico" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Histórico</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
            {/* Segunda linha de abas */}
            <ScrollArea className="w-full mt-1">
              <TabsList className="inline-flex w-max bg-transparent h-auto p-0 gap-1">
                <TabsTrigger value="galeria" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Galeria</span>
                </TabsTrigger>
                <TabsTrigger value="hist-fotos" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Hist. Fotos</span>
                </TabsTrigger>
                <TabsTrigger value="diagn-ia" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
                  <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Diagn. IA</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          {/* Sobre Tab */}
          <TabsContent value="sobre" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Completo</p>
                      <p className="font-medium">{patient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{patient.cpf || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RG</p>
                      <p className="font-medium">{patient.rg || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">
                        {patient.birthDate
                          ? format(new Date(patient.birthDate), "dd/MM/yyyy")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gênero</p>
                      <p className="font-medium">{patient.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profissão</p>
                      <p className="font-medium">{patient.profession || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{patient.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{patient.whatsapp || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="font-medium">{patient.email || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{patient.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cidade</p>
                      <p className="font-medium">{patient.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-medium">{patient.state || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CEP</p>
                      <p className="font-medium">{patient.zipCode || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{patient.emergencyContact || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{patient.emergencyPhone || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orçamentos Tab */}
          <TabsContent value="orcamentos" className="space-y-4 mt-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total de Orçamentos</p>
                  <p className="text-2xl font-bold">{budgetStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">{budgetStats.approved}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{budgetStats.pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Valor Total Aprovado</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(budgetStats.totalValue)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Histórico de Orçamentos
                </CardTitle>
                <CardDescription>Orçamentos realizados pelo orçamentista para este paciente</CardDescription>
              </CardHeader>
              <CardContent>
                {budgets && budgets.length > 0 ? (
                  <div className="space-y-3">
                    {budgets.map((budget) => (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">Orçamento #{budget.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(budget.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(budget.finalValue))}
                          </p>
                          <Badge
                            variant={
                              budget.status === "approved" ? "default" :
                              budget.status === "pending" ? "secondary" :
                              budget.status === "rejected" ? "destructive" : "outline"
                            }
                          >
                            {budget.status === "approved" ? "Aprovado" :
                             budget.status === "pending" ? "Pendente" :
                             budget.status === "rejected" ? "Rejeitado" :
                             budget.status === "in_progress" ? "Em Andamento" : "Concluído"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum orçamento encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os orçamentos criados pelo orçamentista aparecerão aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tratamentos Tab */}
          <TabsContent value="tratamentos" className="space-y-4 mt-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total de Procedimentos</p>
                  <p className="text-2xl font-bold">{treatmentStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{treatmentStats.completed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-yellow-600">{treatmentStats.inProgress}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Planejados</p>
                  <p className="text-2xl font-bold text-blue-600">{treatmentStats.planned}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  Odontograma - Tratamentos
                </CardTitle>
                <CardDescription>Histórico de procedimentos do orçamentista e tratamentos realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <Odontograma treatments={treatments || []} />
                
                {treatments && treatments.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {treatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Dente {treatment.toothNumber} - {treatment.condition || "Tratamento"}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(treatment.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            (treatment.condition === "restoration" || treatment.condition === "crown") ? "default" :
                            (treatment.condition === "canal" || treatment.condition === "bridge") ? "secondary" : "outline"
                          }
                        >
                          {(treatment.condition === "restoration" || treatment.condition === "crown") ? "Concluído" :
                           (treatment.condition === "canal" || treatment.condition === "bridge") ? "Em Andamento" : "Planejado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center mt-6">
                    <Smile className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum tratamento registrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os procedimentos adicionados pelo orçamentista aparecerão aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Evoluções e Anotações do Dentista
                </CardTitle>
                <CardDescription>Histórico de atendimentos e observações clínicas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma evolução registrada</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    As evoluções do dentista aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anamnese Tab */}
          <TabsContent value="anamnese" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Anamnese
                  </CardTitle>
                  <CardDescription>Histórico de saúde e informações médicas do paciente</CardDescription>
                </div>
                <Button onClick={handleOpenAnamnese}>
                  {anamnesis ? "Editar" : "Preencher"}
                </Button>
              </CardHeader>
              <CardContent>
                {loadingAnamnesis ? (
                  <Skeleton className="h-48 w-full" />
                ) : anamnesis ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">Condições de Saúde</h4>
                      <div className="space-y-2">
                        <AnamneseItem label="Doença Cardíaca" value={anamnesis.heartDisease} />
                        <AnamneseItem label="Hipertensão" value={anamnesis.hypertension} />
                        <AnamneseItem label="Diabetes" value={anamnesis.diabetes} />
                        <AnamneseItem label="Gravidez" value={anamnesis.pregnancy} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Hábitos</h4>
                      <div className="space-y-2">
                        <AnamneseItem label="Fumante" value={anamnesis.smoker} />
                        <AnamneseItem label="Consome Álcool" value={anamnesis.alcohol} />
                      </div>
                    </div>
                    {anamnesis.allergies && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium">Alergias</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {anamnesis.allergiesDescription || "Sim, não especificado"}
                        </p>
                      </div>
                    )}
                    {anamnesis.medications && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium">Medicamentos em Uso</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {anamnesis.medicationsDescription || "Sim, não especificado"}
                        </p>
                      </div>
                    )}
                    {anamnesis.surgeries && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium">Cirurgias Anteriores</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {anamnesis.surgeriesDescription || "Sim, não especificado"}
                        </p>
                      </div>
                    )}
                    {anamnesis.notes && (
                      <div className="md:col-span-2">
                        <h4 className="font-medium">Observações</h4>
                        <p className="text-sm text-muted-foreground mt-1">{anamnesis.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Heart className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Anamnese não preenchida</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em "Preencher" para adicionar as informações de saúde do paciente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Imagens Tab */}
          <TabsContent value="imagens" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Imagens
                  </CardTitle>
                  <CardDescription>Radiografias e fotos do paciente</CardDescription>
                </div>
                <Button onClick={() => setIsImageDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Imagem
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Image className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma imagem</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione radiografias e fotos do paciente
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos Tab */}
          <TabsContent value="documentos" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    Documentos
                  </CardTitle>
                  <CardDescription>Atestados, receituários, termos e contratos</CardDescription>
                </div>
                <Button onClick={() => setIsDocumentDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Documento
                </Button>
              </CardHeader>
              <CardContent>
                {medicalDocs && medicalDocs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-sm">Tipo</th>
                          <th className="text-left py-3 px-2 font-medium text-sm">Título</th>
                          <th className="text-left py-3 px-2 font-medium text-sm">Data</th>
                          <th className="text-center py-3 px-2 font-medium text-sm">Assinatura Paciente</th>
                          <th className="text-center py-3 px-2 font-medium text-sm">Assinatura Profissional</th>
                          <th className="text-right py-3 px-2 font-medium text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicalDocs.map((doc: any) => {
                          const typeLabels: Record<string, string> = {
                            atestado: "Atestado",
                            receituario: "Receituário",
                            termo_consentimento: "Termo de Consentimento",
                            contrato: "Contrato",
                          };
                          const typeColors: Record<string, string> = {
                            atestado: "bg-blue-100 text-blue-700",
                            receituario: "bg-green-100 text-green-700",
                            termo_consentimento: "bg-yellow-100 text-yellow-700",
                            contrato: "bg-purple-100 text-purple-700",
                          };
                          
                          // Gerar título baseado no tipo
                          let docTitle = typeLabels[doc.type] || doc.type;
                          if (doc.type === "termo_consentimento" && doc.consentProcedure) {
                            docTitle = `${typeLabels[doc.type]} - ${doc.consentProcedure}`;
                          } else if (doc.type === "contrato" && doc.contractProcedures) {
                            docTitle = `${typeLabels[doc.type]} - ${doc.contractProcedures.substring(0, 30)}...`;
                          } else if (doc.type === "atestado" && doc.attestationType) {
                            docTitle = `${typeLabels[doc.type]} - ${doc.attestationType === "dias" ? `${doc.attestationDays} dia(s)` : "Presença"}`;
                          }
                          
                          return (
                            <tr key={doc.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2">
                                <Badge className={`${typeColors[doc.type] || "bg-gray-100"}`}>
                                  {typeLabels[doc.type]}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <span className="font-medium text-sm">{docTitle}</span>
                                {doc.dentistName && (
                                  <p className="text-xs text-muted-foreground">{doc.dentistName}</p>
                                )}
                              </td>
                              <td className="py-3 px-2 text-sm">
                                {format(new Date(doc.documentDate || doc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {doc.patientSignature ? (
                                  <Badge className="bg-green-100 text-green-700">
                                    <Check className="h-3 w-3 mr-1" />
                                    Assinado
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      setSelectedDocumentId(doc.id);
                                      setSelectedDocumentForSign(doc);
                                      setSignatureType("patient");
                                      setIsSignatureDialogOpen(true);
                                    }}
                                  >
                                    <PenTool className="h-3 w-3 mr-1" />
                                    Assinar
                                  </Button>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {doc.professionalSignature ? (
                                  <Badge className="bg-green-100 text-green-700">
                                    <Check className="h-3 w-3 mr-1" />
                                    Assinado
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      setSelectedDocumentId(doc.id);
                                      setSelectedDocumentForSign(doc);
                                      setSignatureType("professional");
                                      setIsSignatureDialogOpen(true);
                                    }}
                                  >
                                    <PenTool className="h-3 w-3 mr-1" />
                                    Assinar
                                  </Button>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Imprimir"
                                    onClick={() => handlePrintDocument(doc)}
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Enviar por Email"
                                    onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600"
                                    title="Enviar por WhatsApp"
                                    onClick={() => handleShareWhatsApp(doc)}
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600"
                                    title="Gerar Link de Validação"
                                    onClick={() => {
                                      setSelectedDocumentId(doc.id);
                                      setSelectedDocumentForSign(doc);
                                      setGeneratedValidationLink(null);
                                      setValidationExpirationDays(null);
                                      setIsValidationLinkDialogOpen(true);
                                    }}
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    title="Excluir"
                                    onClick={() => {
                                      if (confirm("Tem certeza que deseja excluir este documento?")) {
                                        deleteMedicalDocMutation.mutate({ id: doc.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <File className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum documento cadastrado</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Adicione atestados, receituários, termos e contratos
                    </p>
                    <Button variant="outline" onClick={() => setIsDocumentDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro documento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recibos Tab */}
          <TabsContent value="recibos" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recibos
                </CardTitle>
                <CardDescription>Recibos de pagamento do paciente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum recibo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Os recibos de pagamento aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="historico" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Atendimentos
                </CardTitle>
                <CardDescription>Registro de todos os atendimentos realizados pelo dentista, ortodontia e prótese</CardDescription>
              </CardHeader>
              <CardContent>
                {patientAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {patientAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{apt.type || "Consulta"}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.date), "dd/MM/yyyy", { locale: ptBR })} às {apt.startTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {apt.type === "dentist" ? "Dentista" :
                             apt.type === "orthodontics" ? "Ortodontia" :
                             apt.type === "prosthesis" ? "Prótese" : "Consulta"}
                          </Badge>
                          <Badge
                            variant={
                              apt.status === "completed" ? "default" :
                              apt.status === "cancelled" ? "destructive" : "secondary"
                            }
                          >
                            {apt.status === "completed" ? "Concluído" :
                             apt.status === "cancelled" ? "Cancelado" :
                             apt.status === "scheduled" ? "Agendado" :
                             apt.status === "confirmed" ? "Confirmado" :
                             apt.status === "in_progress" ? "Em Atendimento" : "Não Compareceu"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Nenhum atendimento registrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      O histórico de atendimentos aparecerá aqui quando o paciente for atendido
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Badge variant="outline">Dentista</Badge>
                      <Badge variant="outline">Ortodontia</Badge>
                      <Badge variant="outline">Prótese</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Galeria Tab */}
          <TabsContent value="galeria" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Galeria
                  </CardTitle>
                  <CardDescription>Galeria de fotos do paciente</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Foto
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma foto</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione fotos do paciente à galeria
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hist. Fotos Tab */}
          <TabsContent value="hist-fotos" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Histórico de Fotos
                </CardTitle>
                <CardDescription>Evolução fotográfica do tratamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum histórico</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O histórico de fotos aparecerá aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diagn. IA Tab */}
          <TabsContent value="diagn-ia" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Diagnósticos de IA
                  </CardTitle>
                  <CardDescription>Análises de radiografias por inteligência artificial</CardDescription>
                </div>
                <Button onClick={() => setLocation("/analise-ia")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Análise
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum diagnóstico</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Os diagnósticos de IA aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Anamnese Dialog */}
        <Dialog open={isAnamneseDialogOpen} onOpenChange={setIsAnamneseDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Anamnese</DialogTitle>
              <DialogDescription>Preencha o histórico de saúde do paciente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveAnamnese}>
              <div className="grid gap-6 py-4">
                <div>
                  <h4 className="font-medium mb-3">Condições de Saúde</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <CheckboxField
                      id="heartDisease"
                      label="Doença Cardíaca"
                      checked={anamneseForm.heartDisease}
                      onChange={(checked) => setAnamneseForm({ ...anamneseForm, heartDisease: checked })}
                    />
                    <CheckboxField
                      id="hypertension"
                      label="Hipertensão"
                      checked={anamneseForm.hypertension}
                      onChange={(checked) => setAnamneseForm({ ...anamneseForm, hypertension: checked })}
                    />
                    <CheckboxField
                      id="diabetes"
                      label="Diabetes"
                      checked={anamneseForm.diabetes}
                      onChange={(checked) => setAnamneseForm({ ...anamneseForm, diabetes: checked })}
                    />
                    <CheckboxField
                      id="pregnancy"
                      label="Gravidez"
                      checked={anamneseForm.pregnancy}
                      onChange={(checked) => setAnamneseForm({ ...anamneseForm, pregnancy: checked })}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Hábitos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <CheckboxField
                      id="smoker"
                      label="Fumante"
                      checked={anamneseForm.smoker}
                      onChange={(checked) => setAnamneseForm({ ...anamneseForm, smoker: checked })}
                    />
                    <CheckboxField
                      id="alcohol"
                      label="Consome Álcool"
                      checked={anamneseForm.alcohol}
                      onChange={(checked) => setAnamneseForm({ ...anamneseForm, alcohol: checked })}
                    />
                  </div>
                </div>

                <div>
                  <CheckboxField
                    id="allergies"
                    label="Possui Alergias"
                    checked={anamneseForm.allergies}
                    onChange={(checked) => setAnamneseForm({ ...anamneseForm, allergies: checked })}
                  />
                  {anamneseForm.allergies && (
                    <Textarea
                      placeholder="Descreva as alergias..."
                      value={anamneseForm.allergiesDescription}
                      onChange={(e) => setAnamneseForm({ ...anamneseForm, allergiesDescription: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <CheckboxField
                    id="medications"
                    label="Usa Medicamentos"
                    checked={anamneseForm.medications}
                    onChange={(checked) => setAnamneseForm({ ...anamneseForm, medications: checked })}
                  />
                  {anamneseForm.medications && (
                    <Textarea
                      placeholder="Liste os medicamentos..."
                      value={anamneseForm.medicationsDescription}
                      onChange={(e) => setAnamneseForm({ ...anamneseForm, medicationsDescription: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <CheckboxField
                    id="surgeries"
                    label="Já fez Cirurgias"
                    checked={anamneseForm.surgeries}
                    onChange={(checked) => setAnamneseForm({ ...anamneseForm, surgeries: checked })}
                  />
                  {anamneseForm.surgeries && (
                    <Textarea
                      placeholder="Descreva as cirurgias..."
                      value={anamneseForm.surgeriesDescription}
                      onChange={(e) => setAnamneseForm({ ...anamneseForm, surgeriesDescription: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Outras observações relevantes..."
                    value={anamneseForm.notes}
                    onChange={(e) => setAnamneseForm({ ...anamneseForm, notes: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAnamneseDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveAnamnesisMutation.isPending}>
                  {saveAnamnesisMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Image Upload Dialog */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Imagem</DialogTitle>
              <DialogDescription>Faça upload de radiografias ou fotos</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arraste uma imagem ou clique para selecionar
                </p>
                <Button variant="outline" className="mt-4">
                  Selecionar Arquivo
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                Cancelar
              </Button>
              <Button disabled>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Type Selection Dialog */}
        <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Documento</DialogTitle>
              <DialogDescription>Selecione o tipo de documento</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
                onClick={() => {
                  setIsDocumentDialogOpen(false);
                  setIsAtestadoDialogOpen(true);
                }}
              >
                <FileText className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Atestado</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
                onClick={() => {
                  setIsDocumentDialogOpen(false);
                  setIsReceituarioDialogOpen(true);
                }}
              >
                <ClipboardList className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Receituário</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
                onClick={() => {
                  setIsDocumentDialogOpen(false);
                  setIsTermoDialogOpen(true);
                }}
              >
                <File className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Termo de Consentimento</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary"
                onClick={() => {
                  setIsDocumentDialogOpen(false);
                  setIsContratoDialogOpen(true);
                }}
              >
                <File className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Contrato</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Atestado */}
        <Dialog open={isAtestadoDialogOpen} onOpenChange={setIsAtestadoDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Emitir Atestado
              </DialogTitle>
              <DialogDescription>Preencha os dados do atestado médico</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select
                  value={selectedDentistId?.toString() || ""}
                  onValueChange={(v) => setSelectedDentistId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} - CRO: {d.cro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Atestado *</Label>
                <Select
                  value={atestadoForm.tipo}
                  onValueChange={(v: "dias" | "presenca") => setAtestadoForm({ ...atestadoForm, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dias">Atestado de Dias</SelectItem>
                    <SelectItem value="presenca">Atestado de Presença</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {atestadoForm.tipo === "dias" && (
                <div className="space-y-2">
                  <Label htmlFor="dias">Quantidade de Dias *</Label>
                  <Input
                    id="dias"
                    type="number"
                    min="1"
                    value={atestadoForm.dias}
                    onChange={(e) => setAtestadoForm({ ...atestadoForm, dias: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCid"
                  checked={atestadoForm.includeCid}
                  onCheckedChange={(checked) => setAtestadoForm({ ...atestadoForm, includeCid: !!checked })}
                />
                <Label htmlFor="includeCid" className="text-sm font-normal cursor-pointer">
                  Incluir CID (com autorização do paciente)
                </Label>
              </div>
              {atestadoForm.includeCid && (
                <div className="space-y-2">
                  <Label htmlFor="cid">Código CID</Label>
                  <Input
                    id="cid"
                    placeholder="Ex: K02.1"
                    value={atestadoForm.cid}
                    onChange={(e) => setAtestadoForm({ ...atestadoForm, cid: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2 hidden">
                <Label htmlFor="obs-atestado">Observações</Label>
                <Textarea
                  id="obs-atestado"
                  placeholder="Observações adicionais..."
                  value={atestadoForm.observacoes}
                  onChange={(e) => setAtestadoForm({ ...atestadoForm, observacoes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAtestadoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveAtestado} disabled={isSavingDocument}>
                {isSavingDocument ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Emitir Atestado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Receituário */}
        <Dialog open={isReceituarioDialogOpen} onOpenChange={setIsReceituarioDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Emitir Receituário
              </DialogTitle>
              <DialogDescription>Preencha a prescrição médica</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select
                  value={selectedDentistId?.toString() || ""}
                  onValueChange={(v) => setSelectedDentistId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} - CRO: {d.cro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicamentos">Prescrição *</Label>
                <Textarea
                  id="medicamentos"
                  placeholder="Ex:\n1. Amoxicilina 500mg - Tomar 1 cápsula de 8 em 8 horas por 7 dias\n2. Ibuprofeno 600mg - Tomar 1 comprimido de 6 em 6 horas se dor"
                  rows={6}
                  value={receituarioForm.medicamentos}
                  onChange={(e) => setReceituarioForm({ ...receituarioForm, medicamentos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="posologia">Posologia</Label>
                <Textarea
                  id="posologia"
                  placeholder="Ex:\n1. Tomar 1 cápsula de 8 em 8 horas por 7 dias\n2. Tomar 1 comprimido de 6 em 6 horas se dor"
                  rows={4}
                  value={receituarioForm.posologia}
                  onChange={(e) => setReceituarioForm({ ...receituarioForm, posologia: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs-receita">Observações</Label>
                <Textarea
                  id="obs-receita"
                  placeholder="Observações adicionais..."
                  value={receituarioForm.observacoes}
                  onChange={(e) => setReceituarioForm({ ...receituarioForm, observacoes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReceituarioDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveReceituario} disabled={isSavingDocument}>
                {isSavingDocument ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Emitir Receituário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Termo de Consentimento */}
        <Dialog open={isTermoDialogOpen} onOpenChange={setIsTermoDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <File className="h-5 w-5 text-primary" />
                Termo de Consentimento
              </DialogTitle>
              <DialogDescription>Preencha os dados do termo de consentimento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select
                  value={selectedDentistId?.toString() || ""}
                  onValueChange={(v) => setSelectedDentistId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} - CRO: {d.cro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedimento">Procedimento *</Label>
                <Input
                  id="procedimento"
                  placeholder="Ex: Extração de terceiro molar"
                  value={termoForm.procedimento}
                  onChange={(e) => setTermoForm({ ...termoForm, procedimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riscos">Riscos</Label>
                <Textarea
                  id="riscos"
                  placeholder="Descreva os riscos do procedimento..."
                  value={termoForm.riscos}
                  onChange={(e) => setTermoForm({ ...termoForm, riscos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficios">Benefícios</Label>
                <Textarea
                  id="beneficios"
                  placeholder="Descreva os benefícios do procedimento..."
                  value={termoForm.beneficios}
                  onChange={(e) => setTermoForm({ ...termoForm, beneficios: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternativas">Alternativas</Label>
                <Textarea
                  id="alternativas"
                  placeholder="Descreva as alternativas ao procedimento..."
                  value={termoForm.alternativas}
                  onChange={(e) => setTermoForm({ ...termoForm, alternativas: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTermoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveTermo} disabled={isSavingDocument}>
                {isSavingDocument ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Gerar Termo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Contrato */}
        <Dialog open={isContratoDialogOpen} onOpenChange={setIsContratoDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <File className="h-5 w-5 text-primary" />
                Contrato de Serviços
              </DialogTitle>
              <DialogDescription>Preencha os dados do contrato</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select
                  value={selectedDentistId?.toString() || ""}
                  onValueChange={(v) => setSelectedDentistId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} - CRO: {d.cro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicos">Procedimentos *</Label>
                <Textarea
                  id="servicos"
                  placeholder="Descreva os procedimentos que serão realizados..."
                  rows={3}
                  value={contratoForm.servicos}
                  onChange={(e) => setContratoForm({ ...contratoForm, servicos: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Total (R$) *</Label>
                  <Input
                    id="valor"
                    type="text"
                    placeholder="0,00"
                    value={contratoForm.valor}
                    onChange={(e) => setContratoForm({ ...contratoForm, valor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input
                    id="prazo"
                    placeholder="Ex: 6 meses"
                    value={contratoForm.prazo}
                    onChange={(e) => setContratoForm({ ...contratoForm, prazo: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select
                  value={contratoForm.formaPagamento}
                  onValueChange={(v) => setContratoForm({ ...contratoForm, formaPagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_vista">À Vista</SelectItem>
                    <SelectItem value="parcelado_2x">Parcelado em 2x</SelectItem>
                    <SelectItem value="parcelado_3x">Parcelado em 3x</SelectItem>
                    <SelectItem value="parcelado_6x">Parcelado em 6x</SelectItem>
                    <SelectItem value="parcelado_12x">Parcelado em 12x</SelectItem>
                    <SelectItem value="mensal">Pagamento Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContratoDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveContrato} disabled={isSavingDocument}>
                {isSavingDocument ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Gerar Contrato"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Assinatura Digital */}
        <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Assinatura Digital - {signatureType === "patient" ? "Paciente" : "Profissional"}
              </DialogTitle>
              <DialogDescription>
                Assinatura do {signatureType === "patient" ? `paciente ${selectedDocumentForSign?.patientName || patient?.name}` : `profissional ${selectedDocumentForSign?.dentistName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="border-2 border-primary/30 rounded-lg p-4 bg-white">
                <p className="text-sm text-muted-foreground mb-2 text-center">Desenhe sua assinatura abaixo:</p>
                <div className="border border-gray-300 rounded bg-white">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      className: "w-full h-40 rounded cursor-crosshair",
                      style: { touchAction: "none" }
                    }}
                    backgroundColor="#ffffff"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => signatureCanvasRef.current?.clear()}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ao assinar, você concorda com os termos do documento e confirma a autenticidade da assinatura.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsSignatureDialogOpen(false);
                signatureCanvasRef.current?.clear();
              }}>Cancelar</Button>
              <Button 
                onClick={() => {
                  if (selectedDocumentId && signatureCanvasRef.current) {
                    // Verificar se há assinatura desenhada
                    if (signatureCanvasRef.current.isEmpty()) {
                      toast.error("Por favor, desenhe sua assinatura antes de confirmar.");
                      return;
                    }
                    // Obter imagem da assinatura em base64
                    const signatureDataUrl = signatureCanvasRef.current.toDataURL();
                    signDocumentMutation.mutate({
                      id: selectedDocumentId,
                      signatureType,
                      signature: signatureDataUrl,
                    });
                    signatureCanvasRef.current.clear();
                  }
                }}
                disabled={signDocumentMutation.isPending}
              >
                {signDocumentMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assinando...</>
                ) : (
                  "Confirmar Assinatura"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Link de Validação */}
        <Dialog open={isValidationLinkDialogOpen} onOpenChange={setIsValidationLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Validade do Link
              </DialogTitle>
              <DialogDescription>
                Escolha por quanto tempo o link ficará disponível
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {!generatedValidationLink ? (
                <>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${validationExpirationDays === null ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setValidationExpirationDays(null)}
                  >
                    <p className="font-medium">Sem expiração</p>
                    <p className="text-sm text-muted-foreground">O link ficará disponível permanentemente</p>
                  </div>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${validationExpirationDays === 7 ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setValidationExpirationDays(7)}
                  >
                    <p className="font-medium">7 dias</p>
                    <p className="text-sm text-muted-foreground">Link expira em uma semana</p>
                  </div>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${validationExpirationDays === 30 ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setValidationExpirationDays(30)}
                  >
                    <p className="font-medium">30 dias</p>
                    <p className="text-sm text-muted-foreground">Link expira em um mês</p>
                  </div>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${validationExpirationDays === 90 ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setValidationExpirationDays(90)}
                  >
                    <p className="font-medium">90 dias</p>
                    <p className="text-sm text-muted-foreground">Link expira em três meses</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700 mb-2">Link gerado com sucesso!</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={generatedValidationLink} 
                        readOnly 
                        className="flex-1 p-2 text-xs bg-white border rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedValidationLink);
                          toast.success("Link copiado para a área de transferência!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compartilhe este link para que terceiros possam validar a autenticidade do documento.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsValidationLinkDialogOpen(false)}>
                {generatedValidationLink ? "Fechar" : "Cancelar"}
              </Button>
              {!generatedValidationLink && (
                <Button 
                  onClick={() => {
                    if (selectedDocumentId) {
                      generateValidationLinkMutation.mutate({
                        id: selectedDocumentId,
                        expirationDays: validationExpirationDays,
                      });
                    }
                  }}
                  disabled={generateValidationLinkMutation.isPending}
                >
                  {generateValidationLinkMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
                  ) : (
                    "Gerar Link"
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

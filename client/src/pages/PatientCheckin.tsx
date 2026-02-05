import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  CheckCircle, Clock, Users, Smartphone, ArrowLeft, Loader2, 
  UserPlus, ListOrdered, Bell, RefreshCw
} from "lucide-react";

// Página pública de check-in para pacientes (sem autenticação)
export default function PatientCheckin() {
  const [step, setStep] = useState<"form" | "success" | "queue">("form");
  const [checkinId, setCheckinId] = useState<number | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [checkinData, setCheckinData] = useState({
    patientName: "",
    phone: "",
    reason: "",
    queueType: "budget" as const, // Sempre entra na fila do Orçamentista
  });

  // Obter clinicId da URL (ex: /checkin?clinic=1)
  const urlParams = new URLSearchParams(window.location.search);
  const clinicId = parseInt(urlParams.get("clinic") || "0");

  // Buscar dados da clínica específica (se clinicId informado)
  const { data: clinicInfo, isLoading: isLoadingClinic } = trpc.admin.clinics.getPublicInfo.useQuery(
    { id: clinicId },
    { enabled: clinicId > 0 }
  );

  // Buscar configurações gerais da clínica (fallback)
  const { data: settingsData, isLoading: isLoadingSettings } = trpc.settings.get.useQuery(
    undefined,
    { enabled: clinicId === 0 || !clinicInfo }
  );

  // Mutation para criar check-in
  const createCheckinMutation = trpc.checkins.create.useMutation({
    onSuccess: (data) => {
      setCheckinId(data.id);
      setStep("success");
      // Após 3 segundos, mostrar a fila
      setTimeout(() => {
        setStep("queue");
      }, 3000);
    },
    onError: (error) => {
      toast.error("Erro ao fazer check-in. Tente novamente.");
      console.error(error);
    },
  });

  // Query para buscar posição na fila
  const { data: queueData, refetch: refetchQueue } = trpc.checkins.getQueuePosition.useQuery(
    { id: checkinId! },
    { 
      enabled: !!checkinId && step === "queue",
      refetchInterval: 10000, // Atualiza a cada 10 segundos
    }
  );

  useEffect(() => {
    if (queueData) {
      setQueuePosition(queueData.position);
    }
  }, [queueData]);

  const handleCheckin = () => {
    if (!checkinData.patientName.trim()) {
      toast.error("Por favor, informe seu nome completo");
      return;
    }
    if (!checkinData.phone.trim()) {
      toast.error("Por favor, informe seu telefone");
      return;
    }
    
    createCheckinMutation.mutate({
      ...checkinData,
      clinicId,
    });
  };

  const getQueueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      budget: "Orçamento",
      dentist: "Consulta com Dentista",
      orthodontics: "Ortodontia",
      implant: "Implante",
      prosthetics: "Prótese",
    };
    return labels[type] || type;
  };

  // Função para converter URL do CloudFront para URL do proxy
  const getProxyUrl = (url: string | null | undefined) => {
    if (!url) return null;
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

  // Nome e logo da clínica (prioriza dados da clínica específica, depois configurações gerais)
  const clinicName = clinicInfo?.name || settingsData?.name || "Dentrics";
  // Prioriza logoData (base64) sobre logoUrl (storage)
  const clinicLogo = (settingsData as any)?.logoData || getProxyUrl(clinicInfo?.logoUrl || settingsData?.logoUrl);
  const isLoading = isLoadingClinic || isLoadingSettings;

  // Componente de logo da clínica
  const ClinicLogo = ({ size = "large" }: { size?: "small" | "large" }) => {
    const sizeClasses = size === "large" 
      ? "w-20 h-20 text-3xl" 
      : "w-16 h-16 text-2xl";
    
    if (clinicLogo) {
      return (
        <img 
          src={clinicLogo} 
          alt={clinicName} 
          className={`${size === "large" ? "w-20 h-20" : "w-16 h-16"} rounded-2xl object-cover shadow-lg`}
        />
      );
    }
    
    return (
      <div className={`${sizeClasses} bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg`}>
        <span className="text-white font-bold">{clinicName.charAt(0).toUpperCase()}</span>
      </div>
    );
  };

  // Tela de sucesso
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-2xl">
          <CardContent className="p-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="h-14 w-14 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-in Realizado!</h2>
            <p className="text-gray-600 mb-4">
              Olá, <strong>{checkinData.patientName}</strong>!<br />
              Você foi adicionado à fila de <strong>Orçamento / Avaliação</strong>.
            </p>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                Aguarde, você será chamado em breve...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de acompanhamento da fila
  if (step === "queue") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header com logo e nome da clínica */}
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <ClinicLogo size="small" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{clinicName}</h1>
            <p className="text-gray-500">Acompanhe sua posição na fila</p>
          </div>

          {/* Posição na Fila */}
          <Card className="shadow-lg border-2 border-orange-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Sua posição na fila</p>
              <div className="text-6xl font-bold text-orange-600 mb-2">
                {queuePosition !== null ? `${queuePosition}º` : <Loader2 className="h-12 w-12 animate-spin mx-auto" />}
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Orçamento / Avaliação
              </Badge>
            </CardContent>
          </Card>

          {/* Informações do Paciente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Seus Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nome:</span>
                <span className="font-medium">{checkinData.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefone:</span>
                <span className="font-medium">{checkinData.phone}</span>
              </div>
              {checkinData.reason && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Motivo:</span>
                  <span className="font-medium">{checkinData.reason}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Aguardando chamada</p>
                  <p className="text-sm text-gray-600">
                    Você será chamado pelo painel ou WhatsApp
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atualizar */}
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => refetchQueue()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Posição
          </Button>

          {/* Novo Check-in */}
          <Button 
            variant="ghost" 
            className="w-full text-gray-500"
            onClick={() => {
              setStep("form");
              setCheckinId(null);
              setQueuePosition(null);
              setCheckinData({ patientName: "", phone: "", reason: "", queueType: "budget" });
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Fazer novo check-in
          </Button>
        </div>
      </div>
    );
  }

  // Formulário de Check-in
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header com logo e nome da clínica */}
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            {isLoading ? (
              <div className="w-20 h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ) : (
              <ClinicLogo size="large" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isLoading ? (
              <span className="inline-block w-32 h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              clinicName
            )}
          </h1>
          <p className="text-gray-500 mt-1">Sistema de Gestão Odontológica</p>
        </div>

        {/* Formulário */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-500" />
              Fazer Check-in
            </CardTitle>
            <CardDescription>
              Preencha seus dados para entrar na fila de atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={checkinData.patientName}
                onChange={(e) => setCheckinData({ ...checkinData, patientName: e.target.value })}
                placeholder="Digite seu nome completo"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <Input
                id="phone"
                value={checkinData.phone}
                onChange={(e) => setCheckinData({ ...checkinData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Visita (opcional)</Label>
              <Input
                id="reason"
                value={checkinData.reason}
                onChange={(e) => setCheckinData({ ...checkinData, reason: e.target.value })}
                placeholder="Ex: Dor de dente, consulta de rotina..."
                className="h-12"
              />
            </div>

            <Button 
              className="w-full h-14 text-lg bg-orange-500 hover:bg-orange-600 mt-4"
              onClick={handleCheckin}
              disabled={createCheckinMutation.isPending}
            >
              {createCheckinMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Fazer Check-in
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-white/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ListOrdered className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Como funciona?</p>
                <p className="text-sm text-gray-600">
                  Após o check-in, você entrará automaticamente na fila do Orçamentista para avaliação. 
                  Acompanhe sua posição e aguarde ser chamado pelo painel ou WhatsApp.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

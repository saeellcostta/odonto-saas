import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  QrCode, CheckCircle, Clock, Users, Smartphone
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function QRCheckin() {
  const { user } = useAuth();
  const [checkinData, setCheckinData] = useState({
    patientName: "",
    phone: "",
    reason: "",
    queueType: "budget" as const,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const createCheckinMutation = trpc.checkins.create.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCheckinData({ patientName: "", phone: "", reason: "", queueType: "budget" });
      }, 3000);
    },
    onError: () => toast.error("Erro ao fazer check-in"),
  });

  const handleCheckin = () => {
    if (!checkinData.patientName) {
      toast.error("Por favor, informe seu nome");
      return;
    }
    createCheckinMutation.mutate({ ...checkinData, clinicId });
  };

  // Gerar URL da página pública de check-in
  const baseUrl = window.location.origin;
  const clinicId = user?.clinicId || 1;
  const checkinPageUrl = `${baseUrl}/checkin?clinic=${clinicId}`;
  
  // Generate QR Code URL (using a free QR code API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinPageUrl)}`;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-in Realizado!</h2>
            <p className="text-gray-600 mb-4">
              Você foi adicionado à fila. Por favor, aguarde ser chamado.
            </p>
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-700">
                <Clock className="h-4 w-4 inline mr-1" />
                Tempo estimado de espera: 15-30 minutos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Check-in</h1>
          <p className="text-gray-500 mt-1">Sistema de check-in automático para pacientes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code para Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-6 rounded-lg inline-block shadow-inner border">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code para Check-in" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="text-gray-600 mt-4">
                Imprima este QR Code e coloque na recepção para que os pacientes 
                possam fazer check-in pelo celular.
              </p>
              <Button className="mt-4 gap-2" variant="outline" onClick={() => window.print()}>
                Imprimir QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Manual Check-in Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Check-in Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={checkinData.patientName}
                    onChange={(e) => setCheckinData({ ...checkinData, patientName: e.target.value })}
                    placeholder="Digite seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={checkinData.phone}
                    onChange={(e) => setCheckinData({ ...checkinData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Atendimento</Label>
                  <Select
                    value={checkinData.queueType}
                    onValueChange={(v: any) => setCheckinData({ ...checkinData, queueType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Orçamento</SelectItem>
                      <SelectItem value="dentist">Consulta com Dentista</SelectItem>
                      <SelectItem value="orthodontics">Ortodontia</SelectItem>
                      <SelectItem value="implant">Implante</SelectItem>
                      <SelectItem value="prosthetics">Prótese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motivo da Visita</Label>
                  <Input
                    value={checkinData.reason}
                    onChange={(e) => setCheckinData({ ...checkinData, reason: e.target.value })}
                    placeholder="Ex: Consulta de rotina, dor de dente..."
                  />
                </div>
                <Button 
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
                  onClick={handleCheckin}
                  disabled={createCheckinMutation.isPending}
                >
                  {createCheckinMutation.isPending ? "Processando..." : "Fazer Check-in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Como funciona o Check-in por QR Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Escaneie o QR Code</p>
                  <p className="text-sm text-gray-600">O paciente aponta a câmera do celular para o QR Code</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Preencha os dados</p>
                  <p className="text-sm text-gray-600">Informe nome, telefone e tipo de atendimento</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Aguarde ser chamado</p>
                  <p className="text-sm text-gray-600">O paciente entra na fila e aguarda o atendimento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

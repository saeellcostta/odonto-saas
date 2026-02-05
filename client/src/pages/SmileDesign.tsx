import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Sparkles, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  Loader2,
  ArrowLeftRight,
  Wand2,
  Save,
  History,
  Trash2,
  Eye,
  MessageCircle,
  Phone,
  Copy,
  Check
} from "lucide-react";

interface SmileSimulation {
  id: number;
  patientId: number;
  patientName: string;
  originalImageUrl: string;
  simulatedImageUrl: string;
  treatmentType: string;
  notes: string;
  createdAt: string;
}

export default function SmileDesign() {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [treatmentType, setTreatmentType] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<SmileSimulation[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharePhone, setSharePhone] = useState("");
  const [shareMessage, setShareMessage] = useState("Olá! Veja a simulação do seu novo sorriso após o tratamento. Ficou incrível! 😁✨");
  const [isSharing, setIsSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: patients } = trpc.patients.list.useQuery();
  const generateSimulation = trpc.smileDesign.generate.useMutation();
  const saveSimulation = trpc.smileDesign.save.useMutation();
  const { data: simulations, refetch: refetchSimulations } = trpc.smileDesign.list.useQuery();

  const treatmentTypes = [
    { value: "clareamento", label: "Clareamento Dental" },
    { value: "facetas", label: "Facetas de Porcelana" },
    { value: "lentes", label: "Lentes de Contato Dental" },
    { value: "implantes", label: "Implantes Dentários" },
    { value: "ortodontia", label: "Ortodontia/Alinhamento" },
    { value: "restauracao", label: "Restaurações Estéticas" },
    { value: "gengiva", label: "Harmonização Gengival" },
    { value: "completo", label: "Reabilitação Completa" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setSimulatedImage(null);
        setShowComparison(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) {
      toast.error("Por favor, faça upload de uma foto primeiro.");
      return;
    }
    if (!treatmentType) {
      toast.error("Por favor, selecione o tipo de tratamento.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateSimulation.mutateAsync({
        imageBase64: originalImage,
        treatmentType,
        notes,
      });
      
      setSimulatedImage(result.simulatedImageUrl);
      setShowComparison(true);
      toast.success("Simulação gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar simulação. Tente novamente.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatient || !originalImage || !simulatedImage) {
      toast.error("Selecione um paciente e gere uma simulação primeiro.");
      return;
    }

    try {
      await saveSimulation.mutateAsync({
        patientId: parseInt(selectedPatient),
        originalImageUrl: originalImage,
        simulatedImageUrl: simulatedImage,
        treatmentType,
        notes,
      });
      
      toast.success("Simulação salva no prontuário do paciente!");
      refetchSimulations();
    } catch (error) {
      toast.error("Erro ao salvar simulação.");
      console.error(error);
    }
  };

  const handleShare = async () => {
    if (!simulatedImage) return;
    setShowShareDialog(true);
    
    // Preencher telefone do paciente se selecionado
    if (selectedPatient && patients) {
      const patient = patients.find(p => p.id.toString() === selectedPatient);
      if (patient?.phone) {
        setSharePhone(patient.phone.replace(/\D/g, ''));
      }
    }
  };

  const handleShareWhatsApp = () => {
    if (!simulatedImage) return;
    
    // Formatar número de telefone (remover caracteres especiais)
    const phone = sharePhone.replace(/\D/g, '');
    
    // Adicionar código do Brasil se não tiver
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
    
    // Criar mensagem com link da imagem
    const message = encodeURIComponent(`${shareMessage}\n\nVeja a simulação: ${simulatedImage}`);
    
    // Abrir WhatsApp Web ou App
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success("WhatsApp aberto! Envie a mensagem para o paciente.");
    setShowShareDialog(false);
  };

  const handleCopyLink = async () => {
    if (!simulatedImage) return;
    
    try {
      await navigator.clipboard.writeText(simulatedImage);
      setLinkCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleDownload = () => {
    if (!simulatedImage) return;
    
    const link = document.createElement("a");
    link.href = simulatedImage;
    link.download = `smile-design-${Date.now()}.png`;
    link.click();
    toast.success("Imagem baixada!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-orange-500" />
              Smile Design Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie simulações do sorriso dos seus pacientes com inteligência artificial
            </p>
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Criar Simulação
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Galeria de Exemplos
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Painel de Upload e Configuração */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Foto do Paciente
                  </CardTitle>
                  <CardDescription>
                    Faça upload de uma foto do sorriso atual do paciente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seleção de Paciente */}
                  <div className="space-y-2">
                    <Label>Paciente (opcional)</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
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

                  {/* Upload de Imagem */}
                  <div className="space-y-2">
                    <Label>Foto do Sorriso</Label>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {originalImage ? (
                        <div className="space-y-2">
                          <img 
                            src={originalImage} 
                            alt="Foto original" 
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            Clique para trocar a foto
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Clique ou arraste uma foto aqui
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG até 10MB
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Tipo de Tratamento */}
                  <div className="space-y-2">
                    <Label>Tipo de Tratamento</Label>
                    <Select value={treatmentType} onValueChange={setTreatmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tratamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Textarea
                      placeholder="Descreva detalhes específicos do resultado desejado..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Botão Gerar */}
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={handleGenerate}
                    disabled={!originalImage || !treatmentType || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando simulação...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Gerar Simulação com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Painel de Resultado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Resultado da Simulação
                  </CardTitle>
                  <CardDescription>
                    Visualize o antes e depois do sorriso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showComparison && originalImage && simulatedImage ? (
                    <>
                      {/* Comparação lado a lado */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-center">Antes</p>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={originalImage} 
                              alt="Antes" 
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-center">Depois</p>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={simulatedImage} 
                              alt="Depois" 
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Slider de comparação */}
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ArrowLeftRight className="h-4 w-4" />
                        Arraste para comparar
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleDownload}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={handleShare}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Button 
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                          onClick={handleSave}
                          disabled={!selectedPatient}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </div>

                      {!selectedPatient && (
                        <p className="text-xs text-center text-muted-foreground">
                          Selecione um paciente para salvar no prontuário
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                      <p>A simulação aparecerá aqui</p>
                      <p className="text-sm">Faça upload de uma foto e clique em gerar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Galeria de Exemplos - Antes e Depois
                </CardTitle>
                <CardDescription>
                  Exemplos de transformações de sorriso para mostrar aos pacientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Clareamento */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-100 to-white p-4">
                      <h3 className="font-semibold text-lg">Clareamento Dental</h3>
                      <p className="text-sm text-muted-foreground">Dentes até 8 tons mais brancos</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-amber-200 to-amber-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl">😁</span>
                            <p className="text-xs mt-1 text-amber-700">Antes</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-white to-blue-50 rounded-lg flex items-center justify-center border">
                          <div className="text-center">
                            <span className="text-4xl">✨😁✨</span>
                            <p className="text-xs mt-1 text-blue-700">Depois</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-2">
                      <ul className="text-sm space-y-1">
                        <li>• Clareamento a laser ou moldeira</li>
                        <li>• Resultado em 1-3 sessões</li>
                        <li>• Duração: 1-3 anos</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Facetas */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-100 to-white p-4">
                      <h3 className="font-semibold text-lg">Facetas de Porcelana</h3>
                      <p className="text-sm text-muted-foreground">Sorriso perfeito e natural</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl">😬</span>
                            <p className="text-xs mt-1 text-gray-700">Antes</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-white to-orange-50 rounded-lg flex items-center justify-center border">
                          <div className="text-center">
                            <span className="text-4xl">💎😄💎</span>
                            <p className="text-xs mt-1 text-orange-700">Depois</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-2">
                      <ul className="text-sm space-y-1">
                        <li>• Corrige forma, cor e alinhamento</li>
                        <li>• Resultado em 2-3 consultas</li>
                        <li>• Duração: 10-15 anos</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Lentes de Contato */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-100 to-white p-4">
                      <h3 className="font-semibold text-lg">Lentes de Contato</h3>
                      <p className="text-sm text-muted-foreground">Sorriso de Hollywood</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl">🙂</span>
                            <p className="text-xs mt-1 text-gray-700">Antes</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-white to-pink-50 rounded-lg flex items-center justify-center border">
                          <div className="text-center">
                            <span className="text-4xl">🌟😄🌟</span>
                            <p className="text-xs mt-1 text-pink-700">Depois</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-2">
                      <ul className="text-sm space-y-1">
                        <li>• Ultra-finas (0.3mm)</li>
                        <li>• Mínimo desgaste dental</li>
                        <li>• Duração: 10-20 anos</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Implantes */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-100 to-white p-4">
                      <h3 className="font-semibold text-lg">Implantes Dentários</h3>
                      <p className="text-sm text-muted-foreground">Dentes completos novamente</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-red-100 to-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl">🫣</span>
                            <p className="text-xs mt-1 text-red-700">Antes</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-white to-blue-50 rounded-lg flex items-center justify-center border">
                          <div className="text-center">
                            <span className="text-4xl">🦷😄🦷</span>
                            <p className="text-xs mt-1 text-blue-700">Depois</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-2">
                      <ul className="text-sm space-y-1">
                        <li>• Substitui dentes perdidos</li>
                        <li>• Fixação permanente</li>
                        <li>• Duração: 20+ anos</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Ortodontia */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-100 to-white p-4">
                      <h3 className="font-semibold text-lg">Ortodontia</h3>
                      <p className="text-sm text-muted-foreground">Alinhamento perfeito</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl">🫤</span>
                            <p className="text-xs mt-1 text-gray-700">Antes</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-white to-purple-50 rounded-lg flex items-center justify-center border">
                          <div className="text-center">
                            <span className="text-4xl">💜😁💜</span>
                            <p className="text-xs mt-1 text-purple-700">Depois</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-2">
                      <ul className="text-sm space-y-1">
                        <li>• Aparelho fixo ou alinhadores</li>
                        <li>• Tratamento: 12-24 meses</li>
                        <li>• Resultado permanente</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Reabilitação Completa */}
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-green-100 to-white p-4">
                      <h3 className="font-semibold text-lg">Reabilitação Completa</h3>
                      <p className="text-sm text-muted-foreground">Transformação total</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-gray-300 to-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl">😞</span>
                            <p className="text-xs mt-1 text-gray-700">Antes</p>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-white to-green-50 rounded-lg flex items-center justify-center border">
                          <div className="text-center">
                            <span className="text-4xl">🎉😄🎉</span>
                            <p className="text-xs mt-1 text-green-700">Depois</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-2">
                      <ul className="text-sm space-y-1">
                        <li>• Combina múltiplos tratamentos</li>
                        <li>• Planejamento personalizado</li>
                        <li>• Resultado transformador</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Dicas para mostrar ao paciente */}
                <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">Dicas para apresentar ao paciente:</h3>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Mostre exemplos similares ao caso do paciente</li>
                    <li>• Explique o processo e tempo de tratamento</li>
                    <li>• Use a simulação com IA para mostrar o resultado esperado</li>
                    <li>• Apresente opções de pagamento e parcelamento</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Simulações Salvas</CardTitle>
                <CardDescription>
                  Histórico de todas as simulações de sorriso criadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {simulations && simulations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simulations.map((sim: any) => (
                      <Card key={sim.id} className="overflow-hidden">
                        <div className="grid grid-cols-2">
                          <img 
                            src={sim.originalImageUrl} 
                            alt="Antes" 
                            className="h-32 object-cover"
                          />
                          <img 
                            src={sim.simulatedImageUrl} 
                            alt="Depois" 
                            className="h-32 object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium">{sim.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {treatmentTypes.find(t => t.value === sim.treatmentType)?.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Share2 className="h-3 w-3 mr-1" />
                              Enviar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma simulação salva ainda</p>
                    <p className="text-sm">Crie sua primeira simulação na aba "Criar Simulação"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Compartilhamento via WhatsApp */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                Compartilhar via WhatsApp
              </DialogTitle>
              <DialogDescription>
                Envie a simulação do sorriso diretamente para o paciente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Preview da imagem */}
              {simulatedImage && (
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={simulatedImage} 
                    alt="Simulação" 
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Número do WhatsApp */}
              <div className="space-y-2">
                <Label>Número do WhatsApp</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="ml-2 text-sm">+55</span>
                  </div>
                  <Input
                    placeholder="11 99999-9999"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Digite a mensagem..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleShareWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={!sharePhone}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar pelo WhatsApp
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {linkCopied ? "Copiado!" : "Copiar Link"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>

              {!sharePhone && (
                <p className="text-xs text-center text-muted-foreground">
                  Digite o número do WhatsApp do paciente para enviar
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Model3DViewer } from '@/components/Model3DViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Box, 
  Upload, 
  History, 
  Info,
  FileBox,
  Trash2,
  Download,
  Eye,
  User,
  FolderOpen,
  X,
  Share2,
  Link,
  Plus
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

// Modelos de exemplo para demonstração (apenas modelos STL realistas)
const sampleModels = [
  {
    id: 1,
    name: 'Dente Realista (Dentina)',
    description: 'Modelo 3D realista de dente - camada de dentina do projeto OpenMandible (Universidade de Kragujevac)',
    type: 'stl',
    url: '/tooth_dentin.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Dente Realista (Esmalte)',
    description: 'Modelo 3D realista de dente - camada de esmalte do projeto OpenMandible (Universidade de Kragujevac)',
    type: 'stl',
    url: '/tooth_enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Mandíbula Completa',
    description: 'Modelo 3D realista de mandíbula humana (osso cortical) do projeto OpenMandible - modelo científico de alta precisão',
    type: 'stl',
    url: '/mandible_bone.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Arcada Realista - Incisivo Central (L1)',
    description: 'Incisivo central esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L1_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Arcada Realista - Incisivo Lateral (L2)',
    description: 'Incisivo lateral esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L2_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Arcada Realista - Canino (L3)',
    description: 'Canino esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L3_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Arcada Realista - 1º Pré-Molar (L4)',
    description: 'Primeiro pré-molar esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L4_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Arcada Realista - 2º Pré-Molar (L5)',
    description: 'Segundo pré-molar esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L5_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Arcada Realista - 1º Molar (L6)',
    description: 'Primeiro molar esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L6_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Arcada Realista - 2º Molar (L7)',
    description: 'Segundo molar esquerdo - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_L7_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Arcada Realista - Incisivo Central (R1)',
    description: 'Incisivo central direito - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_R1_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 12,
    name: 'Arcada Realista - 1º Molar (R6)',
    description: 'Primeiro molar direito - modelo científico realista do OpenMandible',
    type: 'stl',
    url: '/Tooth_R6_Enamel.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 13,
    name: 'Crânio Humano Completo',
    description: 'Modelo 3D de crânio humano feminino completo do Visible Human Project (NIH) - alta precisão anatômica',
    type: 'stl',
    url: '/skull_human_complete.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 14,
    name: 'Osso Cortical da Mandíbula',
    description: 'Modelo 3D do osso cortical da mandíbula - camada externa do osso do projeto OpenMandible',
    type: 'stl',
    url: '/cortical_bone.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 15,
    name: 'Osso Esponjoso da Mandíbula',
    description: 'Modelo 3D do osso esponjoso (canceloso) da mandíbula - camada interna do osso do projeto OpenMandible',
    type: 'stl',
    url: '/cancellous_bone.stl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 16,
    name: 'Cartilagem da ATM',
    description: 'Modelo 3D da cartilagem da Articulação Temporomandibular (ATM) do projeto OpenMandible',
    type: 'stl',
    url: '/cartilage.stl',
    createdAt: new Date().toISOString(),
  },
];

type ModelCategory = 'escaneamento' | 'planejamento' | 'prótese' | 'implante' | 'ortodontia' | 'outro';

export default function Visualizador3D() {
  const [, navigate] = useLocation();
  const [selectedModel, setSelectedModel] = useState<typeof sampleModels[0] | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [models, setModels] = useState(sampleModels);
  const [recentModels, setRecentModels] = useState<typeof sampleModels>([]);
  const [activeTab, setActiveTab] = useState('viewer');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<number | null>(null);
  const [clearRecentDialogOpen, setClearRecentDialogOpen] = useState(false);
  
  // Estados para salvar no prontuário
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  // Estados para upload direto à biblioteca
  const [uploadToLibraryDialogOpen, setUploadToLibraryDialogOpen] = useState(false);
  const [libraryModelName, setLibraryModelName] = useState('');
  const [libraryModelDescription, setLibraryModelDescription] = useState('');
  const [libraryModelCategory, setLibraryModelCategory] = useState<'anatomia' | 'escaneamento' | 'planejamento' | 'prótese' | 'implante' | 'ortodontia' | 'educacional' | 'outro'>('escaneamento');
  const [libraryUploadFile, setLibraryUploadFile] = useState<File | null>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para compartilhamento
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [modelCategory, setModelCategory] = useState<ModelCategory>('escaneamento');
  const [addToLibrary, setAddToLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Buscar pacientes
  const { data: patients = [] } = trpc.patients.list.useQuery();
  
  // Mutation para salvar modelo no prontuário
  const saveToPatientMutation = trpc.models3D.saveToPatient.useMutation({
    onSuccess: (data) => {
      toast.success('Modelo salvo no prontuário do paciente!');
      setSaveDialogOpen(false);
      
      // Perguntar se quer ir para o prontuário
      const patient = patients.find(p => p.id === parseInt(selectedPatientId));
      if (patient) {
        toast.info(
          `Modelo salvo para ${patient.name}. Deseja ir para o prontuário?`,
          {
            action: {
              label: 'Ir para Prontuário',
              onClick: () => navigate(`/prontuarios/${selectedPatientId}`),
            },
            duration: 10000,
          }
        );
      }
      
      // Limpar estados
      setUploadedFile(null);
      setModelName('');
      setModelDescription('');
      setSelectedPatientId('');
      setModelCategory('escaneamento');
      setAddToLibrary(false);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const handleUpload = (file: File) => {
    setUploadedFile(file);
    setModelName(file.name.replace(/\.[^/.]+$/, ''));
    toast.success('Modelo carregado com sucesso!');
  };

  const handleOpenSaveDialog = () => {
    if (!uploadedFile || !modelName) {
      toast.error('Preencha o nome do modelo');
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleSaveToPatient = async () => {
    if (!uploadedFile || !modelName || !selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    setIsSaving(true);
    
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const fileType = uploadedFile.name.split('.').pop()?.toLowerCase() as 'stl' | 'obj' | 'gltf' | 'glb';
        
        await saveToPatientMutation.mutateAsync({
          patientId: parseInt(selectedPatientId),
          name: modelName,
          description: modelDescription,
          fileData: base64,
          fileName: uploadedFile.name,
          fileType: fileType || 'stl',
          fileSize: uploadedFile.size,
          category: modelCategory,
          addToLibrary: addToLibrary,
        });
        
        setIsSaving(false);
      };
      reader.readAsDataURL(uploadedFile);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleSaveToLibraryOnly = () => {
    if (!uploadedFile || !modelName) {
      toast.error('Preencha o nome do modelo');
      return;
    }

    const newModel = {
      id: Date.now(),
      name: modelName,
      description: modelDescription,
      type: uploadedFile.name.split('.').pop()?.toLowerCase() || 'stl',
      url: URL.createObjectURL(uploadedFile),
      createdAt: new Date().toISOString(),
    };

    setModels([newModel, ...models]);
    setRecentModels([newModel, ...recentModels].slice(0, 10));
    setUploadedFile(null);
    setModelName('');
    setModelDescription('');
    toast.success('Modelo salvo na biblioteca!');
  };

  const handleDeleteModel = (id: number) => {
    setModelToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteModel = () => {
    if (modelToDelete !== null) {
      setModels(models.filter(m => m.id !== modelToDelete));
      setRecentModels(recentModels.filter(m => m.id !== modelToDelete));
      if (selectedModel?.id === modelToDelete) {
        setSelectedModel(null);
      }
      toast.success('Modelo removido');
    }
    setDeleteDialogOpen(false);
    setModelToDelete(null);
  };

  const handleClearRecent = () => {
    setClearRecentDialogOpen(true);
  };

  // Função para abrir dialog de upload direto à biblioteca
  const handleOpenLibraryUpload = () => {
    libraryFileInputRef.current?.click();
  };

  const handleLibraryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.stl', '.obj', '.gltf', '.glb'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast.error('Formato não suportado. Use STL, OBJ, GLTF ou GLB.');
        return;
      }
      setLibraryUploadFile(file);
      setLibraryModelName(file.name.replace(/\.[^/.]+$/, ''));
      setUploadToLibraryDialogOpen(true);
    }
    e.target.value = '';
  };

  const handleSaveToLibraryDirect = () => {
    if (!libraryUploadFile || !libraryModelName) {
      toast.error('Preencha o nome do modelo');
      return;
    }

    const newModel = {
      id: Date.now(),
      name: libraryModelName,
      description: libraryModelDescription,
      type: libraryUploadFile.name.split('.').pop()?.toLowerCase() || 'stl',
      url: URL.createObjectURL(libraryUploadFile),
      createdAt: new Date().toISOString(),
    };

    setModels([newModel, ...models]);
    setUploadToLibraryDialogOpen(false);
    setLibraryUploadFile(null);
    setLibraryModelName('');
    setLibraryModelDescription('');
    setLibraryModelCategory('escaneamento');
    toast.success('Modelo adicionado à biblioteca!');
  };

  // Função para baixar modelo
  const handleDownloadModel = async (model: typeof sampleModels[0]) => {
    try {
      const response = await fetch(model.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.name}.${model.type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar o modelo');
    }
  };

  // Função para compartilhar modelo
  const handleShareModel = async (model: typeof sampleModels[0]) => {
    const shareUrl = window.location.origin + `/visualizador-3d?model=${model.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: model.name,
          text: model.description || 'Modelo 3D odontológico',
          url: shareUrl,
        });
        toast.success('Compartilhado com sucesso!');
      } catch (error) {
        // Usuário cancelou ou erro
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado para a área de transferência!');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const confirmClearRecent = () => {
    setRecentModels([]);
    setClearRecentDialogOpen(false);
    toast.success('Histórico de recentes limpo');
  };

  const handleViewModel = (model: typeof sampleModels[0]) => {
    setSelectedModel(model);
    // Adicionar aos recentes se não for um modelo de exemplo
    if (!sampleModels.find(m => m.id === model.id)) {
      setRecentModels(prev => {
        const filtered = prev.filter(m => m.id !== model.id);
        return [model, ...filtered].slice(0, 10);
      });
    }
    setActiveTab('viewer');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Box className="w-8 h-8 text-primary" />
              Visualizador 3D
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize modelos de escaneamento, próteses e planejamentos em 3D
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="viewer" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizador
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FileBox className="w-4 h-4" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Informações
            </TabsTrigger>
          </TabsList>

          {/* Aba Visualizador */}
          <TabsContent value="viewer">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Visualizador Principal */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      {selectedModel ? selectedModel.name : 'Visualizador de Modelos 3D'}
                    </CardTitle>
                    {selectedModel && (
                      <CardDescription>{selectedModel.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Model3DViewer 
                      key={selectedModel?.id || 'default'}
                      modelUrl={selectedModel?.url || undefined}
                      modelType={(selectedModel?.type || 'stl') as 'stl' | 'obj' | 'gltf' | 'glb'}
                      onUpload={handleUpload}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Painel Lateral */}
              <div className="space-y-4">
                {/* Salvar Modelo Carregado */}
                {uploadedFile && (
                  <Card className="border-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Salvar Modelo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor="modelName">Nome</Label>
                        <Input
                          id="modelName"
                          value={modelName}
                          onChange={(e) => setModelName(e.target.value)}
                          placeholder="Nome do modelo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="modelDesc">Descrição</Label>
                        <Textarea
                          id="modelDesc"
                          value={modelDescription}
                          onChange={(e) => setModelDescription(e.target.value)}
                          placeholder="Descrição do modelo"
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={handleOpenSaveDialog} className="w-full">
                          <User className="w-4 h-4 mr-2" />
                          Salvar no Prontuário
                        </Button>
                        <Button onClick={handleSaveToLibraryOnly} variant="outline" className="w-full">
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Apenas Biblioteca
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Modelos Recentes */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Modelos Recentes
                      </CardTitle>
                      {recentModels.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                          onClick={handleClearRecent}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentModels.length > 0 ? (
                        recentModels.slice(0, 5).map((model) => (
                          <div
                            key={model.id}
                            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                              selectedModel?.id === model.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedModel(model)}
                          >
                            <div className="flex items-center gap-2">
                              <FileBox className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{model.name}</p>
                                <p className="text-xs text-muted-foreground uppercase">{model.type}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum modelo recente
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Modelos da Biblioteca */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileBox className="w-4 h-4" />
                      Biblioteca
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {models.slice(0, 8).map((model) => (
                        <div
                          key={model.id}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedModel?.id === model.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedModel(model)}
                        >
                          <div className="flex items-center gap-2">
                            <FileBox className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{model.name}</p>
                              <p className="text-xs text-muted-foreground uppercase">{model.type}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Aba Biblioteca */}
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Biblioteca de Modelos 3D</CardTitle>
                    <CardDescription>
                      Todos os modelos salvos no sistema
                    </CardDescription>
                  </div>
                  <Button onClick={handleOpenLibraryUpload} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Modelo
                  </Button>
                  <input
                    ref={libraryFileInputRef}
                    type="file"
                    accept=".stl,.obj,.gltf,.glb"
                    className="hidden"
                    onChange={handleLibraryFileSelect}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Thumbnail/Preview */}
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                        {model.name.toLowerCase().includes('crânio') || model.name.toLowerCase().includes('skull') ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">💀</div>
                            <span className="text-xs text-muted-foreground font-medium">Crânio</span>
                          </div>
                        ) : model.name.toLowerCase().includes('mandíbula') || model.name.toLowerCase().includes('cortical') || model.name.toLowerCase().includes('esponjoso') ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">🦴</div>
                            <span className="text-xs text-muted-foreground font-medium">Osso</span>
                          </div>
                        ) : model.name.toLowerCase().includes('cartilagem') || model.name.toLowerCase().includes('atm') ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">🧠</div>
                            <span className="text-xs text-muted-foreground font-medium">Articulação</span>
                          </div>
                        ) : model.name.toLowerCase().includes('dente') || model.name.toLowerCase().includes('tooth') || model.name.toLowerCase().includes('incisivo') || model.name.toLowerCase().includes('molar') || model.name.toLowerCase().includes('canino') ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">🦷</div>
                            <span className="text-xs text-muted-foreground font-medium">Dente</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileBox className="w-12 h-12 text-muted-foreground/50" />
                            <span className="text-xs text-muted-foreground font-medium uppercase">{model.type}</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{model.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {model.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                            {model.type}
                          </span>
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 flex-1"
                                onClick={() => handleViewModel(model)}
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadModel(model)}
                                title="Baixar"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShareModel(model)}
                                title="Compartilhar"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Informações */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Visualizador 3D</CardTitle>
                <CardDescription>
                  Informações sobre formatos suportados e controles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Formatos Suportados</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>STL</strong> - Stereolithography (mais comum para modelos odontológicos)</li>
                    <li><strong>OBJ</strong> - Wavefront Object</li>
                    <li><strong>GLTF/GLB</strong> - GL Transmission Format (com texturas)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Controles do Visualizador</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Arrastar</strong> - Rotacionar o modelo</li>
                    <li><strong>Scroll</strong> - Zoom in/out</li>
                    <li><strong>Shift + Arrastar</strong> - Mover o modelo</li>
                    <li><strong>Botão Tela Cheia</strong> - Expandir visualizador</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Salvando Modelos</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Salvar no Prontuário</strong> - Vincula o modelo a um paciente específico</li>
                    <li><strong>Adicionar à Biblioteca</strong> - Disponibiliza o modelo para uso geral</li>
                    <li>Modelos salvos no prontuário podem ser acessados na ficha do paciente</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Modelos Inclusos</h3>
                  <p className="text-sm text-muted-foreground">
                    Os modelos anatômicos inclusos são provenientes do projeto OpenMandible 
                    (Universidade de Kragujevac) e do Visible Human Project (NIH), 
                    disponibilizados para uso educacional e científico.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteModel} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Limpar Recentes */}
        <AlertDialog open={clearRecentDialogOpen} onOpenChange={setClearRecentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar Histórico</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja limpar o histórico de modelos recentes?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmClearRecent}>
                Limpar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Salvar no Prontuário */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Salvar no Prontuário do Paciente
              </DialogTitle>
              <DialogDescription>
                Selecione o paciente e a categoria do modelo 3D
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={modelCategory} onValueChange={(v) => setModelCategory(v as ModelCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escaneamento">Escaneamento</SelectItem>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="prótese">Prótese</SelectItem>
                    <SelectItem value="implante">Implante</SelectItem>
                    <SelectItem value="ortodontia">Ortodontia</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="addToLibrary" 
                  checked={addToLibrary}
                  onCheckedChange={(checked) => setAddToLibrary(checked as boolean)}
                />
                <Label htmlFor="addToLibrary" className="text-sm font-normal cursor-pointer">
                  Também adicionar à biblioteca geral
                </Label>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Modelo:</strong> {modelName}
                </p>
                {modelDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Descrição:</strong> {modelDescription}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveToPatient} disabled={!selectedPatientId || isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar no Prontuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Upload Direto à Biblioteca */}
        <Dialog open={uploadToLibraryDialogOpen} onOpenChange={setUploadToLibraryDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Adicionar Modelo à Biblioteca
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do modelo para adicionar à biblioteca
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Modelo *</Label>
                <Input
                  value={libraryModelName}
                  onChange={(e) => setLibraryModelName(e.target.value)}
                  placeholder="Nome do modelo"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={libraryModelDescription}
                  onChange={(e) => setLibraryModelDescription(e.target.value)}
                  placeholder="Descrição do modelo"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={libraryModelCategory} onValueChange={(v) => setLibraryModelCategory(v as typeof libraryModelCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anatomia">Anatomia</SelectItem>
                    <SelectItem value="escaneamento">Escaneamento</SelectItem>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="prótese">Prótese</SelectItem>
                    <SelectItem value="implante">Implante</SelectItem>
                    <SelectItem value="ortodontia">Ortodontia</SelectItem>
                    <SelectItem value="educacional">Educacional</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {libraryUploadFile && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Arquivo:</strong> {libraryUploadFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tamanho:</strong> {(libraryUploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setUploadToLibraryDialogOpen(false);
                setLibraryUploadFile(null);
                setLibraryModelName('');
                setLibraryModelDescription('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveToLibraryDirect} disabled={!libraryModelName}>
                Adicionar à Biblioteca
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

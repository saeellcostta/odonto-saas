import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { 
  Brain, Upload, Image, FileText, Clock, CheckCircle,
  Plus, Eye, Loader2, Camera, Link as LinkIcon, RefreshCw,
  BookOpen, AlertCircle
} from "lucide-react";

export default function AnaliseIA() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newAnalysis, setNewAnalysis] = useState({
    patientId: 0,
    imageUrl: "",
    imageType: "panoramic" as const,
  });

  const { data: analyses, refetch } = trpc.aiAnalysis.list.useQuery(undefined, {
    refetchInterval: 5000, // Polling a cada 5 segundos para atualizar status
  });
  const { data: patients } = trpc.patients.list.useQuery();

  const uploadMutation = trpc.upload.file.useMutation();

  const createMutation = trpc.aiAnalysis.create.useMutation({
    onSuccess: () => {
      toast.success("Análise enviada! A IA está processando a imagem...", {
        description: "Isso pode levar alguns segundos. A página será atualizada automaticamente.",
        duration: 5000,
      });
      setIsDialogOpen(false);
      refetch();
      setNewAnalysis({ patientId: 0, imageUrl: "", imageType: "panoramic" });
      setPreviewUrl(null);
    },
    onError: (error) => {
      const errorMsg = error.message || "Erro ao criar análise";
      console.error("Erro ao criar análise:", error);
      toast.error(errorMsg);
    },
  });

  // Verificar se há análises pendentes e mostrar indicador
  const pendingAnalyses = analyses?.filter(a => !a.analyzedAt) || [];
  const hasProcessing = pendingAnalyses.length > 0;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        try {
          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64,
            contentType: file.type,
            folder: "radiografias",
          });

          setNewAnalysis({ ...newAnalysis, imageUrl: result.url });
          toast.success("Imagem carregada com sucesso!");
        } catch (error) {
          toast.error("Erro ao fazer upload da imagem");
          setPreviewUrl(null);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar a imagem");
      setIsUploading(false);
    }
  };

  const handleCreate = () => {
    if (!newAnalysis.patientId || !newAnalysis.imageUrl) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(newAnalysis);
  };

  const getStatusBadge = (analysis: any) => {
    if (analysis.analyzedAt) {
      return <Badge className="bg-green-100 text-green-700">Analisado</Badge>;
    }
    return (
      <Badge variant="secondary" className="animate-pulse">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Processando
      </Badge>
    );
  };

  const getImageTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      panoramic: "Panorâmica",
      periapical: "Periapical",
      bitewing: "Interproximal",
      cephalometric: "Cefalométrica",
      intraoral: "Intraoral",
    };
    return types[type] || type;
  };

  const resetForm = () => {
    setNewAnalysis({ patientId: 0, imageUrl: "", imageType: "panoramic" });
    setPreviewUrl(null);
    setUploadMethod("file");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openAnalysisView = (analysis: any) => {
    setSelectedAnalysis(analysis);
    setViewDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análise de IA</h1>
            <p className="text-gray-500 mt-1">Análise inteligente de radiografias odontológicas com referências científicas</p>
          </div>
          <div className="flex items-center gap-3">
            {hasProcessing && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingAnalyses.length} em processamento
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nova Análise
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Análise de Radiografia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select onValueChange={(v) => setNewAnalysis({ ...newAnalysis, patientId: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients?.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Radiografia</Label>
                    <Select 
                      value={newAnalysis.imageType}
                      onValueChange={(v: any) => setNewAnalysis({ ...newAnalysis, imageType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="panoramic">Panorâmica</SelectItem>
                        <SelectItem value="periapical">Periapical</SelectItem>
                        <SelectItem value="bitewing">Interproximal (Bitewing)</SelectItem>
                        <SelectItem value="cephalometric">Cefalométrica</SelectItem>
                        <SelectItem value="intraoral">Intraoral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Método de Upload */}
                  <div className="space-y-2">
                    <Label>Imagem da Radiografia *</Label>
                    <Tabs value={uploadMethod} onValueChange={(v: any) => setUploadMethod(v)}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Enviar Arquivo
                        </TabsTrigger>
                        <TabsTrigger value="url" className="gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Colar URL
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="file" className="space-y-3 mt-3">
                        <div 
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isUploading ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary hover:bg-primary/5"
                          }`}
                          onClick={() => !isUploading && fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                          />
                          
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-10 w-10 text-primary animate-spin" />
                              <p className="text-sm text-gray-600">Enviando imagem...</p>
                            </div>
                          ) : previewUrl ? (
                            <div className="space-y-3">
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-h-40 mx-auto rounded-lg object-contain"
                              />
                              <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Imagem carregada com sucesso
                              </p>
                              <p className="text-xs text-gray-500">Clique para selecionar outra imagem</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-3 bg-gray-100 rounded-full">
                                <Camera className="h-8 w-8 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  Clique para selecionar uma imagem
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  ou arraste e solte aqui
                                </p>
                              </div>
                              <p className="text-xs text-gray-400">
                                PNG, JPG ou JPEG (máx. 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-3 mt-3">
                        <Input
                          value={newAnalysis.imageUrl}
                          onChange={(e) => {
                            setNewAnalysis({ ...newAnalysis, imageUrl: e.target.value });
                            setPreviewUrl(e.target.value);
                          }}
                          placeholder="https://exemplo.com/radiografia.jpg"
                        />
                        <p className="text-xs text-gray-500">Cole a URL da imagem da radiografia</p>
                        
                        {newAnalysis.imageUrl && uploadMethod === "url" && (
                          <div className="border rounded-lg p-3">
                            <img 
                              src={newAnalysis.imageUrl} 
                              alt="Preview" 
                              className="max-h-40 mx-auto rounded-lg object-contain"
                              onError={() => toast.error("Não foi possível carregar a imagem da URL")}
                            />
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreate} 
                      className="bg-primary hover:bg-primary/90"
                      disabled={!newAnalysis.patientId || !newAnalysis.imageUrl || isUploading}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar para Análise"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Brain className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Inteligência Artificial para Diagnóstico</h3>
                <p className="text-gray-600 mt-1">
                  Nossa IA analisa radiografias odontológicas utilizando modelos avançados de visão computacional 
                  e conhecimento baseado em literatura científica de periódicos como Journal of Dental Research, 
                  Journal of Endodontics e Dentomaxillofacial Radiology.
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-orange-700">
                    <BookOpen className="h-4 w-4" />
                    Referências científicas incluídas
                  </div>
                  <div className="flex items-center gap-1 text-orange-700">
                    <AlertCircle className="h-4 w-4" />
                    Auxílio ao diagnóstico profissional
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Análises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      Nenhuma análise realizada
                      <p className="text-sm mt-2">Clique em "Nova Análise" para enviar uma radiografia</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  analyses?.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell>#{analysis.id}</TableCell>
                      <TableCell className="font-medium">
                        {patients?.find(p => p.id === analysis.patientId)?.name || `#${analysis.patientId}`}
                      </TableCell>
                      <TableCell>{getImageTypeLabel(analysis.imageType || "")}</TableCell>
                      <TableCell>
                        {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(analysis)}</TableCell>
                      <TableCell>
                        {analysis.confidence ? `${Number(analysis.confidence).toFixed(0)}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1"
                          onClick={() => openAnalysisView(analysis)}
                          disabled={!analysis.analyzedAt}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Analysis Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Resultado da Análise #{selectedAnalysis?.id}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pt-4 pr-4">
                {/* Imagem */}
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedAnalysis?.imageUrl} 
                    alt="Radiografia" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Info do Paciente */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">Paciente</Label>
                    <p className="font-medium">
                      {patients?.find(p => p.id === selectedAnalysis?.patientId)?.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Tipo de Imagem</Label>
                    <p className="font-medium">{getImageTypeLabel(selectedAnalysis?.imageType || "")}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Confiança</Label>
                    <p className="font-medium">{selectedAnalysis?.confidence ? `${Number(selectedAnalysis.confidence).toFixed(0)}%` : "-"}</p>
                  </div>
                </div>

                {/* Resultado da Análise */}
                {selectedAnalysis?.analysisResult ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-500 text-xs mb-2 block">Análise Completa</Label>
                      <div className="p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none">
                        <Streamdown>{selectedAnalysis.analysisResult}</Streamdown>
                      </div>
                    </div>
                  </div>
                ) : selectedAnalysis?.findings ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-500 text-xs mb-2 block">Achados</Label>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Streamdown>{selectedAnalysis.findings}</Streamdown>
                      </div>
                    </div>
                    {selectedAnalysis?.recommendations && (
                      <div>
                        <Label className="text-gray-500 text-xs mb-2 block">Recomendações</Label>
                        <div className="p-4 bg-blue-50 rounded-lg text-blue-800">
                          <Streamdown>{selectedAnalysis.recommendations}</Streamdown>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p>Análise em processamento...</p>
                  </div>
                )}

                {/* Aviso */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Aviso Importante</p>
                      <p className="mt-1">
                        Esta análise é uma ferramenta de auxílio ao diagnóstico e não substitui a avaliação 
                        de um profissional qualificado. O diagnóstico final deve ser realizado por um 
                        cirurgião-dentista considerando o histórico clínico completo do paciente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Bell, 
  Calendar, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Plus,
  MessageSquare,
  Send,
  History,
  FileText
} from "lucide-react";

// Ícone do WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ReturnAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [contactNotes, setContactNotes] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedPatientForWhatsapp, setSelectedPatientForWhatsapp] = useState<{
    alertId: number;
    patientId: number;
    patientName: string;
    phone: string;
    treatmentType: string;
    returnDueDate: string;
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [newSetting, setNewSetting] = useState({
    treatmentType: "",
    returnPeriodDays: 180,
    reminderDaysBefore: 7
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    message: "",
    isDefault: false
  });

  const { data: alerts, refetch: refetchAlerts } = trpc.returnAlerts.list.useQuery();
  const { data: pendingAlerts } = trpc.returnAlerts.getPending.useQuery();
  const { data: settings, refetch: refetchSettings } = trpc.returnAlerts.getSettings.useQuery();
  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: templates, refetch: refetchTemplates } = trpc.reminderTemplates.list.useQuery();
  const { data: whatsappHistory, refetch: refetchHistory } = trpc.returnAlerts.getWhatsappHistory.useQuery({});
  const { data: whatsappStats } = trpc.returnAlerts.getWhatsappStats.useQuery({});

  const updateStatusMutation = trpc.returnAlerts.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetchAlerts();
    }
  });

  const registerContactMutation = trpc.returnAlerts.registerContact.useMutation({
    onSuccess: () => {
      toast.success("Contato registrado!");
      setContactNotes("");
      setSelectedAlert(null);
      refetchAlerts();
    }
  });

  const saveSettingMutation = trpc.returnAlerts.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva!");
      setNewSetting({ treatmentType: "", returnPeriodDays: 180, reminderDaysBefore: 7 });
      refetchSettings();
    }
  });

  const generateAlertsMutation = trpc.returnAlerts.generateFromAppointments.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.created} alertas gerados!`);
      refetchAlerts();
    }
  });

  const sendWhatsappMutation = trpc.returnAlerts.sendWhatsappReminder.useMutation({
    onSuccess: () => {
      toast.success("Lembrete enviado via WhatsApp!");
      setShowWhatsappDialog(false);
      setSelectedPatientForWhatsapp(null);
      setCustomMessage("");
      setSelectedTemplate("");
      refetchAlerts();
      refetchHistory();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    }
  });

  const createTemplateMutation = trpc.reminderTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado!");
      setNewTemplate({ name: "", message: "", isDefault: false });
      refetchTemplates();
    }
  });

  const deleteTemplateMutation = trpc.reminderTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template removido!");
      refetchTemplates();
    }
  });

  const getPatientName = (patientId: number) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient?.name || `Paciente #${patientId}`;
  };

  const getPatientPhone = (patientId: number) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient?.whatsapp || patient?.phone || "";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "contacted": return <Badge variant="outline" className="bg-blue-100 text-blue-800">Contatado</Badge>;
      case "scheduled": return <Badge variant="outline" className="bg-green-100 text-green-800">Agendado</Badge>;
      case "completed": return <Badge variant="outline" className="bg-gray-100 text-gray-800">Concluído</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openWhatsappDialog = (alert: any) => {
    const phone = getPatientPhone(alert.patientId);
    setSelectedPatientForWhatsapp({
      alertId: alert.id,
      patientId: alert.patientId,
      patientName: getPatientName(alert.patientId),
      phone: phone,
      treatmentType: alert.treatmentType || "Retorno geral",
      returnDueDate: new Date(alert.returnDueDate).toLocaleDateString('pt-BR')
    });
    
    // Pré-preencher com template padrão se existir
    const defaultTemplate = templates?.find(t => t.isDefault);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate.name);
      setCustomMessage(formatMessage(defaultTemplate.message, {
        patientName: getPatientName(alert.patientId),
        treatmentType: alert.treatmentType || "Retorno geral",
        returnDueDate: new Date(alert.returnDueDate).toLocaleDateString('pt-BR')
      }));
    }
    
    setShowWhatsappDialog(true);
  };

  const formatMessage = (template: string, data: { patientName: string; treatmentType: string; returnDueDate: string }) => {
    return template
      .replace(/\{nome\}/g, data.patientName)
      .replace(/\{tratamento\}/g, data.treatmentType)
      .replace(/\{data_retorno\}/g, data.returnDueDate);
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = templates?.find(t => t.name === templateName);
    if (template && selectedPatientForWhatsapp) {
      setCustomMessage(formatMessage(template.message, {
        patientName: selectedPatientForWhatsapp.patientName,
        treatmentType: selectedPatientForWhatsapp.treatmentType,
        returnDueDate: selectedPatientForWhatsapp.returnDueDate
      }));
    }
  };

  const sendWhatsappMessage = () => {
    if (!selectedPatientForWhatsapp || !customMessage) {
      toast.error("Preencha todos os campos");
      return;
    }

    const phone = selectedPatientForWhatsapp.phone.replace(/\D/g, '');
    if (!phone) {
      toast.error("Paciente não possui telefone cadastrado");
      return;
    }

    // Registrar no sistema
    sendWhatsappMutation.mutate({
      alertId: selectedPatientForWhatsapp.alertId,
      patientId: selectedPatientForWhatsapp.patientId,
      phoneNumber: phone,
      templateName: selectedTemplate || "Personalizado",
      messageContent: customMessage
    });

    // Abrir WhatsApp Web com a mensagem
    const encodedMessage = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Templates padrão sugeridos
  const defaultTemplates = [
    {
      name: "Lembrete Padrão",
      message: "Olá {nome}! 👋\n\nEsperamos que esteja bem! Este é um lembrete carinhoso da Dentrics.\n\nSeu retorno para {tratamento} está previsto para {data_retorno}.\n\nPor favor, entre em contato conosco para agendar sua consulta.\n\n📞 Aguardamos seu contato!\n\nEquipe Dentrics"
    },
    {
      name: "Lembrete Urgente",
      message: "Olá {nome}! ⚠️\n\nNotamos que seu retorno para {tratamento} está atrasado (previsto para {data_retorno}).\n\nÉ muito importante manter a regularidade do seu tratamento para garantir os melhores resultados.\n\nPor favor, entre em contato conosco o mais breve possível.\n\n📞 Estamos à disposição!\n\nEquipe Dentrics"
    },
    {
      name: "Lembrete Amigável",
      message: "Oi {nome}! 😊\n\nTudo bem? Passando para lembrar que está na hora do seu retorno!\n\nTratamento: {tratamento}\nData prevista: {data_retorno}\n\nQue tal agendar sua consulta? Estamos com horários disponíveis!\n\n✨ Até breve!\n\nEquipe Dentrics"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Alertas de Retorno</h1>
            <p className="text-muted-foreground">Gerencie os lembretes de retorno dos pacientes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
            <Button variant="outline" onClick={() => setShowTemplatesDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button onClick={() => generateAlertsMutation.mutate()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Alertas
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingAlerts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {alerts?.filter(a => a.priority === "urgent").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Urgentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {alerts?.filter(a => a.status === "contacted").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Contatados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {alerts?.filter(a => a.status === "scheduled").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Agendados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <WhatsAppIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{whatsappStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">WhatsApp Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de alertas */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="contacted">Contatados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Pendentes</CardTitle>
                <CardDescription>Pacientes que precisam ser contatados para retorno</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAlerts && pendingAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${getPriorityColor(alert.priority)}`} />
                          <div>
                            <p className="font-medium">{getPatientName(alert.patientId)}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.treatmentType || "Retorno geral"} • 
                              Vencimento: {new Date(alert.returnDueDate).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {alert.daysUntilReturn < 0 
                                ? `${Math.abs(alert.daysUntilReturn)} dias atrasado`
                                : `${alert.daysUntilReturn} dias restantes`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* Botão WhatsApp */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                            onClick={() => openWhatsappDialog(alert)}
                          >
                            <WhatsAppIcon className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert.id)}>
                                <Phone className="h-4 w-4 mr-1" />
                                Registrar Contato
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Registrar Contato</DialogTitle>
                                <DialogDescription>
                                  Registre a tentativa de contato com o paciente
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Observações</Label>
                                  <Textarea
                                    placeholder="Ex: Ligou, paciente vai retornar na próxima semana..."
                                    value={contactNotes}
                                    onChange={(e) => setContactNotes(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={() => {
                                    if (selectedAlert) {
                                      registerContactMutation.mutate({
                                        id: selectedAlert,
                                        notes: contactNotes
                                      });
                                    }
                                  }}
                                >
                                  Salvar Contato
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: alert.id, status: "scheduled" })}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Marcar Agendado
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum alerta pendente</p>
                    <p className="text-sm">Clique em "Gerar Alertas" para verificar pacientes com retorno próximo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacted" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pacientes Contatados</CardTitle>
                <CardDescription>Aguardando confirmação de agendamento</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts?.filter(a => a.status === "contacted").map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{getPatientName(alert.patientId)}</p>
                      <p className="text-sm text-muted-foreground">
                        Tentativas: {alert.contactAttempts} • 
                        Último contato: {alert.lastContactDate ? new Date(alert.lastContactDate).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                      {alert.lastContactNotes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {alert.lastContactNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                        onClick={() => openWhatsappDialog(alert)}
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-1" />
                        Reenviar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: alert.id, status: "scheduled" })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Agendado
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: alert.id, status: "cancelled" })}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-center py-8 text-muted-foreground">Nenhum paciente contatado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts?.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-8 rounded-full ${getPriorityColor(alert.priority)}`} />
                        <div>
                          <p className="font-medium">{getPatientName(alert.patientId)}</p>
                          <p className="text-sm text-muted-foreground">{alert.treatmentType || "Retorno geral"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.status)}
                        {alert.status !== "completed" && alert.status !== "cancelled" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-emerald-600"
                            onClick={() => openWhatsappDialog(alert)}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-center py-8 text-muted-foreground">Nenhum alerta cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Envio WhatsApp */}
        <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <WhatsAppIcon className="h-5 w-5 text-emerald-600" />
                Enviar Lembrete via WhatsApp
              </DialogTitle>
              <DialogDescription>
                Envie um lembrete de retorno para o paciente
              </DialogDescription>
            </DialogHeader>
            
            {selectedPatientForWhatsapp && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedPatientForWhatsapp.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatientForWhatsapp.treatmentType} • Retorno: {selectedPatientForWhatsapp.returnDueDate}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    📱 {selectedPatientForWhatsapp.phone || "Sem telefone cadastrado"}
                  </p>
                </div>

                <div>
                  <Label>Template de Mensagem</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name} {template.isDefault && "⭐"}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Mensagem Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    className="min-h-[150px]"
                    placeholder="Digite sua mensagem..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {"{nome}"}, {"{tratamento}"} e {"{data_retorno}"} para personalizar
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowWhatsappDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={sendWhatsappMessage}
                    disabled={!customMessage || !selectedPatientForWhatsapp.phone}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Templates */}
        <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Templates de Mensagem</DialogTitle>
              <DialogDescription>
                Gerencie os templates de mensagem para lembretes de retorno
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Templates existentes */}
              <div className="space-y-2">
                <h4 className="font-medium">Templates Salvos</h4>
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {template.name} {template.isDefault && <Badge variant="secondary" className="ml-2">Padrão</Badge>}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">
                            {template.message}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteTemplateMutation.mutate({ id: template.id })}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhum template cadastrado</p>
                    <p className="text-sm">Adicione templates abaixo ou use os sugeridos</p>
                  </div>
                )}
              </div>

              {/* Templates sugeridos */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">Templates Sugeridos</h4>
                <div className="grid gap-2">
                  {defaultTemplates.map((template, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">
                            {template.message}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => createTemplateMutation.mutate({
                            name: template.name,
                            message: template.message,
                            isDefault: index === 0
                          })}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Usar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Criar novo template */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Criar Novo Template</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Nome do Template</Label>
                    <Input
                      placeholder="Ex: Lembrete Especial"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea
                      className="min-h-[100px]"
                      placeholder="Digite a mensagem do template..."
                      value={newTemplate.message}
                      onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variáveis disponíveis: {"{nome}"}, {"{tratamento}"}, {"{data_retorno}"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newTemplate.isDefault}
                      onChange={(e) => setNewTemplate({ ...newTemplate, isDefault: e.target.checked })}
                    />
                    <Label htmlFor="isDefault">Definir como padrão</Label>
                  </div>
                  <Button 
                    onClick={() => createTemplateMutation.mutate(newTemplate)}
                    disabled={!newTemplate.name || !newTemplate.message}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Template
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de Envios WhatsApp</DialogTitle>
              <DialogDescription>
                Visualize todos os lembretes enviados via WhatsApp
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{whatsappStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{whatsappStats?.sent || 0}</p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{whatsappStats?.delivered || 0}</p>
                  <p className="text-xs text-muted-foreground">Entregues</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{whatsappStats?.failed || 0}</p>
                  <p className="text-xs text-muted-foreground">Falhas</p>
                </div>
              </div>

              {/* Lista de envios */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {whatsappHistory && whatsappHistory.length > 0 ? (
                  whatsappHistory.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{getPatientName(item.patientId)}</p>
                          <p className="text-sm text-muted-foreground">
                            📱 {item.phoneNumber} • {item.messageTemplate}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.sentAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={item.status === "sent" ? "default" : item.status === "failed" ? "destructive" : "secondary"}>
                          {item.status === "sent" ? "Enviado" : item.status === "delivered" ? "Entregue" : item.status === "read" ? "Lido" : "Falhou"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Nenhum envio registrado</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Configurações */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configurações de Retorno</DialogTitle>
              <DialogDescription>
                Configure os períodos de retorno para cada tipo de tratamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Lista de configurações existentes */}
              <div className="space-y-2">
                <h4 className="font-medium">Configurações Atuais</h4>
                {settings && settings.length > 0 ? (
                  settings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{setting.treatmentType}</p>
                        <p className="text-sm text-muted-foreground">
                          Retorno em {setting.returnPeriodDays} dias • 
                          Lembrete {setting.reminderDaysBefore} dias antes
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhuma configuração cadastrada</p>
                )}
              </div>

              {/* Adicionar nova configuração */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Adicionar Configuração</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de Tratamento</Label>
                    <Input
                      placeholder="Ex: Limpeza"
                      value={newSetting.treatmentType}
                      onChange={(e) => setNewSetting({ ...newSetting, treatmentType: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Período de Retorno (dias)</Label>
                    <Input
                      type="number"
                      value={newSetting.returnPeriodDays}
                      onChange={(e) => setNewSetting({ ...newSetting, returnPeriodDays: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Lembrete (dias antes)</Label>
                    <Input
                      type="number"
                      value={newSetting.reminderDaysBefore}
                      onChange={(e) => setNewSetting({ ...newSetting, reminderDaysBefore: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => saveSettingMutation.mutate(newSetting)}
                  disabled={!newSetting.treatmentType}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

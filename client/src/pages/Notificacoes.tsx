import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  MessageSquare, Send, Clock, CheckCircle, XCircle, 
  Settings, Bell, Plus, Phone
} from "lucide-react";

export default function Notificacoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    phone: "",
    type: "custom" as const,
    message: "",
  });

  const { data: notifications, refetch } = trpc.whatsapp.list.useQuery();
  const { data: settings, refetch: refetchSettings } = trpc.notificationSettings.get.useQuery();
  const { data: patients } = trpc.patients.list.useQuery();

  const createMutation = trpc.whatsapp.create.useMutation({
    onSuccess: () => {
      toast.success("Notificação criada com sucesso!");
      setIsDialogOpen(false);
      refetch();
      setNewNotification({ phone: "", type: "custom", message: "" });
    },
    onError: () => toast.error("Erro ao criar notificação"),
  });

  const saveSettingsMutation = trpc.notificationSettings.save.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas!");
      refetchSettings();
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  const handleCreate = () => {
    if (!newNotification.phone || !newNotification.message) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(newNotification);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pendente" },
      sent: { color: "bg-blue-100 text-blue-700", label: "Enviado" },
      delivered: { color: "bg-green-100 text-green-700", label: "Entregue" },
      read: { color: "bg-teal-100 text-teal-700", label: "Lido" },
      failed: { color: "bg-red-100 text-red-700", label: "Falhou" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      appointment_reminder: "Lembrete de Consulta",
      queue_call: "Chamada na Fila",
      confirmation: "Confirmação",
      followup: "Acompanhamento",
      custom: "Personalizado",
    };
    return types[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificações WhatsApp</h1>
            <p className="text-gray-500 mt-1">Gerencie lembretes e mensagens automáticas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Mensagem WhatsApp</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input
                    value={newNotification.phone}
                    onChange={(e) => setNewNotification({ ...newNotification, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={newNotification.type}
                    onValueChange={(v: any) => setNewNotification({ ...newNotification, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment_reminder">Lembrete de Consulta</SelectItem>
                      <SelectItem value="queue_call">Chamada na Fila</SelectItem>
                      <SelectItem value="confirmation">Confirmação</SelectItem>
                      <SelectItem value="followup">Acompanhamento</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Digite a mensagem..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Histórico de Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          Nenhuma mensagem enviada
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications?.map((notif) => (
                        <TableRow key={notif.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-600" />
                              {notif.phone}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeLabel(notif.type || "custom")}</TableCell>
                          <TableCell className="max-w-xs truncate">{notif.message}</TableCell>
                          <TableCell>{getStatusBadge(notif.status || "pending")}</TableCell>
                          <TableCell>
                            {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações Automáticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Lembrete de Consulta</p>
                      <p className="text-sm text-gray-500">Enviar lembrete antes da consulta</p>
                    </div>
                    <Switch 
                      checked={settings?.appointmentReminderEnabled ?? true}
                      onCheckedChange={(checked) => saveSettingsMutation.mutate({ appointmentReminderEnabled: checked })}
                    />
                  </div>
                  {settings?.appointmentReminderEnabled && (
                    <div className="ml-4 space-y-2">
                      <Label>Horas antes da consulta</Label>
                      <Select 
                        value={String(settings?.reminderHoursBefore ?? 24)}
                        onValueChange={(v) => saveSettingsMutation.mutate({ reminderHoursBefore: Number(v) })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hora</SelectItem>
                          <SelectItem value="2">2 horas</SelectItem>
                          <SelectItem value="12">12 horas</SelectItem>
                          <SelectItem value="24">24 horas</SelectItem>
                          <SelectItem value="48">48 horas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Chamada na Fila</p>
                      <p className="text-sm text-gray-500">Avisar quando for chamado</p>
                    </div>
                    <Switch 
                      checked={settings?.queueCallEnabled ?? true}
                      onCheckedChange={(checked) => saveSettingsMutation.mutate({ queueCallEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Confirmação de Agendamento</p>
                      <p className="text-sm text-gray-500">Enviar confirmação ao agendar</p>
                    </div>
                    <Switch 
                      checked={settings?.confirmationEnabled ?? true}
                      onCheckedChange={(checked) => saveSettingsMutation.mutate({ confirmationEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Acompanhamento Pós-Consulta</p>
                      <p className="text-sm text-gray-500">Enviar mensagem após a consulta</p>
                    </div>
                    <Switch 
                      checked={settings?.followupEnabled ?? false}
                      onCheckedChange={(checked) => saveSettingsMutation.mutate({ followupEnabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuração da API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Para enviar mensagens via WhatsApp, você precisa configurar 
                      a API do WhatsApp Business. Entre em contato com o suporte para mais informações.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Phone ID</Label>
                    <Input
                      value={settings?.whatsappPhoneId || ""}
                      onChange={(e) => saveSettingsMutation.mutate({ whatsappPhoneId: e.target.value })}
                      placeholder="ID do telefone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={settings?.whatsappApiKey || ""}
                      onChange={(e) => saveSettingsMutation.mutate({ whatsappApiKey: e.target.value })}
                      placeholder="Chave da API"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

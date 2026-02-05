import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Package, Clock, CheckCircle, DollarSign, Building2, 
  Plus, Pencil, Trash2, Users
} from "lucide-react";

export default function Proteses() {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isLabDialogOpen, setIsLabDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    patientId: 0,
    laboratoryId: 0,
    prosthesisTypeId: 0,
    toothNumber: "",
    color: "",
    material: "",
    price: "",
    labCost: "",
    notes: "",
  });

  const [newLab, setNewLab] = useState({ name: "", phone: "", email: "", address: "", contactPerson: "" });
  const [newType, setNewType] = useState({ name: "", description: "", defaultPrice: "", estimatedDays: 7 });

  const { data: stats } = trpc.prosthesisOrders.stats.useQuery();
  const { data: orders, refetch: refetchOrders } = trpc.prosthesisOrders.list.useQuery();
  const { data: laboratories, refetch: refetchLabs } = trpc.laboratories.list.useQuery();
  const { data: types, refetch: refetchTypes } = trpc.prosthesisTypes.list.useQuery();
  const { data: patients } = trpc.patients.list.useQuery();

  const createOrderMutation = trpc.prosthesisOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Pedido criado!");
      setIsOrderDialogOpen(false);
      refetchOrders();
    },
    onError: () => toast.error("Erro ao criar pedido"),
  });

  const updateOrderMutation = trpc.prosthesisOrders.update.useMutation({
    onSuccess: () => {
      toast.success("Pedido atualizado!");
      refetchOrders();
    },
    onError: () => toast.error("Erro ao atualizar pedido"),
  });

  const createLabMutation = trpc.laboratories.create.useMutation({
    onSuccess: () => {
      toast.success("Laboratório cadastrado!");
      setIsLabDialogOpen(false);
      refetchLabs();
      setNewLab({ name: "", phone: "", email: "", address: "", contactPerson: "" });
    },
    onError: () => toast.error("Erro ao cadastrar laboratório"),
  });

  const deleteLabMutation = trpc.laboratories.delete.useMutation({
    onSuccess: () => {
      toast.success("Laboratório removido!");
      refetchLabs();
    },
  });

  const createTypeMutation = trpc.prosthesisTypes.create.useMutation({
    onSuccess: () => {
      toast.success("Tipo cadastrado!");
      setIsTypeDialogOpen(false);
      refetchTypes();
      setNewType({ name: "", description: "", defaultPrice: "", estimatedDays: 7 });
    },
    onError: () => toast.error("Erro ao cadastrar tipo"),
  });

  const deleteTypeMutation = trpc.prosthesisTypes.delete.useMutation({
    onSuccess: () => {
      toast.success("Tipo removido!");
      refetchTypes();
    },
  });

  const handleCreateOrder = () => {
    if (!newOrder.patientId) {
      toast.error("Selecione um paciente");
      return;
    }
    createOrderMutation.mutate({
      ...newOrder,
      orderDate: new Date().toISOString().split('T')[0],
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      sent_to_lab: { label: "Enviado ao Lab", variant: "outline" },
      in_production: { label: "Em Produção", variant: "default" },
      ready: { label: "Pronto", variant: "default" },
      delivered: { label: "Entregue", variant: "default" },
      installed: { label: "Instalado", variant: "default" },
    };
    const s = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const statsCards = [
    { title: "Em Andamento", value: (stats?.pending ?? 0) + (stats?.sentToLab ?? 0) + (stats?.inProduction ?? 0), icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Finalizados", value: stats?.installed ?? 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
    { title: "Custo Lab", value: `R$ ${Number(stats?.labCost ?? 0).toFixed(2)}`, icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Faturamento", value: `R$ ${Number(stats?.revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-teal-500", bg: "bg-teal-50" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Próteses</h1>
            <p className="text-gray-500 mt-1">Gestão completa de trabalhos protéticos</p>
          </div>
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Pedido de Prótese</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select onValueChange={(v) => setNewOrder({ ...newOrder, patientId: Number(v) })}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Laboratório</Label>
                    <Select onValueChange={(v) => setNewOrder({ ...newOrder, laboratoryId: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {laboratories?.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Prótese</Label>
                    <Select onValueChange={(v) => setNewOrder({ ...newOrder, prosthesisTypeId: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {types?.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Dente(s)</Label>
                    <Input
                      value={newOrder.toothNumber}
                      onChange={(e) => setNewOrder({ ...newOrder, toothNumber: e.target.value })}
                      placeholder="Ex: 11, 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <Input
                      value={newOrder.color}
                      onChange={(e) => setNewOrder({ ...newOrder, color: e.target.value })}
                      placeholder="Ex: A2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Input
                      value={newOrder.material}
                      onChange={(e) => setNewOrder({ ...newOrder, material: e.target.value })}
                      placeholder="Ex: Zircônia"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      value={newOrder.price}
                      onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custo Lab (R$)</Label>
                    <Input
                      type="number"
                      value={newOrder.labCost}
                      onChange={(e) => setNewOrder({ ...newOrder, labCost: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateOrder} className="bg-teal-600 hover:bg-teal-700">Criar Pedido</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className={`${stat.bg} border-none`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="queue">Fila de Atendimento</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="laboratories">Laboratórios</TabsTrigger>
                <TabsTrigger value="types">Tipos de Prótese</TabsTrigger>
              </TabsList>

              <TabsContent value="queue">
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhum paciente na fila de prótese</p>
                  <p className="text-sm">Quando o atendente adicionar pacientes à fila de prótese, eles aparecerão aqui</p>
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Dente(s)</TableHead>
                      <TableHead>Laboratório</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          Nenhum pedido de prótese
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{patients?.find(p => p.id === order.patientId)?.name || `#${order.patientId}`}</TableCell>
                          <TableCell>{types?.find(t => t.id === order.prosthesisTypeId)?.name || "-"}</TableCell>
                          <TableCell>{order.toothNumber || "-"}</TableCell>
                          <TableCell>{laboratories?.find(l => l.id === order.laboratoryId)?.name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(order.status || "pending")}</TableCell>
                          <TableCell>R$ {Number(order.price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={order.status || "pending"}
                              onValueChange={(v) => updateOrderMutation.mutate({ id: order.id, data: { status: v as any } })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="sent_to_lab">Enviado</SelectItem>
                                <SelectItem value="in_production">Produção</SelectItem>
                                <SelectItem value="ready">Pronto</SelectItem>
                                <SelectItem value="delivered">Entregue</SelectItem>
                                <SelectItem value="installed">Instalado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="laboratories">
                <div className="flex justify-end mb-4">
                  <Dialog open={isLabDialogOpen} onOpenChange={setIsLabDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Laboratório
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Laboratório</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input value={newLab.name} onChange={(e) => setNewLab({ ...newLab, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input value={newLab.phone} onChange={(e) => setNewLab({ ...newLab, phone: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={newLab.email} onChange={(e) => setNewLab({ ...newLab, email: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Contato</Label>
                          <Input value={newLab.contactPerson} onChange={(e) => setNewLab({ ...newLab, contactPerson: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Endereço</Label>
                          <Input value={newLab.address} onChange={(e) => setNewLab({ ...newLab, address: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsLabDialogOpen(false)}>Cancelar</Button>
                          <Button onClick={() => createLabMutation.mutate(newLab)} className="bg-teal-600 hover:bg-teal-700">Salvar</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laboratories?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          Nenhum laboratório cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      laboratories?.map((lab) => (
                        <TableRow key={lab.id}>
                          <TableCell className="font-medium">{lab.name}</TableCell>
                          <TableCell>{lab.phone || "-"}</TableCell>
                          <TableCell>{lab.email || "-"}</TableCell>
                          <TableCell>{lab.contactPerson || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => deleteLabMutation.mutate({ id: lab.id })}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="types">
                <div className="flex justify-end mb-4">
                  <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Tipo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Tipo de Prótese</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input value={newType.description} onChange={(e) => setNewType({ ...newType, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Preço Padrão (R$)</Label>
                            <Input type="number" value={newType.defaultPrice} onChange={(e) => setNewType({ ...newType, defaultPrice: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Dias Estimados</Label>
                            <Input type="number" value={newType.estimatedDays} onChange={(e) => setNewType({ ...newType, estimatedDays: Number(e.target.value) })} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>Cancelar</Button>
                          <Button onClick={() => createTypeMutation.mutate(newType)} className="bg-teal-600 hover:bg-teal-700">Salvar</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Preço Padrão</TableHead>
                      <TableHead>Dias Estimados</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          Nenhum tipo cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      types?.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell>{type.description || "-"}</TableCell>
                          <TableCell>R$ {Number(type.defaultPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>{type.estimatedDays} dias</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => deleteTypeMutation.mutate({ id: type.id })}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

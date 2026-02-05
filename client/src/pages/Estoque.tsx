import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Package, ArrowUp, ArrowDown, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Clock, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StockItemFormData = {
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  costPrice: string;
  supplier: string;
  expirationDate: string;
};

const initialFormData: StockItemFormData = {
  name: "",
  quantity: 0,
  minQuantity: 10,
  unit: "un",
  costPrice: "",
  supplier: "",
  expirationDate: "",
};

type MovementFormData = {
  stockItemId: number;
  type: "in" | "out";
  quantity: number;
  reason: string;
};

export default function Estoque() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [formData, setFormData] = useState<StockItemFormData>(initialFormData);
  const [movementData, setMovementData] = useState<MovementFormData>({
    stockItemId: 0,
    type: "in",
    quantity: 1,
    reason: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const [activeTab, setActiveTab] = useState("items");
  
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.stock.items.useQuery({ search: search || undefined });
  const { data: summary, isLoading: summaryLoading } = trpc.stock.summary.useQuery();
  const { data: movements, isLoading: movementsLoading } = trpc.stock.movements.useQuery({ limit: 50 });

  const createMutation = trpc.stock.createItem.useMutation({
    onSuccess: () => {
      toast.success("Item cadastrado com sucesso!");
      utils.stock.items.invalidate();
      utils.stock.summary.invalidate();
      utils.stock.movements.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar item: " + error.message);
    },
  });

  const updateMutation = trpc.stock.updateItem.useMutation({
    onSuccess: () => {
      toast.success("Item atualizado com sucesso!");
      utils.stock.items.invalidate();
      utils.stock.summary.invalidate();
      utils.stock.movements.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });

  const deleteMutation = trpc.stock.deleteItem.useMutation({
    onSuccess: () => {
      toast.success("Item excluído com sucesso!");
      utils.stock.items.invalidate();
      utils.stock.summary.invalidate();
      utils.stock.movements.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir item: " + error.message);
    },
  });

  const movementMutation = trpc.stock.addMovement.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada!");
      utils.stock.items.invalidate();
      utils.stock.summary.invalidate();
      utils.stock.movements.invalidate();
      utils.dashboard.stats.invalidate();
      setIsMovementDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao registrar movimentação: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedItem(null);
  };

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name || "",
      quantity: item.quantity || 0,
      minQuantity: item.minQuantity || 10,
      unit: item.unit || "un",
      costPrice: item.costPrice || "",
      supplier: item.supplier || "",
      expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split("T")[0] : "",
    });
    setSelectedItem(item.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleOpenMovement = (itemId: number, type: "in" | "out") => {
    setMovementData({
      stockItemId: itemId,
      type,
      quantity: 1,
      reason: "",
    });
    setIsMovementDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const data = {
      ...formData,
      costPrice: formData.costPrice || undefined,
      expirationDate: formData.expirationDate || undefined,
    };

    if (isEditing && selectedItem) {
      updateMutation.mutate({ id: selectedItem, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    movementMutation.mutate(movementData);
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteMutation.mutate({ id: selectedItem });
    }
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value && value !== 0) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };
  
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStockStatus = (quantity: number | null, minQuantity: number | null) => {
    const qty = quantity ?? 0;
    const min = minQuantity ?? 10;
    if (qty === 0) return { label: "Zerado", variant: "destructive" as const };
    if (qty <= min) return { label: "Baixo", variant: "secondary" as const };
    return { label: "OK", variant: "default" as const };
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">Controle de materiais e insumos</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Painel de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{summaryLoading ? "-" : summary?.totalItems ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade Total</p>
                <p className="text-2xl font-bold">{summaryLoading ? "-" : summary?.totalQuantity ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{summaryLoading ? "-" : formatCurrency(summary?.totalValue ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={(summary?.lowStockCount ?? 0) > 0 ? "border-amber-500" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${(summary?.lowStockCount ?? 0) > 0 ? "bg-amber-500/10" : "bg-gray-500/10"}`}>
                <AlertTriangle className={`h-6 w-6 ${(summary?.lowStockCount ?? 0) > 0 ? "text-amber-500" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold">{summaryLoading ? "-" : summary?.lowStockCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas: Itens e Movimentações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Itens
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
        <CardHeader>
          <CardTitle>Itens em Estoque</CardTitle>
          <CardDescription>{items?.length ?? 0} item(ns) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items && items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead className="hidden md:table-cell">Mínimo</TableHead>
                    <TableHead className="hidden lg:table-cell">Custo</TableHead>
                    <TableHead className="hidden sm:table-cell">Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const status = getStockStatus(item.quantity, item.minQuantity);
                    const isLow = (item.quantity ?? 0) <= (item.minQuantity ?? 10);
                    return (
                      <TableRow key={item.id} className={isLow ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                              isLow ? "bg-amber-500/10" : "bg-primary/10"
                            }`}>
                              {isLow ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <Package className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${isLow ? "text-amber-600" : ""}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.minQuantity} {item.unit}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatCurrency(item.costPrice)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.supplier || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenMovement(item.id, "in")}
                              title="Entrada"
                              className="text-green-600 hover:text-green-600"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenMovement(item.id, "out")}
                              title="Saída"
                              className="text-red-600 hover:text-red-600"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedItem(item.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente uma busca diferente" : "Cadastre seu primeiro item"}
              </p>
              {!search && (
                <Button onClick={handleOpenNew} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Item
                </Button>
              )}
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Movimentações */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
              <CardDescription>Registro de todas as entradas e saídas do estoque</CardDescription>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : movements && movements.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="hidden md:table-cell">Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDate(mov.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{mov.itemName}</TableCell>
                          <TableCell>
                            <Badge variant={mov.type === "in" ? "default" : "secondary"} className={mov.type === "in" ? "bg-green-500" : "bg-red-500"}>
                              <span className="flex items-center gap-1">
                                {mov.type === "in" ? (
                                  <><ArrowUp className="h-3 w-3" /> Entrada</>
                                ) : (
                                  <><ArrowDown className="h-3 w-3" /> Saída</>
                                )}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={mov.type === "in" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {mov.type === "in" ? "+" : "-"}{mov.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {mov.reason || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma movimentação registrada</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    As movimentações aparecerão aqui quando você adicionar ou retirar itens do estoque
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Item" : "Cadastrar Novo Item"}</DialogTitle>
            <DialogDescription>Preencha os dados do item</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do item"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="minQuantity">Mínimo</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="0"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unidade</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade</SelectItem>
                      <SelectItem value="cx">Caixa</SelectItem>
                      <SelectItem value="pct">Pacote</SelectItem>
                      <SelectItem value="ml">mL</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPrice">Custo Unitário</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="expirationDate">Validade</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : isEditing
                  ? "Salvar"
                  : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {movementData.type === "in" ? "Entrada de Estoque" : "Saída de Estoque"}
            </DialogTitle>
            <DialogDescription>Registre a movimentação</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="movQuantity">Quantidade</Label>
                <Input
                  id="movQuantity"
                  type="number"
                  min="1"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({ ...movementData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  value={movementData.reason}
                  onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                  placeholder="Ex: Compra, Uso em procedimento"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={movementMutation.isPending}>
                {movementMutation.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </DashboardLayout>
  );
}

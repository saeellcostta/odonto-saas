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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Syringe } from "lucide-react";

type ProcedureFormData = {
  code: string;
  name: string;
  description: string;
  pricePerTooth: string;
  priceUpperArch: string;
  priceLowerArch: string;
  duration: number;
};

const initialFormData: ProcedureFormData = {
  code: "",
  name: "",
  description: "",
  pricePerTooth: "",
  priceUpperArch: "",
  priceLowerArch: "",
  duration: 30,
};

export default function Procedimentos() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProcedureFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: procedures, isLoading } = trpc.procedures.list.useQuery({ search: search || undefined });

  const createMutation = trpc.procedures.create.useMutation({
    onSuccess: () => {
      toast.success("Procedimento cadastrado com sucesso!");
      utils.procedures.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar procedimento: " + error.message);
    },
  });

  const updateMutation = trpc.procedures.update.useMutation({
    onSuccess: () => {
      toast.success("Procedimento atualizado com sucesso!");
      utils.procedures.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar procedimento: " + error.message);
    },
  });

  const deleteMutation = trpc.procedures.delete.useMutation({
    onSuccess: () => {
      toast.success("Procedimento excluído com sucesso!");
      utils.procedures.list.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedProcedure(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir procedimento: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedProcedure(null);
  };

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (procedure: any) => {
    setFormData({
      code: procedure.code || "",
      name: procedure.name || "",
      description: procedure.description || "",
      pricePerTooth: procedure.pricePerTooth || "",
      priceUpperArch: procedure.priceUpperArch || "",
      priceLowerArch: procedure.priceLowerArch || "",
      duration: procedure.duration || 30,
    });
    setSelectedProcedure(procedure.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.pricePerTooth) {
      toast.error("Nome e preço por dente são obrigatórios");
      return;
    }

    const data = {
      ...formData,
      priceUpperArch: formData.priceUpperArch || undefined,
      priceLowerArch: formData.priceLowerArch || undefined,
    };

    if (isEditing && selectedProcedure) {
      updateMutation.mutate({ id: selectedProcedure, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (selectedProcedure) {
      deleteMutation.mutate({ id: selectedProcedure });
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie os procedimentos odontológicos</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Procedimento
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Procedimentos</CardTitle>
          <CardDescription>{procedures?.length ?? 0} procedimento(s) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : procedures && procedures.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="hidden md:table-cell">Preço/Dente</TableHead>
                    <TableHead className="hidden lg:table-cell">Arcada Sup.</TableHead>
                    <TableHead className="hidden lg:table-cell">Arcada Inf.</TableHead>
                    <TableHead className="hidden sm:table-cell">Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedures.map((procedure) => (
                    <TableRow key={procedure.id}>
                      <TableCell className="font-mono text-sm">{procedure.code || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{procedure.name}</p>
                          {procedure.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {procedure.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-medium text-primary">
                        {formatCurrency(procedure.pricePerTooth)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatCurrency(procedure.priceUpperArch)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatCurrency(procedure.priceLowerArch)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{procedure.duration} min</TableCell>
                      <TableCell>
                        <Badge variant={procedure.isActive ? "default" : "secondary"}>
                          {procedure.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(procedure)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProcedure(procedure.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Syringe className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum procedimento encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente uma busca diferente" : "Cadastre seu primeiro procedimento"}
              </p>
              {!search && (
                <Button onClick={handleOpenNew} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Procedimento
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Procedimento" : "Cadastrar Novo Procedimento"}</DialogTitle>
            <DialogDescription>Preencha os dados do procedimento</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: 001"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do procedimento"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do procedimento"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerTooth">Preço por Dente *</Label>
                  <Input
                    id="pricePerTooth"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerTooth}
                    onChange={(e) => setFormData({ ...formData, pricePerTooth: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duração (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceUpperArch">Preço Arcada Superior</Label>
                  <Input
                    id="priceUpperArch"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceUpperArch}
                    onChange={(e) => setFormData({ ...formData, priceUpperArch: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="priceLowerArch">Preço Arcada Inferior</Label>
                  <Input
                    id="priceLowerArch"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceLowerArch}
                    onChange={(e) => setFormData({ ...formData, priceLowerArch: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita.
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

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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, Phone, Mail } from "lucide-react";

type InsuranceFormData = {
  name: string;
  code: string;
  phone: string;
  email: string;
  discount: string;
};

const initialFormData: InsuranceFormData = {
  name: "",
  code: "",
  phone: "",
  email: "",
  discount: "0",
};

export default function Convenios() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<number | null>(null);
  const [formData, setFormData] = useState<InsuranceFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: insurances, isLoading } = trpc.insurances.list.useQuery();

  const createMutation = trpc.insurances.create.useMutation({
    onSuccess: () => {
      toast.success("Convênio cadastrado com sucesso!");
      utils.insurances.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar convênio: " + error.message);
    },
  });

  const updateMutation = trpc.insurances.update.useMutation({
    onSuccess: () => {
      toast.success("Convênio atualizado com sucesso!");
      utils.insurances.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar convênio: " + error.message);
    },
  });

  const deleteMutation = trpc.insurances.delete.useMutation({
    onSuccess: () => {
      toast.success("Convênio excluído com sucesso!");
      utils.insurances.list.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedInsurance(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir convênio: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedInsurance(null);
  };

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (insurance: any) => {
    setFormData({
      name: insurance.name || "",
      code: insurance.code || "",
      phone: insurance.phone || "",
      email: insurance.email || "",
      discount: insurance.discount || "0",
    });
    setSelectedInsurance(insurance.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (isEditing && selectedInsurance) {
      updateMutation.mutate({ id: selectedInsurance, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedInsurance) {
      deleteMutation.mutate({ id: selectedInsurance });
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Convênios</h1>
          <p className="text-muted-foreground">Gerencie os convênios da clínica</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Convênio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Convênios</CardTitle>
          <CardDescription>{insurances?.length ?? 0} convênio(s) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : insurances && insurances.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Convênio</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="hidden sm:table-cell">Contato</TableHead>
                    <TableHead className="hidden md:table-cell">Desconto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurances.map((insurance) => (
                    <TableRow key={insurance.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{insurance.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{insurance.code || "-"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-col gap-1 text-sm">
                          {insurance.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {insurance.phone}
                            </span>
                          )}
                          {insurance.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {insurance.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {insurance.discount ? `${insurance.discount}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={insurance.isActive ? "default" : "secondary"}>
                          {insurance.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(insurance)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInsurance(insurance.id);
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
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum convênio cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Cadastre seu primeiro convênio</p>
              <Button onClick={handleOpenNew} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Novo Convênio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Convênio" : "Cadastrar Novo Convênio"}</DialogTitle>
            <DialogDescription>Preencha os dados do convênio</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do convênio"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Código"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@convenio.com"
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este convênio? Esta ação não pode ser desfeita.
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

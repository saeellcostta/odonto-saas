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
import { Plus, Pencil, Trash2, Stethoscope, Phone, Mail, Clock, Power, PowerOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type DentistFormData = {
  name: string;
  cro: string;
  specialty: string;
  phone: string;
  email: string;
  commission: string;
  color: string;
};

const initialFormData: DentistFormData = {
  name: "",
  cro: "",
  specialty: "",
  phone: "",
  email: "",
  commission: "0",
  color: "#3B82F6",
};

const colorOptions = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

export default function Dentistas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<number | null>(null);
  const [formData, setFormData] = useState<DentistFormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: dentists, isLoading } = trpc.dentists.list.useQuery();

  const createMutation = trpc.dentists.create.useMutation({
    onSuccess: () => {
      toast.success("Dentista cadastrado com sucesso!");
      utils.dentists.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar dentista: " + error.message);
    },
  });

  const updateMutation = trpc.dentists.update.useMutation({
    onSuccess: () => {
      toast.success("Dentista atualizado com sucesso!");
      utils.dentists.list.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dentista: " + error.message);
    },
  });

  const deleteMutation = trpc.dentists.delete.useMutation({
    onSuccess: () => {
      toast.success("Dentista excluído com sucesso!");
      utils.dentists.list.invalidate();
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir dentista: " + error.message);
    },
  });

  const toggleActiveTodayMutation = trpc.dentists.toggleActiveToday.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.isActiveToday ? "Dentista ativado para hoje!" : "Dentista desativado para hoje!");
      utils.dentists.list.invalidate();
      setSelectedDentist(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir dentista: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedDentist(null);
  };

  const handleOpenNew = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (dentist: any) => {
    setFormData({
      name: dentist.name || "",
      cro: dentist.cro || "",
      specialty: dentist.specialty || "",
      phone: dentist.phone || "",
      email: dentist.email || "",
      commission: dentist.commission || "0",
      color: dentist.color || "#3B82F6",
    });
    setSelectedDentist(dentist.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.cro.trim()) {
      toast.error("Nome e CRO são obrigatórios");
      return;
    }

    if (isEditing && selectedDentist) {
      updateMutation.mutate({ id: selectedDentist, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedDentist) {
      deleteMutation.mutate({ id: selectedDentist });
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dentistas</h1>
          <p className="text-muted-foreground">Gerencie os dentistas da clínica</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Dentista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Dentistas</CardTitle>
          <CardDescription>{dentists?.length ?? 0} dentista(s) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : dentists && dentists.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dentista</TableHead>
                    <TableHead>CRO</TableHead>
                    <TableHead className="hidden md:table-cell">Especialidade</TableHead>
                    <TableHead className="hidden sm:table-cell">Contato</TableHead>
                    <TableHead className="hidden lg:table-cell">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Presente Hoje</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dentists.map((dentist) => (
                    <TableRow key={dentist.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: dentist.color || "#3B82F6" }}
                          >
                            <Stethoscope className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{dentist.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{dentist.cro}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {dentist.specialty || "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-col gap-1 text-sm">
                          {dentist.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {dentist.phone}
                            </span>
                          )}
                          {dentist.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {dentist.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {dentist.commission ? `${dentist.commission}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dentist.isActive ? "default" : "secondary"}>
                          {dentist.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={dentist.isActiveToday ?? false}
                              onCheckedChange={(checked) => {
                                toggleActiveTodayMutation.mutate({ id: dentist.id, isActiveToday: checked });
                              }}
                              disabled={toggleActiveTodayMutation.isPending}
                            />
                            <span className={`text-sm font-medium ${dentist.isActiveToday ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {dentist.isActiveToday ? (
                                <span className="flex items-center gap-1">
                                  <Power className="h-3 w-3" /> Presente
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <PowerOff className="h-3 w-3" /> Ausente
                                </span>
                              )}
                            </span>
                          </div>
                          {dentist.isActiveToday && dentist.checkedInAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Chegou às {new Date(dentist.checkedInAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(dentist)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDentist(dentist.id);
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
              <Stethoscope className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum dentista cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Cadastre seu primeiro dentista</p>
              <Button onClick={handleOpenNew} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Novo Dentista
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Dentista" : "Cadastrar Novo Dentista"}</DialogTitle>
            <DialogDescription>Preencha os dados do dentista</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do dentista"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cro">CRO *</Label>
                  <Input
                    id="cro"
                    value={formData.cro}
                    onChange={(e) => setFormData({ ...formData, cro: e.target.value })}
                    placeholder="CRO-XX 00000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Ex: Ortodontia"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="commission">Comissão (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Cor de Identificação</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full transition-all ${
                        formData.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
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
              Tem certeza que deseja excluir este dentista? Esta ação não pode ser desfeita.
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

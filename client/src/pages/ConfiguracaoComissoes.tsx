import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit2, Plus, Trash2, Save } from "lucide-react";

export default function ConfiguracaoComissoes() {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPercentage, setEditingPercentage] = useState<number>(0);
  const [newDentistId, setNewDentistId] = useState<number | null>(null);
  const [newPercentage, setNewPercentage] = useState<number>(30);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Buscar comissões
  const { data: commissions, isLoading: loadingCommissions, refetch: refetchCommissions } = 
    trpc.earnings.getCommissions.useQuery(
      { clinicId: user?.clinicId || 0 },
      { enabled: !!user?.clinicId }
    );

  // Buscar dentistas
  const { data: dentists, isLoading: loadingDentists } = 
    trpc.earnings.getDentistsForClinic.useQuery(
      undefined,
      { enabled: !!user?.clinicId }
    );

  // Mutations
  const updateCommission = trpc.earnings.updateCommission.useMutation({
    onSuccess: () => {
      toast.success("Comissão atualizada com sucesso!");
      setEditingId(null);
      refetchCommissions();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const createCommission = trpc.earnings.createCommission.useMutation({
    onSuccess: () => {
      toast.success("Comissão criada com sucesso!");
      setIsAddingNew(false);
      setNewDentistId(null);
      setNewPercentage(30);
      refetchCommissions();
    },
    onError: (error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const deleteCommission = trpc.earnings.deleteCommission.useMutation({
    onSuccess: () => {
      toast.success("Comissão removida com sucesso!");
      refetchCommissions();
    },
    onError: (error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const handleSaveEdit = (commissionId: number) => {
    if (editingPercentage < 0 || editingPercentage > 100) {
      toast.error("Porcentagem deve estar entre 0 e 100");
      return;
    }
    updateCommission.mutate({
      id: commissionId,
      commissionPercentage: editingPercentage,
    });
  };

  const handleAddNew = () => {
    if (!newDentistId) {
      toast.error("Selecione um dentista");
      return;
    }
    if (newPercentage < 0 || newPercentage > 100) {
      toast.error("Porcentagem deve estar entre 0 e 100");
      return;
    }
    createCommission.mutate({
      clinicId: user?.clinicId || 0,
      dentistId: newDentistId,
      commissionPercentage: newPercentage,
    });
  };

  const dentistMap = useMemo(() => {
    const map = new Map();
    dentists?.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [dentists]);

  const isLoading = loadingCommissions || loadingDentists;

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Configuração de Comissões</h1>
        <p className="text-gray-600 mt-2">Gerenciar porcentagem de comissão por dentista</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comissões Cadastradas</CardTitle>
          <CardDescription>
            {commissions?.length || 0} dentista(s) com comissão configurada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commissions && commissions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dentista</TableHead>
                      <TableHead>Porcentagem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {dentistMap.get(commission.dentistId) || `Dentista #${commission.dentistId}`}
                        </TableCell>
                        <TableCell>
                          {editingId === commission.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editingPercentage}
                                onChange={(e) => setEditingPercentage(Number(e.target.value))}
                                className="w-20"
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <span className="font-semibold">{commission.commissionPercentage}%</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === commission.id ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(commission.id)}
                                disabled={updateCommission.isPending}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(commission.id);
                                  setEditingPercentage(Number(commission.commissionPercentage));
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteCommission.mutate({ id: commission.id })}
                                disabled={deleteCommission.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhuma comissão configurada</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Comissão</CardTitle>
          <CardDescription>Configure comissão para um novo dentista</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dentist-select">Dentista</Label>
              <select
                id="dentist-select"
                value={newDentistId || ""}
                onChange={(e) => setNewDentistId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Selecione um dentista</option>
                {dentists?.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="percentage-input">Porcentagem de Comissão (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percentage-input"
                  type="number"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Ganho estimado por R$ 1.000: R$ {(1000 * newPercentage) / 100}
              </p>
            </div>

            <Button
              onClick={handleAddNew}
              disabled={createCommission.isPending || !newDentistId}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Comissão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            • A comissão é calculada automaticamente quando um dentista finaliza um atendimento
          </p>
          <p>
            • O valor da comissão é baseado no valor do procedimento realizado
          </p>
          <p>
            • Os ganhos aparecem no Mapa de Ganho no final do dia
          </p>
          <p>
            • Você pode editar a porcentagem a qualquer momento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

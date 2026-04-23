import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Edit2, Plus, Trash2, Save, ChevronRight } from "lucide-react";

export default function ConfiguracaoComissoes() {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPercentage, setEditingPercentage] = useState<number>(0);
  const [selectedDentistId, setSelectedDentistId] = useState<number | null>(null);
  const [newPercentage, setNewPercentage] = useState<number>(30);
  const [step, setStep] = useState<"select" | "configure">("select");

  // Buscar comissões
  const { data: commissions, isLoading: loadingCommissions, refetch: refetchCommissions } = 
    trpc.earnings.getCommissions.useQuery(
      undefined,
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
      setStep("select");
      setSelectedDentistId(null);
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

  const handleSelectDentist = (dentistId: number) => {
    setSelectedDentistId(dentistId);
    setStep("configure");
  };

  const handleConfirmCommission = () => {
    if (!selectedDentistId) {
      toast.error("Selecione um dentista");
      return;
    }
    if (newPercentage < 0 || newPercentage > 100) {
      toast.error("Porcentagem deve estar entre 0 e 100");
      return;
    }
    createCommission.mutate({
      dentistId: selectedDentistId,
      commissionPercentage: newPercentage,
    });
  };

  const dentistMap = useMemo(() => {
    const map = new Map();
    dentists?.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [dentists]);

  // Dentistas já com comissão configurada
  const dentistasComComissao = useMemo(() => {
    const ids = new Set(commissions?.map(c => c.dentistId) || []);
    return ids;
  }, [commissions]);

  // Dentistas sem comissão
  const dentistasDisponiveis = useMemo(() => {
    return dentists?.filter(d => !dentistasComComissao.has(d.id)) || [];
  }, [dentists, dentistasComComissao]);

  const selectedDentist = dentists?.find(d => d.id === selectedDentistId);
  const isLoading = loadingCommissions || loadingDentists;

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar porcentagem de comissão por dentista</h1>
        <p className="text-gray-600 mt-2">Configure as comissões para seus dentistas</p>
      </div>

      {/* Comissões Cadastradas */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões Cadastradas</CardTitle>
          <CardDescription>
            {commissions?.length || 0} dentista(s) com comissão configurada
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Adicionar Nova Comissão */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Comissão</CardTitle>
            <CardDescription>Selecione um dentista para configurar a comissão</CardDescription>
          </CardHeader>
          <CardContent>
            {dentistasDisponiveis.length > 0 ? (
              <div className="space-y-2">
                {dentistasDisponiveis.map((dentist) => (
                  <button
                    key={dentist.id}
                    onClick={() => handleSelectDentist(dentist.id)}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{dentist.name}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Todos os dentistas já possuem comissão configurada
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configurar Comissão */}
      {step === "configure" && selectedDentist && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle>Configurar Comissão</CardTitle>
            <CardDescription>Dentista: {selectedDentist.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="percentage-input">Porcentagem de Comissão (%)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="percentage-input"
                  type="number"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  className="flex-1 text-lg"
                />
                <span className="text-gray-600 font-medium">%</span>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                <span className="font-semibold">Ganho estimado por R$ 1.000:</span> R$ {(1000 * newPercentage) / 100}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmCommission}
                disabled={createCommission.isPending}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Confirmar Comissão
              </Button>
              <Button
                onClick={() => {
                  setStep("select");
                  setSelectedDentistId(null);
                  setNewPercentage(30);
                }}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações */}
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

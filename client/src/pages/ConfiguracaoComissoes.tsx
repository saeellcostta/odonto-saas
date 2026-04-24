import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConfiguracaoComissoes() {
  const { user } = useAuth();
  const [selectedDentistId, setSelectedDentistId] = useState<string>("");
  const [percentage, setPercentage] = useState<string>("0");
  const [step, setStep] = useState<"list" | "add">("list");

  // Queries
  const commissionsQuery = trpc.earnings.commissions.list.useQuery();
  const dentistsQuery = trpc.earnings.dentists.list.useQuery();

  // Mutations
  const upsertMutation = trpc.earnings.commissions.upsert.useMutation({
    onSuccess: () => {
      toast.success("Comissão salva com sucesso!");
      setSelectedDentistId("");
      setPercentage("0");
      setStep("list");
      commissionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.earnings.commissions.delete.useMutation({
    onSuccess: () => {
      toast.success("Comissão removida com sucesso!");
      commissionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleSaveCommission = async () => {
    if (!selectedDentistId || !percentage) {
      toast.error("Selecione um dentista e defina a porcentagem");
      return;
    }

    await upsertMutation.mutateAsync({
      dentistId: parseInt(selectedDentistId),
      commissionPercentage: parseFloat(percentage),
    });
  };

  const handleDeleteCommission = async (dentistId: number) => {
    if (confirm("Tem certeza que deseja remover esta comissão?")) {
      await deleteMutation.mutateAsync({ dentistId });
    }
  };

  const getDentistName = (dentistId: number) => {
    return dentistsQuery.data?.find((d) => d.id === dentistId)?.name || "Desconhecido";
  };

  const getEstimatedEarnings = () => {
    if (!percentage) return 0;
    return (1000 * parseFloat(percentage)) / 100;
  };

  const isLoading = commissionsQuery.isLoading || dentistsQuery.isLoading;

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
            {commissionsQuery.data?.length || 0} dentista(s) com comissão configurada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissionsQuery.data && commissionsQuery.data.length > 0 ? (
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
                  {commissionsQuery.data.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {getDentistName(commission.dentistId)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{commission.commissionPercentage}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCommission(commission.dentistId)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
      {step === "add" && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle>Adicionar Nova Comissão</CardTitle>
            <CardDescription>Configure comissão para um novo dentista</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Dentista */}
            <div>
              <Label htmlFor="dentist-select">Dentista</Label>
              <Select value={selectedDentistId} onValueChange={setSelectedDentistId}>
                <SelectTrigger id="dentist-select" className="mt-2">
                  <SelectValue placeholder="Selecione um dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentistsQuery.data?.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id.toString()}>
                      {dentist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Porcentagem de Comissão */}
            <div>
              <Label htmlFor="percentage-input">Porcentagem de Comissão (%)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="percentage-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="0"
                  className="flex-1 text-lg"
                />
                <span className="text-gray-600 font-medium">%</span>
              </div>
              {percentage && (
                <p className="text-sm text-gray-600 mt-3">
                  <span className="font-semibold">Ganho estimado por R$ 1.000:</span> R$ {getEstimatedEarnings().toFixed(2)}
                </p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                onClick={handleSaveCommission}
                disabled={upsertMutation.isPending || !selectedDentistId}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Confirmar Comissão
              </Button>
              <Button
                onClick={() => {
                  setStep("list");
                  setSelectedDentistId("");
                  setPercentage("0");
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

      {/* Botão para adicionar */}
      {step === "list" && (
        <div className="flex justify-center">
          <Button
            onClick={() => setStep("add")}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova Comissão
          </Button>
        </div>
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
        </CardContent>
      </Card>
    </div>
  );
}

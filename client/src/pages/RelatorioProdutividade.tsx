import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  TrendingUp, DollarSign, Users, FileText, Calendar, Download, Loader2
} from "lucide-react";

export default function RelatorioProdutividade() {
  const [selectedDentist, setSelectedDentist] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: dentists } = trpc.dentists.list.useQuery();
  
  const { data: productivity, isLoading, refetch } = trpc.reports.dentistProductivity.useQuery({
    dentistId: selectedDentist === "all" ? undefined : parseInt(selectedDentist),
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleGenerateReport = () => {
    refetch();
    toast.success("Relatório atualizado!");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalGeral = productivity?.reduce((sum, d) => sum + d.totalRevenue, 0) || 0;
  const totalComissoes = productivity?.reduce((sum, d) => sum + d.totalCommission, 0) || 0;
  const totalPacientes = productivity?.reduce((sum, d) => sum + d.totalPatients, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Relatório de Produtividade
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho e comissões de cada dentista
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione os critérios para gerar o relatório</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Dentista</Label>
                <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os dentistas</SelectItem>
                    {dentists?.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Faturado</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalGeral)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Comissões</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalComissoes)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pacientes Atendidos</p>
                  <p className="text-2xl font-bold">{totalPacientes}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento por Dentista */}
        {productivity && productivity.length > 0 ? (
          productivity.map((dentist) => (
            <Card key={dentist.dentistId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{dentist.dentistName}</CardTitle>
                    <CardDescription>
                      Comissão: {dentist.dentistCommission}% | {dentist.totalPatients} pacientes atendidos
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Faturado</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(dentist.totalRevenue)}
                    </p>
                    <p className="text-sm text-emerald-600 font-semibold mt-1">
                      Comissão: {formatCurrency(dentist.totalCommission)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedimento</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dentist.procedures.map((proc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{proc.procedureName}</TableCell>
                        <TableCell className="text-center">{proc.count}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(proc.totalValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-center font-bold">
                        {dentist.procedures.reduce((sum, p) => sum + p.count, 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(dentist.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {isLoading
                  ? "Carregando relatório..."
                  : "Nenhum dado encontrado para os filtros selecionados"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

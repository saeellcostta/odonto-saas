import { useState } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, DollarSign, Users } from "lucide-react";

export function MapaGanho() {
  const auth = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedDentist, setExpandedDentist] = useState<number | null>(null);

  // Buscar resumo de ganhos do dia
  const { data: dailySummary, isLoading: isLoadingSummary } = trpc.earnings.map.byDate.useQuery(
    { date: selectedDate },
    { enabled: !!auth?.user }
  );

  // Buscar atendimentos do dia
  const { data: appointments, isLoading: isLoadingAppointments } = trpc.earnings.appointments.listToday.useQuery(
    undefined,
    { enabled: !!auth?.user }
  );

  // Calcular totais
  const totalRevenue = dailySummary?.reduce((sum, s) => sum + parseFloat(s.totalRevenue.toString()), 0) || 0;
  const totalCommission = dailySummary?.reduce((sum, s) => sum + parseFloat(s.totalCommission.toString()), 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Rascunho</Badge>;
      case 'finalized':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800">Finalizado</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Pago</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoadingSummary || isLoadingAppointments) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mapa de Ganho</h1>
          <p className="text-gray-600">Acompanhe os ganhos dos dentistas em tempo real</p>
        </div>

        {/* Date Selector */}
        <div className="mb-6 flex gap-4 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">
            {new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{appointments?.length || 0} atendimentos</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Comissão Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-500 mt-1">{dailySummary?.length || 0} dentistas</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {dailySummary?.filter(s => s.status === 'finalized' || s.status === 'paid').length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dailySummary?.filter(s => s.status === 'paid').length || 0} pagos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dentist Summary Table */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Resumo por Dentista</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!dailySummary || dailySummary.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum atendimento registrado para esta data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dentista</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Procedimentos</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Receita</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Comissão</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((summary) => (
                      <tr key={summary.id} className="border-b border-gray-100 hover:bg-orange-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          Dentista #{summary.dentistId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {summary.totalProcedures}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(parseFloat(summary.totalRevenue.toString()))}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                          {formatCurrency(parseFloat(summary.totalCommission.toString()))}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(summary.status)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setExpandedDentist(expandedDentist === summary.dentistId ? null : summary.dentistId)}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            {expandedDentist === summary.dentistId ? 'Ocultar' : 'Ver detalhes'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expanded Details */}
        {expandedDentist && (
          <Card className="mt-6 shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <CardTitle>Detalhes - Dentista #{expandedDentist}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Paciente</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Procedimento</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Comissão %</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ganho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      ?.filter(apt => apt.dentistId === expandedDentist)
                      .map((apt) => (
                        <tr key={apt.id} className="border-b border-gray-100 hover:bg-orange-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900">Paciente #{apt.patientId}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{apt.procedureName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(parseFloat(apt.procedurePrice.toString()))}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {parseFloat(apt.commissionPercentage.toString())}%
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                            {formatCurrency(parseFloat(apt.commissionAmount.toString()))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, DollarSign, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { data: appointments, isLoading: isLoadingAppointments } = trpc.earnings.appointments.listByDate.useQuery(
    { date: selectedDate },
    { enabled: !!auth?.user }
  );

  // Calcular totais
  const totalRevenue = dailySummary?.reduce((sum, s) => sum + parseFloat((s.totalRevenue ?? 0).toString()), 0) || 0;
  const totalCommission = dailySummary?.reduce((sum, s) => sum + parseFloat((s.totalCommission ?? 0).toString()), 0) || 0;
  const totalAppointments = dailySummary?.reduce((sum, s) => sum + (s.totalProcedures ?? 0), 0) || 0;

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

  const toggleDentistExpand = (dentistId: number) => {
    setExpandedDentist(expandedDentist === dentistId ? null : dentistId);
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
              <p className="text-xs text-gray-500 mt-1">{totalAppointments} atendimentos</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Comissão Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalRevenue > 0 ? `${((totalCommission / totalRevenue) * 100).toFixed(1)}% da receita` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Dentistas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{dailySummary?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">com atendimentos hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Dentists Earnings Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Ganhos por Dentista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dailySummary || dailySummary.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                <p className="text-gray-500">Nenhum atendimento registrado para esta data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dailySummary.map((summary) => (
                  <div key={summary.dentistId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Dentist Summary Row */}
                    <button
                      onClick={() => toggleDentistExpand(summary.dentistId)}
                      className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Dentista ID: {summary.dentistId}</p>
                          <p className="text-sm text-gray-500">{summary.totalProcedures} procedimento(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(summary.totalRevenue?.toString() || '0'))}</p>
                          <p className="text-sm text-orange-600 font-medium">
                            Comissão: {formatCurrency(parseFloat(summary.totalCommission?.toString() || '0'))}
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(summary.status || 'draft')}
                        </div>
                      </div>
                      <div className="ml-4">
                        {expandedDentist === summary.dentistId ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Appointments */}
                    {expandedDentist === summary.dentistId && (
                      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                        <h4 className="font-semibold text-gray-900 mb-4">Atendimentos</h4>
                        <div className="space-y-3">
                          {appointments
                            ?.filter((apt) => apt.dentistId === summary.dentistId)
                            .map((apt) => (
                              <div key={apt.id} className="bg-white p-3 rounded border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{apt.procedureName}</p>
                                    <p className="text-xs text-gray-500">Paciente ID: {apt.patientId}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                      {formatCurrency(parseFloat(apt.procedurePrice?.toString() || '0'))}
                                    </p>
                                    <p className="text-xs text-orange-600">
                                      Comissão: {formatCurrency(parseFloat(apt.commissionAmount?.toString() || '0'))}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span>{new Date(apt.completedAt).toLocaleTimeString('pt-BR')}</span>
                                  <Badge variant="outline">{apt.paymentStatus}</Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

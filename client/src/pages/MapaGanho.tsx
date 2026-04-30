import { useState } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MapaGanho() {
  const auth = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedDentist, setExpandedDentist] = useState<number | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");

  // Buscar especialidades
  const { data: specialties = [] } = trpc.earnings.specialties.list.useQuery(
    undefined,
    { enabled: !!auth?.user }
  );

  // Buscar resumo por especialidade
  const { data: specialtySummary } = trpc.earnings.map.bySpecialty.useQuery(
    { specialty: selectedSpecialty, date: selectedDate },
    { enabled: !!auth?.user && !!selectedSpecialty }
  );

  // Buscar atendimentos por especialidade
  const { data: specialtyAppointments } = trpc.earnings.appointments.listBySpecialty.useQuery(
    { specialty: selectedSpecialty, date: selectedDate },
    { enabled: !!auth?.user && !!selectedSpecialty }
  );

  // Definir especialidade padrão
  const activeSpecialty = selectedSpecialty || specialties[0] || "";
  
  // Usar dados da especialidade selecionada
  const currentSummary = specialtySummary || [];
  const currentAppointments = specialtyAppointments || [];

  // Calcular totais
  const totalRevenue = currentSummary?.reduce((sum: number, s: any) => sum + parseFloat((s.totalRevenue ?? 0).toString()), 0) || 0;
  const totalCommission = currentSummary?.reduce((sum: number, s: any) => sum + parseFloat((s.totalCommission ?? 0).toString()), 0) || 0;
  const totalAppointments = currentSummary?.reduce((sum: number, s: any) => sum + (s.totalProcedures ?? 0), 0) || 0;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mapa de Ganho</h1>
          <p className="text-gray-600">Acompanhe os ganhos dos dentistas por especialidade</p>
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

        {/* Tabs por Especialidade */}
        {specialties.length > 0 ? (
          <Tabs value={activeSpecialty} onValueChange={setSelectedSpecialty} className="mb-8">
            <TabsList className="flex flex-wrap w-full gap-2 bg-white border border-gray-200 p-2 rounded-lg overflow-x-auto md:grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              {specialties.map((specialty: string) => (
                <TabsTrigger key={specialty} value={specialty} className="px-4 py-2">
                  {specialty}
                </TabsTrigger>
              ))}
            </TabsList>

            {specialties.map((specialty: string) => (
              <TabsContent key={specialty} value={specialty} className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <p className="text-xs text-gray-500 mt-1">Paga aos dentistas</p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Dentistas Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{currentSummary?.length || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Nesta especialidade</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Dentistas Table */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Ganhos por Dentista - {specialty}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentSummary && currentSummary.length > 0 ? (
                        currentSummary.map((summary: any) => (
                          <div key={summary.dentistId} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleDentistExpand(summary.dentistId)}>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{summary.dentistName}</h3>
                                <p className="text-sm text-gray-500">{summary.totalProcedures} atendimentos</p>
                              </div>
                              <div className="text-right mr-4">
                                <p className="font-bold text-lg text-gray-900">{formatCurrency(parseFloat((summary.totalRevenue ?? 0).toString()))}</p>
                                <p className="text-sm text-green-600">Comissão: {formatCurrency(parseFloat((summary.totalCommission ?? 0).toString()))}</p>
                              </div>
                              {expandedDentist === summary.dentistId ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>

                            {/* Expanded Details */}
                            {expandedDentist === summary.dentistId && (
                              <div className="mt-4 pt-4 border-t space-y-2">
                                <div className="text-sm text-gray-600">
                                  <p><strong>Status:</strong> {getStatusBadge(summary.status)}</p>
                                  <p><strong>Data:</strong> {new Date(summary.date).toLocaleDateString('pt-BR')}</p>
                                </div>

                                {/* Atendimentos do Dentista */}
                                <div className="mt-3 pt-3 border-t">
                                  <h4 className="font-semibold text-gray-900 mb-3">Atendimentos Individuais</h4>
                                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                    {currentAppointments?.filter((apt: any) => apt.dentistId === summary.dentistId).length > 0 ? (
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b bg-gray-100 sticky top-0">
                                            <th className="text-left p-2 font-semibold text-gray-700">Procedimento</th>
                                            <th className="text-right p-2 font-semibold text-gray-700">Valor</th>
                                            <th className="text-right p-2 font-semibold text-gray-700">Comissão %</th>
                                            <th className="text-right p-2 font-semibold text-gray-700">Ganho</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {currentAppointments?.filter((apt: any) => apt.dentistId === summary.dentistId).map((apt: any, idx: number) => {
                                            const procedurePrice = parseFloat((apt.procedurePrice ?? 0).toString());
                                            const commissionPercentage = parseFloat((apt.commissionPercentage ?? 0).toString());
                                            const dentistGain = (procedurePrice * commissionPercentage) / 100;
                                            return (
                                              <tr key={idx} className="border-b hover:bg-gray-50">
                                                <td className="p-2 text-gray-700">{apt.procedureName}</td>
                                                <td className="p-2 text-right text-gray-900 font-semibold">{formatCurrency(procedurePrice)}</td>
                                                <td className="p-2 text-right text-gray-700">{commissionPercentage}%</td>
                                                <td className="p-2 text-right text-green-600 font-bold">{formatCurrency(dentistGain)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="text-gray-500 text-center py-4">Nenhum atendimento registrado</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Nenhum ganho registrado para esta especialidade nesta data</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma especialidade cadastrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

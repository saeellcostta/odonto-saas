import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Smile,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];

export default function SmileDesignReports() {
  const [period, setPeriod] = useState("30");

  // Buscar métricas do Smile Design
  const { data: metrics, isLoading } = trpc.smileDesign.getMetrics.useQuery({
    days: parseInt(period),
  });

  // Dados mockados para demonstração (serão substituídos pelos dados reais)
  const mockMetrics = {
    totalSimulations: 45,
    totalConversions: 18,
    conversionRate: 40,
    totalRevenue: 54000,
    avgRevenuePerConversion: 3000,
    sharedViaWhatsApp: 32,
    whatsAppConversionRate: 56,
    byTreatmentType: [
      { name: "Clareamento", simulations: 15, conversions: 8, rate: 53 },
      { name: "Facetas", simulations: 12, conversions: 5, rate: 42 },
      { name: "Lentes", simulations: 8, conversions: 3, rate: 38 },
      { name: "Implantes", simulations: 6, conversions: 1, rate: 17 },
      { name: "Ortodontia", simulations: 4, conversions: 1, rate: 25 },
    ],
    weeklyTrend: [
      { week: "Sem 1", simulations: 8, conversions: 3 },
      { week: "Sem 2", simulations: 12, conversions: 5 },
      { week: "Sem 3", simulations: 10, conversions: 4 },
      { week: "Sem 4", simulations: 15, conversions: 6 },
    ],
    recentConversions: [
      { patient: "Maria Silva", treatment: "Clareamento", value: 1500, date: "2026-01-28" },
      { patient: "João Santos", treatment: "Facetas", value: 8000, date: "2026-01-27" },
      { patient: "Ana Costa", treatment: "Lentes", value: 12000, date: "2026-01-25" },
    ],
  };

  const data = metrics || mockMetrics;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Smile className="h-6 w-6 text-primary" />
              Relatórios de Conversão - Smile Design
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o impacto das simulações de sorriso nas conversões de orçamentos
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Simulações</p>
                      <p className="text-3xl font-bold">{data.totalSimulations}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smile className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>+12% vs período anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversões</p>
                      <p className="text-3xl font-bold">{data.totalConversions}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>+8% vs período anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                      <p className="text-3xl font-bold">{data.conversionRate}%</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <Progress value={data.conversionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Gerada</p>
                      <p className="text-3xl font-bold">
                        R$ {data.totalRevenue.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Média: R$ {data.avgRevenuePerConversion.toLocaleString("pt-BR")}/conversão
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* WhatsApp Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Impacto do Compartilhamento via WhatsApp
                </CardTitle>
                <CardDescription>
                  Simulações compartilhadas com pacientes têm maior taxa de conversão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-4xl font-bold text-green-600">{data.sharedViaWhatsApp}</p>
                    <p className="text-sm text-muted-foreground mt-1">Enviadas via WhatsApp</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-4xl font-bold text-green-600">{data.whatsAppConversionRate}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Taxa de Conversão (WhatsApp)</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-4xl font-bold text-orange-600">
                      {data.conversionRate}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Taxa de Conversão (Geral)</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-center text-muted-foreground">
                  Simulações compartilhadas via WhatsApp têm <strong className="text-green-600">
                    {data.whatsAppConversionRate - data.conversionRate}% mais chances
                  </strong> de conversão
                </p>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversão por Tipo de Tratamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversão por Tipo de Tratamento</CardTitle>
                  <CardDescription>Taxa de sucesso de cada tipo de simulação</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.byTreatmentType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Taxa de Conversão"]}
                      />
                      <Bar dataKey="rate" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição de Simulações */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tratamento</CardTitle>
                  <CardDescription>Tipos de simulação mais solicitados</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.byTreatmentType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="simulations"
                      >
                        {data.byTreatmentType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tendência Semanal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolução Semanal
                </CardTitle>
                <CardDescription>
                  Acompanhe a tendência de simulações e conversões ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="simulations"
                      name="Simulações"
                      stroke="#f97316"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      name="Conversões"
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversões Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Conversões Recentes
                </CardTitle>
                <CardDescription>
                  Últimos orçamentos fechados após simulação de Smile Design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentConversions.map((conversion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{conversion.patient}</p>
                          <p className="text-sm text-muted-foreground">{conversion.treatment}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          R$ {conversion.value.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(conversion.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

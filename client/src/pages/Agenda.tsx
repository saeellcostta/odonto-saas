import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type AppointmentFormData = {
  patientId: number | "";
  dentistId: number | "";
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  notes: string;
};

const initialFormData: AppointmentFormData = {
  patientId: "",
  dentistId: "",
  date: "",
  startTime: "",
  endTime: "",
  type: "",
  notes: "",
};

const timeSlots = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-green-500",
  in_progress: "bg-amber-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  no_show: "bg-red-300",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em Atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [selectedDentist, setSelectedDentist] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const utils = trpc.useUtils();
  const { data: appointments, isLoading: loadingAppointments } = trpc.appointments.list.useQuery({
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(weekEnd, "yyyy-MM-dd"),
    dentistId: selectedDentist !== "all" ? parseInt(selectedDentist) : undefined,
  });
  const { data: patients } = trpc.patients.list.useQuery();
  const { data: dentists } = trpc.dentists.list.useQuery({ activeOnly: true });

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Consulta agendada com sucesso!");
      utils.appointments.list.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao agendar consulta: " + error.message);
    },
  });

  const updateMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada!");
      utils.appointments.list.invalidate();
      handleCloseDetails();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar consulta: " + error.message);
    },
  });

  const deleteMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => {
      toast.success("Consulta cancelada!");
      utils.appointments.list.invalidate();
      utils.dashboard.stats.invalidate();
      handleCloseDetails();
    },
    onError: (error) => {
      toast.error("Erro ao cancelar consulta: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
  };

  const handleOpenDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleEditAppointment = () => {
    if (selectedAppointment) {
      setFormData({
        patientId: selectedAppointment.patientId,
        dentistId: selectedAppointment.dentistId || "",
        date: selectedAppointment.date,
        startTime: selectedAppointment.startTime.substring(0, 5),
        endTime: selectedAppointment.endTime.substring(0, 5),
        type: selectedAppointment.type || "",
        notes: selectedAppointment.notes || "",
      });
      handleCloseDetails();
      setIsDialogOpen(true);
    }
  };

  const handleCancelAppointment = () => {
    if (selectedAppointment && confirm("Tem certeza que deseja cancelar esta consulta?")) {
      deleteMutation.mutate({ id: selectedAppointment.id });
    }
  };

  const handleOpenNew = (date?: Date, time?: string) => {
    setFormData({
      ...initialFormData,
      date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      startTime: time || "08:00",
      endTime: time ? `${parseInt(time.split(":")[0]) + 1}:${time.split(":")[1]}`.padStart(5, "0") : "09:00",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      toast.error("Selecione um paciente");
      return;
    }

    if (selectedAppointment) {
      updateMutation.mutate({
        id: selectedAppointment.id,
        data: {
          patientId: formData.patientId as number,
          dentistId: formData.dentistId ? formData.dentistId as number : undefined,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          type: formData.type || undefined,
          notes: formData.notes || undefined,
        },
      });
    } else {
      createMutation.mutate({
        patientId: formData.patientId as number,
        dentistId: formData.dentistId ? formData.dentistId as number : undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type || undefined,
        notes: formData.notes || undefined,
      });
    }
  }

  const handleStatusChange = (appointmentId: number, status: string) => {
    updateMutation.mutate({
      id: appointmentId,
      data: { status: status as any },
    });
  };

  const goToToday = () => setCurrentDate(new Date());
  const goToPrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const getAppointmentsForSlot = (day: Date, time: string) => {
    if (!appointments) return [];
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const aptStartTime = apt.startTime.substring(0, 5); // Pega apenas HH:MM
      const slotTime = time.substring(0, 5); // Garante que está em HH:MM
      return isSameDay(aptDate, day) && aptStartTime === slotTime;
    });
  };

  const getPatientName = (patientId: number) => {
    const patient = patients?.find((p) => p.id === patientId);
    return patient?.name || "Paciente";
  };

  const getDentistName = (dentistId: number | null) => {
    if (!dentistId) return null;
    const dentist = dentists?.find((d) => d.id === dentistId);
    return dentist?.name || null;
  };

  // Stats
  const weekStats = useMemo(() => {
    if (!appointments) return { total: 0, confirmed: 0, pending: 0 };
    return {
      total: appointments.length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      pending: appointments.filter((a) => a.status === "scheduled").length,
    };
  }, [appointments]);

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos da clínica
          </p>
        </div>
        <Button onClick={() => handleOpenNew()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Consulta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.total}</p>
                <p className="text-sm text-muted-foreground">Agendamentos da Semana</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.confirmed}</p>
                <p className="text-sm text-muted-foreground">Confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 font-medium">
                {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <Select value={selectedDentist} onValueChange={setSelectedDentist}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por dentista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dentistas</SelectItem>
                {dentists?.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id.toString()}>
                    {dentist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-center text-sm font-medium text-muted-foreground">
                    Horário
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`p-2 text-center rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                        isSameDay(day, new Date()) ? "bg-primary/10" : ""
                      } ${
                        selectedDay && isSameDay(day, selectedDay) ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedDay(selectedDay && isSameDay(day, selectedDay) ? null : day)}
                    >
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className={`text-lg font-semibold ${
                        isSameDay(day, new Date()) ? "text-primary" : ""
                      }`}>
                        {format(day, "dd")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="border rounded-lg overflow-hidden">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 gap-px bg-border">
                      <div className="bg-card p-2 text-center text-sm text-muted-foreground">
                        {time}
                      </div>
                      {weekDays.map((day) => {
                        const slotAppointments = getAppointmentsForSlot(day, time);
                        return (
                          <div
                            key={`${day.toISOString()}-${time}`}
                            className="bg-card p-1 min-h-[60px] hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => slotAppointments.length === 0 && handleOpenNew(day, time)}
                          >
                            {slotAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className={`${statusColors[apt.status || "scheduled"]} text-white text-xs p-1.5 rounded mb-1 cursor-pointer hover:opacity-90`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(apt);
                                }}
                              >
                                <p className="font-medium truncate">
                                  {getPatientName(apt.patientId)}
                                </p>
                                {apt.type && (
                                  <p className="truncate opacity-90">{apt.type}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Consulta</DialogTitle>
            <DialogDescription>
              {formData.date && format(parseISO(formData.date), "EEEE, dd 'de' MMMM", { locale: ptBR })} às {formData.startTime}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="patient">Paciente *</Label>
                <Select
                  value={formData.patientId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, patientId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dentist">Dentista</Label>
                <Select
                  value={formData.dentistId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, dentistId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dentista" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists?.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id.toString()}>
                        {dentist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Horário</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => {
                      const [h, m] = value.split(":");
                      const endHour = (parseInt(h) + 1).toString().padStart(2, "0");
                      setFormData({ 
                        ...formData, 
                        startTime: value,
                        endTime: `${endHour}:${m}`
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="type">Tipo de Consulta</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Ex: Limpeza, Avaliação, Retorno"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre a consulta"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Agendando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="text-lg font-semibold">{getPatientName(selectedAppointment.patientId)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="text-lg font-semibold">
                  {format(new Date(selectedAppointment.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Horario Inicio</p>
                  <p className="text-lg font-semibold">{selectedAppointment.startTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horario Fim</p>
                  <p className="text-lg font-semibold">{selectedAppointment.endTime}</p>
                </div>
              </div>
              {selectedAppointment.dentistId && (
                <div>
                  <p className="text-sm text-muted-foreground">Dentista</p>
                  <p className="text-lg font-semibold">{getDentistName(selectedAppointment.dentistId)}</p>
                </div>
              )}
              {selectedAppointment.type && (
                <div>
                  <p className="text-sm text-muted-foreground">Procedimento</p>
                  <p className="text-lg font-semibold">{selectedAppointment.type}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1">{statusLabels[selectedAppointment.status] || selectedAppointment.status}</Badge>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observacoes</p>
                  <p className="text-base">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelAppointment}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Cancelando..." : "Cancelar Consulta"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDetails}>
                Fechar
              </Button>
              <Button
                type="button"
                onClick={handleEditAppointment}
                disabled={updateMutation.isPending}
              >
                Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

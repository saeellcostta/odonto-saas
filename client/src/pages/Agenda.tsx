import React, { useState, useMemo } from "react";
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
  Edit2,
  Trash2,
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
  };

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
      const aptStartTime = apt.startTime.substring(0, 5);
      const slotTime = time.substring(0, 5);
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agendamentos da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{weekStats.pending} pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{weekStats.confirmed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{weekStats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Calendário Semanal</CardTitle>
                <CardDescription>
                  {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAppointments ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(selectedDay?.toDateString() === day.toDateString() ? null : day)}
                      className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                        selectedDay?.toDateString() === day.toDateString()
                          ? "bg-orange-500 text-white"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="text-xs font-medium">
                        {format(day, "EEE", { locale: ptBR }).toUpperCase()}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((time) => {
                    const dayAppointments = selectedDay
                      ? getAppointmentsForSlot(selectedDay, time)
                      : [];

                    if (dayAppointments.length === 0 && selectedDay) return null;

                    return (
                      <div key={time} className="flex gap-2">
                        <div className="w-16 text-sm font-medium text-muted-foreground pt-2">
                          {time}
                        </div>
                        <div className="flex-1 space-y-1">
                          {dayAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => handleOpenDetails(apt)}
                              className={`p-2 rounded cursor-pointer transition-colors ${statusColors[apt.status as keyof typeof statusColors] || "bg-gray-400"} text-white text-sm hover:opacity-80`}
                            >
                              <div className="font-medium">{getPatientName(apt.patientId)}</div>
                              {getDentistName(apt.dentistId) && (
                                <div className="text-xs opacity-90">{getDentistName(apt.dentistId)}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Consulta</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Paciente</Label>
                  <p className="font-medium">{getPatientName(selectedAppointment.patientId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Horário Início</Label>
                    <p className="font-medium">{selectedAppointment.startTime.substring(0, 5)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Horário Fim</Label>
                    <p className="font-medium">{selectedAppointment.endTime.substring(0, 5)}</p>
                  </div>
                </div>
                {getDentistName(selectedAppointment.dentistId) && (
                  <div>
                    <Label className="text-muted-foreground">Dentista</Label>
                    <p className="font-medium">{getDentistName(selectedAppointment.dentistId)}</p>
                  </div>
                )}
                {selectedAppointment.type && (
                  <div>
                    <Label className="text-muted-foreground">Procedimento</Label>
                    <p className="font-medium">{selectedAppointment.type}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedAppointment.status] || "bg-gray-400"}>
                    {statusLabels[selectedAppointment.status] || selectedAppointment.status}
                  </Badge>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleEditAppointment} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" onClick={handleCancelAppointment} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Cancelar Consulta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedAppointment ? "Editar Consulta" : "Nova Consulta"}</DialogTitle>
              <DialogDescription>
                {selectedAppointment ? "Atualize os dados da consulta" : "Agende uma nova consulta"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="patient">Paciente *</Label>
                <Select
                  value={formData.patientId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, patientId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
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
                  onValueChange={(value) => setFormData({ ...formData, dentistId: value ? parseInt(value) : "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um dentista (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {dentists?.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id.toString()}>
                        {dentist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário Início *</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <Label htmlFor="endTime">Horário Fim *</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <Label htmlFor="type">Procedimento</Label>
                <Input
                  placeholder="Ex: Limpeza, Restauração, etc."
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  placeholder="Notas adicionais sobre a consulta"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {selectedAppointment ? "Atualizar" : "Agendar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Trash2, CalendarDays } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AIReminder from "@/components/AIReminder";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  color: string;
}

const COLORS = [
  { value: "accent", label: "Verde", class: "bg-accent" },
  { value: "primary", label: "Azul", class: "bg-primary" },
  { value: "warning", label: "Amarelo", class: "bg-warning" },
  { value: "destructive", label: "Vermelho", class: "bg-destructive" },
];

const STORAGE_KEY = "fincontrol_appointments";

export default function AgendamentosPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", time: "09:00", duration: "30", notes: "", color: "accent" });
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setAppointments(JSON.parse(stored));
  }, []);

  const save = (list: Appointment[]) => {
    setAppointments(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = () => {
    if (!form.title.trim()) {
      toast({ title: "Preencha o título", variant: "destructive" });
      return;
    }
    const newAppt: Appointment = {
      id: crypto.randomUUID(),
      title: form.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: form.time,
      duration: form.duration,
      notes: form.notes,
      color: form.color,
    };
    save([...appointments, newAppt]);
    setForm({ title: "", time: "09:00", duration: "30", notes: "", color: "accent" });
    setDialogOpen(false);
    toast({ title: "Agendamento criado!" });
  };

  const handleDelete = (id: string) => {
    save(appointments.filter((a) => a.id !== id));
    toast({ title: "Agendamento removido" });
  };

  const dayAppointments = appointments
    .filter((a) => isSameDay(new Date(a.date + "T00:00:00"), selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  const datesWithAppointments = appointments.map((a) => new Date(a.date + "T00:00:00"));

  const colorDot = (color: string) => {
    const map: Record<string, string> = {
      accent: "bg-accent",
      primary: "bg-primary",
      warning: "bg-warning",
      destructive: "bg-destructive",
    };
    return map[color] || "bg-accent";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus compromissos e reuniões</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Agendamento — {format(selectedDate, "dd/MM/yyyy")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Reunião com cliente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Horário</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div>
                  <Label>Duração</Label>
                  <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, color: c.value })}
                      className={cn("w-8 h-8 rounded-full transition-all", c.class, form.color === c.value ? "ring-2 ring-offset-2 ring-ring" : "opacity-60 hover:opacity-100")}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes adicionais..." rows={3} />
              </div>
              <Button onClick={handleAdd} className="w-full">Criar Agendamento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={ptBR}
              className="pointer-events-auto"
              modifiers={{ hasEvent: datesWithAppointments }}
              modifiersClassNames={{ hasEvent: "font-bold text-accent" }}
            />
          </CardContent>
        </Card>

        {/* Day view */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays size={20} className="text-accent" />
              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum agendamento para este dia</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
                  Adicionar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border group">
                    <div className={cn("w-1 h-full min-h-[48px] rounded-full shrink-0", colorDot(appt.color))} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{appt.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={13} /> {appt.time}</span>
                        <Badge variant="secondary" className="text-xs">{appt.duration} min</Badge>
                      </div>
                      {appt.notes && <p className="text-sm text-muted-foreground mt-1">{appt.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(appt.id)}>
                      <Trash2 size={16} />
                    </Button>
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

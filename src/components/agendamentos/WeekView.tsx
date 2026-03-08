import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  color: string;
}

interface WeekViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  onSelectDate: (d: Date) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const colorDot = (color: string) => {
  const map: Record<string, string> = {
    accent: "bg-accent",
    primary: "bg-primary",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };
  return map[color] || "bg-accent";
};

export default function WeekView({ selectedDate, appointments, onSelectDate, onDelete, onAdd }: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppts = (day: Date) =>
    appointments
      .filter((a) => isSameDay(new Date(a.date + "T00:00:00"), day))
      .sort((a, b) => a.time.localeCompare(b.time));

  const today = new Date();

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays size={20} className="text-accent" />
          Semana de {format(weekStart, "dd/MM")} a {format(addDays(weekStart, 6), "dd/MM/yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayAppts = getAppts(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "flex flex-col rounded-lg border border-border p-2 min-h-[120px] text-left transition-all hover:border-accent/50",
                  isSelected && "ring-2 ring-accent border-accent",
                  isToday && !isSelected && "border-accent/40 bg-accent/5"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn(
                    "text-xs font-medium uppercase",
                    isToday ? "text-accent" : "text-muted-foreground"
                  )}>
                    {format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-accent text-accent-foreground"
                  )}>
                    {format(day, "dd")}
                  </span>
                </div>

                {dayAppts.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 mt-auto">—</p>
                ) : (
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayAppts.slice(0, 3).map((appt) => (
                      <div
                        key={appt.id}
                        className={cn(
                          "flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] truncate",
                          "bg-muted/60 group relative"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", colorDot(appt.color))} />
                        <span className="truncate font-medium text-foreground">{appt.time}</span>
                        <span className="truncate text-muted-foreground">{appt.title}</span>
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} mais</p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day detail below the week grid */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <Button variant="outline" size="sm" onClick={onAdd} className="text-xs h-7">
              + Adicionar
            </Button>
          </div>
          {(() => {
            const dayAppts = getAppts(selectedDate);
            if (dayAppts.length === 0) {
              return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum agendamento</p>;
            }
            return (
              <div className="space-y-2">
                {dayAppts.map((appt) => (
                  <div key={appt.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 border border-border group">
                    <div className={cn("w-1 h-full min-h-[40px] rounded-full shrink-0", colorDot(appt.color))} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{appt.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={11} /> {appt.time}</span>
                        <Badge variant="secondary" className="text-[10px] h-4">{appt.duration} min</Badge>
                      </div>
                      {appt.notes && <p className="text-xs text-muted-foreground mt-1">{appt.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(appt.id); }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

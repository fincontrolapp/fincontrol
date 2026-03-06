import { useState, useEffect, useMemo } from "react";
import { getCashFlowDB } from "@/lib/supabase-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCashFlowDB().then((data) => { setEntries(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const totalIn = entries.filter((e) => e.type === "entrada").reduce((s, e) => s + Number(e.value), 0);
    const totalOut = entries.filter((e) => e.type === "saida").reduce((s, e) => s + Number(e.value), 0);
    const pending = entries.filter((e) => e.status === "pendente").reduce((s, e) => s + Number(e.value), 0);
    return { totalIn, totalOut, balance: totalIn - totalOut, pending };
  }, [entries]);

  const chartData = useMemo(() => {
    const months: Record<string, { previsto: number; realizado: number }> = {};
    entries.forEach((e) => {
      const month = e.date ? String(e.date).substring(0, 7) : "N/A";
      if (!months[month]) months[month] = { previsto: 0, realizado: 0 };
      const val = e.type === "entrada" ? Number(e.value) : -Number(e.value);
      if (e.status === "pendente") months[month].previsto += Number(e.value);
      else months[month].realizado += val;
    });
    return Object.entries(months).map(([month, v]) => ({ month, Previsto: v.previsto, Realizado: v.realizado }));
  }, [entries]);

  const stats = [
    { label: "Entradas", value: totals.totalIn, icon: ArrowUpRight, color: "text-emerald-600" },
    { label: "Saídas", value: totals.totalOut, icon: ArrowDownRight, color: "text-red-500" },
    { label: "Saldo", value: totals.balance, icon: DollarSign, color: "text-accent" },
    { label: "Pendentes", value: totals.pending, icon: Clock, color: "text-amber-500" },
  ];

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${s.color}`}><s.icon size={22} /></div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-heading font-bold">{fmt(s.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Previsto vs. Realizado</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">Adicione lançamentos no Fluxo de Caixa para visualizar o gráfico.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 88%)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Previsto" fill="hsl(220 16% 78%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realizado" fill="hsl(168 60% 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

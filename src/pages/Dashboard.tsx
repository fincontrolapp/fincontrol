import { useState, useEffect, useMemo } from "react";
import { getCashFlowDB, getInventoryDB, getClientsDB, getDailyCashDB, getInvoicesDB } from "@/lib/supabase-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock, TrendingUp, TrendingDown, Users, Package, FileText, Sparkles, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = [
  "hsl(168 60% 42%)", "hsl(224 50% 38%)", "hsl(38 92% 50%)",
  "hsl(0 72% 51%)", "hsl(270 60% 50%)", "hsl(200 70% 50%)",
];

export default function Dashboard() {
  const [entries, setEntries] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [dailyCash, setDailyCash] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getCashFlowDB().catch(() => []),
      getInventoryDB().catch(() => []),
      getClientsDB().catch(() => []),
      getDailyCashDB().catch(() => []),
      getInvoicesDB().catch(() => []),
    ]).then(([cf, inv, cl, dc, nf]) => {
      setEntries(cf);
      setInventory(inv);
      setClients(cl);
      setDailyCash(dc);
      setInvoices(nf);
      setLoading(false);
    });
  }, []);

  // AI Summary
  const fetchAISummary = async () => {
    setAiLoading(true);
    try {
      const summaryData = {
        totalEntradas: totals.totalIn,
        totalSaidas: totals.totalOut,
        saldo: totals.balance,
        pendentes: totals.pending,
        totalClientes: clients.length,
        totalProdutos: inventory.length,
        totalNotas: invoices.length,
        categoriasTop: categoryData.slice(0, 3).map(c => `${c.name}: R$${c.value.toFixed(2)}`),
      };

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Analise estes dados financeiros e dê um resumo executivo breve (máx 4 parágrafos) com insights e recomendações: ${JSON.stringify(summaryData)}` }],
          mode: "analysis",
        }),
      });

      if (!resp.ok) throw new Error("Erro na IA");
      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { full += content; setAiSummary(full); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch {
      setAiSummary("Não foi possível gerar o resumo. Tente novamente.");
    }
    setAiLoading(false);
  };

  const totals = useMemo(() => {
    const totalIn = entries.filter(e => e.type === "entrada").reduce((s, e) => s + Number(e.value), 0);
    const totalOut = entries.filter(e => e.type === "saida").reduce((s, e) => s + Number(e.value), 0);
    const pending = entries.filter(e => e.status === "pendente").reduce((s, e) => s + Number(e.value), 0);
    return { totalIn, totalOut, balance: totalIn - totalOut, pending };
  }, [entries]);

  // Monthly bar chart data
  const chartData = useMemo(() => {
    const months: Record<string, { entradas: number; saidas: number }> = {};
    entries.forEach(e => {
      const month = e.date ? String(e.date).substring(0, 7) : "N/A";
      if (!months[month]) months[month] = { entradas: 0, saidas: 0 };
      if (e.type === "entrada") months[month].entradas += Number(e.value);
      else months[month].saidas += Number(e.value);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, Entradas: v.entradas, Saídas: v.saidas }));
  }, [entries]);

  // Category pie chart
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    entries.forEach(e => {
      const cat = e.category || "Sem categoria";
      cats[cat] = (cats[cat] || 0) + Number(e.value);
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // Daily cash trend line
  const dailyTrend = useMemo(() => {
    return dailyCash
      .slice(0, 30)
      .reverse()
      .map(d => ({
        date: d.date,
        abertura: Number(d.opening_value),
        fechamento: Number(d.closing_value),
      }));
  }, [dailyCash]);

  // Invoices by month
  const invoicesByMonth = useMemo(() => {
    const months: Record<string, { bruto: number; liquido: number }> = {};
    invoices.forEach(inv => {
      const month = inv.issue_date ? String(inv.issue_date).substring(0, 7) : "N/A";
      if (!months[month]) months[month] = { bruto: 0, liquido: 0 };
      months[month].bruto += Number(inv.gross_value);
      months[month].liquido += Number(inv.net_value);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, Bruto: v.bruto, Líquido: v.liquido }));
  }, [invoices]);

  // Low stock items
  const lowStockItems = useMemo(() => {
    return inventory.filter(i => Number(i.current_balance) <= Number(i.min_stock));
  }, [inventory]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const stats = [
    { label: "Entradas", value: totals.totalIn, icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Saídas", value: totals.totalOut, icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Saldo", value: totals.balance, icon: totals.balance >= 0 ? TrendingUp : TrendingDown, color: "text-accent", bg: "bg-accent/10" },
    { label: "Pendentes", value: totals.pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Clientes", value: clients.length, icon: Users, color: "text-primary", bg: "bg-primary/10", isCurrency: false },
    { label: "Produtos", value: inventory.length, icon: Package, color: "text-primary", bg: "bg-primary/10", isCurrency: false },
  ];

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><s.icon size={16} /></div>
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-heading font-bold">
                {(s as any).isCurrency === false ? s.value : fmt(s.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Resumo Inteligente (IA)
            </CardTitle>
            <button
              onClick={fetchAISummary}
              disabled={aiLoading}
              className="text-sm bg-accent text-accent-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiLoading ? "Analisando..." : "Gerar Resumo"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
          ) : (
            <p className="text-sm text-muted-foreground">Clique em "Gerar Resumo" para obter uma análise inteligente dos seus dados financeiros.</p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entradas vs Saídas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Entradas vs Saídas por Mês</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">Sem dados de fluxo de caixa.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 88%)" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Entradas" fill="hsl(168 60% 42%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saídas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">Sem dados de categorias.</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryData.slice(0, 5).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{c.name}</span>
                      <span className="ml-auto font-medium">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Caixa Diário Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução do Caixa Diário</CardTitle></CardHeader>
          <CardContent>
            {dailyTrend.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">Sem dados de caixa diário.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 88%)" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="abertura" stroke="hsl(224 50% 38%)" fill="hsl(224 50% 38% / 0.1)" />
                  <Area type="monotone" dataKey="fechamento" stroke="hsl(168 60% 42%)" fill="hsl(168 60% 42% / 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Notas Fiscais */}
        <Card>
          <CardHeader><CardTitle className="text-base">Notas Fiscais: Bruto vs Líquido</CardTitle></CardHeader>
          <CardContent>
            {invoicesByMonth.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">Sem dados de notas fiscais.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={invoicesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 88%)" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="Bruto" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Líquido" stroke="hsl(168 60% 42%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estoque Baixo */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <Package size={16} className="text-warning" /> Estoque Baixo
          </CardTitle></CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os itens estão com estoque adequado. ✅</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Código: {item.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-destructive font-semibold">{Number(item.current_balance)} {item.unit}</p>
                      <p className="text-xs text-muted-foreground">Mín: {Number(item.min_stock)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lançamentos Pendentes */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <Clock size={16} className="text-warning" /> Lançamentos Pendentes
          </CardTitle></CardHeader>
          <CardContent>
            {entries.filter(e => e.status === "pendente").length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lançamento pendente. ✅</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entries.filter(e => e.status === "pendente").slice(0, 8).map(e => (
                  <div key={e.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{e.date} · {e.category}</p>
                    </div>
                    <span className={`font-semibold ${e.type === "entrada" ? "text-emerald-600" : "text-destructive"}`}>
                      {e.type === "entrada" ? "+" : "-"}{fmt(Number(e.value))}
                    </span>
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

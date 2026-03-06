import { useState, useEffect } from "react";
import { getDailyCashDB, addDailyCashDB, deleteDailyCashDB } from "@/lib/supabase-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DailyCashPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = () => getDailyCashDB().then(setEntries).catch(() => toast.error("Erro ao carregar")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.date || !form.description) { toast.error("Preencha data e descrição."); return; }
    setSaving(true);
    const opening = Number(form.opening_value || 0);
    const cashIn = Number(form.cash_in || 0);
    const pixIn = Number(form.pix_in || 0);
    const debitIn = Number(form.debit_in || 0);
    const creditIn = Number(form.credit_in || 0);
    const cashOut = Number(form.cash_out || 0);
    try {
      await addDailyCashDB({
        date: form.date, time: form.time || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        description: form.description, opening_value: opening, cash_in: cashIn, pix_in: pixIn,
        debit_in: debitIn, credit_in: creditIn, cash_out: cashOut,
        closing_value: opening + cashIn + pixIn + debitIn + creditIn - cashOut,
      });
      await load(); setForm({}); setOpen(false); toast.success("Movimento adicionado!");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDailyCashDB(id); setEntries((p) => p.filter((e) => e.id !== id)); toast.success("Removido."); }
    catch { toast.error("Erro ao remover"); }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Caixa Diário</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Novo Movimento</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Movimento</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Data</Label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Horário</Label><Input type="time" value={form.time || ""} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                <div><Label>Abertura (R$)</Label><Input type="number" min="0" step="0.01" value={form.opening_value || ""} onChange={(e) => setForm({ ...form, opening_value: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Entradas</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dinheiro</Label><Input type="number" min="0" step="0.01" value={form.cash_in || ""} onChange={(e) => setForm({ ...form, cash_in: parseFloat(e.target.value) })} /></div>
                <div><Label>Pix</Label><Input type="number" min="0" step="0.01" value={form.pix_in || ""} onChange={(e) => setForm({ ...form, pix_in: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cartão Débito</Label><Input type="number" min="0" step="0.01" value={form.debit_in || ""} onChange={(e) => setForm({ ...form, debit_in: parseFloat(e.target.value) })} /></div>
                <div><Label>Cartão Crédito</Label><Input type="number" min="0" step="0.01" value={form.credit_in || ""} onChange={(e) => setForm({ ...form, credit_in: parseFloat(e.target.value) })} /></div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Saídas</p>
              <div><Label>Sangrias / Pagamentos</Label><Input type="number" min="0" step="0.01" value={form.cash_out || ""} onChange={(e) => setForm({ ...form, cash_out: parseFloat(e.target.value) })} /></div>
              <Button onClick={handleAdd} className="mt-2" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Horário</TableHead><TableHead>Descrição</TableHead>
                <TableHead>Abertura</TableHead><TableHead>Dinheiro</TableHead><TableHead>Pix</TableHead>
                <TableHead>Débito</TableHead><TableHead>Crédito</TableHead><TableHead>Saídas</TableHead>
                <TableHead>Fechamento</TableHead><TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Nenhum movimento cadastrado.</TableCell></TableRow>}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{e.date}</TableCell>
                  <TableCell>{e.time}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{fmt(e.opening_value)}</TableCell>
                  <TableCell>{fmt(e.cash_in)}</TableCell>
                  <TableCell>{fmt(e.pix_in)}</TableCell>
                  <TableCell>{fmt(e.debit_in)}</TableCell>
                  <TableCell>{fmt(e.credit_in)}</TableCell>
                  <TableCell>{fmt(e.cash_out)}</TableCell>
                  <TableCell className="font-medium">{fmt(e.closing_value)}</TableCell>
                  <TableCell><button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

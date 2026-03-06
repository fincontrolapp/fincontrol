import { useState, useCallback } from "react";
import { DailyCashEntry } from "@/types/finance";
import { getDailyCash, saveDailyCash } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DailyCashPage() {
  const [entries, setEntries] = useState<DailyCashEntry[]>(getDailyCash);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<DailyCashEntry>>({});

  const save = useCallback((data: DailyCashEntry[]) => { setEntries(data); saveDailyCash(data); }, []);

  const handleAdd = () => {
    if (!form.date || !form.description) { toast.error("Preencha data e descrição."); return; }
    const opening = Number(form.openingValue || 0);
    const cashIn = Number(form.cashIn || 0);
    const pixIn = Number(form.pixIn || 0);
    const debitIn = Number(form.debitIn || 0);
    const creditIn = Number(form.creditIn || 0);
    const cashOut = Number(form.cashOut || 0);
    const closing = opening + cashIn + pixIn + debitIn + creditIn - cashOut;
    const entry: DailyCashEntry = {
      id: crypto.randomUUID(),
      date: form.date!,
      time: form.time || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      description: form.description!,
      openingValue: opening, cashIn, pixIn, debitIn, creditIn, cashOut,
      closingValue: closing,
    };
    save([entry, ...entries]);
    setForm({});
    setOpen(false);
    toast.success("Movimento adicionado!");
  };

  const handleDelete = (id: string) => { save(entries.filter((e) => e.id !== id)); toast.success("Removido."); };
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
                <div><Label>Abertura (R$)</Label><Input type="number" min="0" step="0.01" value={form.openingValue || ""} onChange={(e) => setForm({ ...form, openingValue: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Entradas</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dinheiro</Label><Input type="number" min="0" step="0.01" value={form.cashIn || ""} onChange={(e) => setForm({ ...form, cashIn: parseFloat(e.target.value) })} /></div>
                <div><Label>Pix</Label><Input type="number" min="0" step="0.01" value={form.pixIn || ""} onChange={(e) => setForm({ ...form, pixIn: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cartão Débito</Label><Input type="number" min="0" step="0.01" value={form.debitIn || ""} onChange={(e) => setForm({ ...form, debitIn: parseFloat(e.target.value) })} /></div>
                <div><Label>Cartão Crédito</Label><Input type="number" min="0" step="0.01" value={form.creditIn || ""} onChange={(e) => setForm({ ...form, creditIn: parseFloat(e.target.value) })} /></div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Saídas</p>
              <div><Label>Sangrias / Pagamentos</Label><Input type="number" min="0" step="0.01" value={form.cashOut || ""} onChange={(e) => setForm({ ...form, cashOut: parseFloat(e.target.value) })} /></div>
              <Button onClick={handleAdd} className="mt-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Dinheiro</TableHead>
                <TableHead>Pix</TableHead>
                <TableHead>Débito</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">Nenhum movimento cadastrado.</TableCell></TableRow>
              )}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{e.date}</TableCell>
                  <TableCell>{e.time}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{fmt(e.openingValue)}</TableCell>
                  <TableCell>{fmt(e.cashIn)}</TableCell>
                  <TableCell>{fmt(e.pixIn)}</TableCell>
                  <TableCell>{fmt(e.debitIn)}</TableCell>
                  <TableCell>{fmt(e.creditIn)}</TableCell>
                  <TableCell>{fmt(e.cashOut)}</TableCell>
                  <TableCell className="font-medium">{fmt(e.closingValue)}</TableCell>
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

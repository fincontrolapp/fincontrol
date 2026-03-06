import { useState, useCallback } from "react";
import { CashFlowEntry } from "@/types/finance";
import { getCashFlow, saveCashFlow } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const categories = ["Aluguel", "Venda de Serviço", "Marketing", "Salários", "Fornecedores", "Impostos", "Outros"];
const accounts = ["Caixa", "Banco A", "Banco B"];

export default function CashFlowPage() {
  const [entries, setEntries] = useState<CashFlowEntry[]>(getCashFlow);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CashFlowEntry>>({ type: "entrada", status: "pendente", account: "Caixa", category: "Outros" });

  const save = useCallback((data: CashFlowEntry[]) => {
    setEntries(data);
    saveCashFlow(data);
  }, []);

  const handleAdd = () => {
    if (!form.description || !form.value || !form.date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const entry: CashFlowEntry = {
      id: crypto.randomUUID(),
      date: form.date!,
      description: form.description!,
      category: form.category || "Outros",
      type: form.type as "entrada" | "saida",
      value: Number(form.value),
      status: form.status as "pago" | "pendente",
      account: form.account || "Caixa",
    };
    save([entry, ...entries]);
    setForm({ type: "entrada", status: "pendente", account: "Caixa", category: "Outros" });
    setOpen(false);
    toast.success("Lançamento adicionado!");
  };

  const handleDelete = (id: string) => {
    save(entries.filter((e) => e.id !== id));
    toast.success("Removido.");
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Fluxo de Caixa</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-2" />Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>Data</Label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pago">Pago</SelectItem><SelectItem value="pendente">Pendente</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Conta</Label>
                  <Select value={form.account} onValueChange={(v) => setForm({ ...form, account: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Valor (R$)</Label><Input type="number" min="0" step="0.01" value={form.value || ""} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })} /></div>
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
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lançamento cadastrado.</TableCell></TableRow>
              )}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{e.date}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${e.type === "entrada" ? "status-paid" : "stock-low"}`}>
                      {e.type === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{fmt(e.value)}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${e.status === "pago" ? "status-paid" : "status-pending"}`}>
                      {e.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </TableCell>
                  <TableCell>{e.account}</TableCell>
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

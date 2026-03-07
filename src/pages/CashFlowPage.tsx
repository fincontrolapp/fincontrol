import { useState, useEffect } from "react";
import { getCashFlowDB, addCashFlowDB, deleteCashFlowDB } from "@/lib/supabase-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Settings2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

const categories = ["Aluguel", "Venda de Serviço", "Marketing", "Salários", "Fornecedores", "Impostos", "Outros"];
const DEFAULT_ACCOUNTS = ["Caixa", "Banco A", "Banco B"];
const ACCOUNTS_KEY = "fincontrol_accounts";

function loadAccounts(): string[] {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEFAULT_ACCOUNTS];
}

function saveAccounts(accounts: string[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function AccountsManager({ accounts, onChange }: { accounts: string[]; onChange: (a: string[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");

  const startEdit = (i: number) => { setEditIdx(i); setEditName(accounts[i]); };
  const confirmEdit = () => {
    if (editIdx === null || !editName.trim()) return;
    if (accounts.some((a, i) => i !== editIdx && a.toLowerCase() === editName.trim().toLowerCase())) {
      toast.error("Já existe uma conta com esse nome."); return;
    }
    const updated = accounts.map((a, i) => i === editIdx ? editName.trim() : a);
    onChange(updated);
    setEditIdx(null);
    toast.success("Conta renomeada!");
  };
  const addAccount = () => {
    if (!newName.trim()) return;
    if (accounts.some(a => a.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error("Já existe uma conta com esse nome."); return;
    }
    onChange([...accounts, newName.trim()]);
    setNewName("");
    toast.success("Conta adicionada!");
  };
  const removeAccount = (i: number) => {
    if (accounts.length <= 1) { toast.error("Deve haver pelo menos uma conta."); return; }
    onChange(accounts.filter((_, idx) => idx !== i));
    toast.success("Conta removida.");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Renomeie ou adicione contas/bancos.</p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {accounts.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            {editIdx === i ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-sm h-8"
                  onKeyDown={e => e.key === "Enter" && confirmEdit()} autoFocus />
                <Button size="sm" variant="ghost" onClick={confirmEdit} className="h-8 px-2 text-accent">✓</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditIdx(null)} className="h-8 px-2"><X size={14} /></Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{a}</span>
                <Button size="sm" variant="ghost" onClick={() => startEdit(i)} className="h-8 px-2"><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => removeAccount(i)} className="h-8 px-2 text-destructive"><Trash2 size={14} /></Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-border">
        <Input placeholder="Nova conta..." value={newName} onChange={e => setNewName(e.target.value)}
          className="text-sm h-9" onKeyDown={e => e.key === "Enter" && addAccount()} />
        <Button size="sm" onClick={addAccount} disabled={!newName.trim()} className="h-9"><Plus size={14} className="mr-1" />Adicionar</Button>
      </div>
    </div>
  );
}

export default function CashFlowPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<string[]>(loadAccounts);
  const [form, setForm] = useState<any>({ type: "entrada", status: "pendente", account: accounts[0], category: "Outros" });

  const handleAccountsChange = (updated: string[]) => {
    setAccounts(updated);
    saveAccounts(updated);
  };

  const load = () => getCashFlowDB().then(setEntries).catch(() => toast.error("Erro ao carregar")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.description || !form.value || !form.date) { toast.error("Preencha todos os campos obrigatórios."); return; }
    setSaving(true);
    try {
      await addCashFlowDB({
        date: form.date, description: form.description, category: form.category || "Outros",
        type: form.type || "entrada", value: Number(form.value), status: form.status || "pendente", account: form.account || accounts[0],
      });
      await load();
      setForm({ type: "entrada", status: "pendente", account: accounts[0], category: "Outros" });
      setOpen(false);
      toast.success("Lançamento adicionado!");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteCashFlowDB(id); setEntries((prev) => prev.filter((e) => e.id !== id)); toast.success("Removido."); }
    catch { toast.error("Erro ao remover"); }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Fluxo de Caixa</h1>
        <div className="flex gap-2">
          <Dialog open={accountsOpen} onOpenChange={setAccountsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Settings2 size={16} className="mr-2" />Contas</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Gerenciar Contas</DialogTitle></DialogHeader>
              <AccountsManager accounts={accounts} onChange={handleAccountsChange} />
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Novo Lançamento</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Data</Label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                    </Select></div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pago">Pago</SelectItem><SelectItem value="pendente">Pendente</SelectItem></SelectContent>
                    </Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div><Label>Conta</Label>
                    <Select value={form.account} onValueChange={(v) => setForm({ ...form, account: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{accounts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select></div>
                </div>
                <div><Label>Valor (R$)</Label><Input type="number" min="0" step="0.01" value={form.value || ""} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })} /></div>
                <Button onClick={handleAdd} className="mt-2" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead>
                <TableHead>Conta</TableHead><TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lançamento cadastrado.</TableCell></TableRow>}
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

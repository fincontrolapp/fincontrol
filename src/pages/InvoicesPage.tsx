import { useState, useEffect } from "react";
import { getInvoicesDB, addInvoiceDB, deleteInvoiceDB } from "@/lib/supabase-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = () => getInvoicesDB().then(setEntries).catch(() => toast.error("Erro ao carregar")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.number || !form.issue_date || !form.client_supplier) { toast.error("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    const gross = Number(form.gross_value || 0);
    const iss = Number(form.iss || 0);
    const pis = Number(form.pis || 0);
    const cofins = Number(form.cofins || 0);
    try {
      await addInvoiceDB({
        number: form.number, issue_date: form.issue_date, client_supplier: form.client_supplier,
        cnpj_cpf: form.cnpj_cpf || "", gross_value: gross, iss, pis, cofins,
        net_value: gross - iss - pis - cofins, pdf_link: form.pdf_link || "", competence: form.competence || "",
      });
      await load(); setForm({}); setOpen(false); toast.success("Nota adicionada!");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteInvoiceDB(id); setEntries((p) => p.filter((e) => e.id !== id)); toast.success("Removida."); }
    catch { toast.error("Erro ao remover"); }
  };

  const fmt = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Notas Fiscais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Nova Nota</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Nota</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nº da Nota</Label><Input value={form.number || ""} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
                <div><Label>Data Emissão</Label><Input type="date" value={form.issue_date || ""} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cliente/Fornecedor</Label><Input value={form.client_supplier || ""} onChange={(e) => setForm({ ...form, client_supplier: e.target.value })} /></div>
                <div><Label>CNPJ/CPF</Label><Input value={form.cnpj_cpf || ""} onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })} /></div>
              </div>
              <div><Label>Competência</Label><Input type="month" value={form.competence || ""} onChange={(e) => setForm({ ...form, competence: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor Bruto (R$)</Label><Input type="number" min="0" step="0.01" value={form.gross_value || ""} onChange={(e) => setForm({ ...form, gross_value: parseFloat(e.target.value) })} /></div>
                <div><Label>ISS (R$)</Label><Input type="number" min="0" step="0.01" value={form.iss || ""} onChange={(e) => setForm({ ...form, iss: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>PIS (R$)</Label><Input type="number" min="0" step="0.01" value={form.pis || ""} onChange={(e) => setForm({ ...form, pis: parseFloat(e.target.value) })} /></div>
                <div><Label>COFINS (R$)</Label><Input type="number" min="0" step="0.01" value={form.cofins || ""} onChange={(e) => setForm({ ...form, cofins: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Link PDF</Label><Input value={form.pdf_link || ""} onChange={(e) => setForm({ ...form, pdf_link: e.target.value })} placeholder="https://..." /></div>
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
                <TableHead>Nº</TableHead><TableHead>Emissão</TableHead><TableHead>Cliente/Forn.</TableHead>
                <TableHead>CNPJ/CPF</TableHead><TableHead>Competência</TableHead><TableHead>Bruto</TableHead>
                <TableHead>Líquido</TableHead><TableHead>PDF</TableHead><TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma nota cadastrada.</TableCell></TableRow>}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.number}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.issue_date}</TableCell>
                  <TableCell>{e.client_supplier}</TableCell>
                  <TableCell>{e.cnpj_cpf}</TableCell>
                  <TableCell>{e.competence}</TableCell>
                  <TableCell>{fmt(e.gross_value)}</TableCell>
                  <TableCell className="font-medium">{fmt(e.net_value)}</TableCell>
                  <TableCell>{e.pdf_link && <a href={e.pdf_link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"><ExternalLink size={16} /></a>}</TableCell>
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

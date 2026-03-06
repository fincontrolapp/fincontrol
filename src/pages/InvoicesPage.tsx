import { useState, useCallback } from "react";
import { InvoiceEntry } from "@/types/finance";
import { getInvoices, saveInvoices } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [entries, setEntries] = useState<InvoiceEntry[]>(getInvoices);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<InvoiceEntry>>({});

  const save = useCallback((data: InvoiceEntry[]) => { setEntries(data); saveInvoices(data); }, []);

  const handleAdd = () => {
    if (!form.number || !form.issueDate || !form.clientSupplier) {
      toast.error("Preencha os campos obrigatórios."); return;
    }
    const gross = Number(form.grossValue || 0);
    const iss = Number(form.iss || 0);
    const pis = Number(form.pis || 0);
    const cofins = Number(form.cofins || 0);
    const entry: InvoiceEntry = {
      id: crypto.randomUUID(),
      number: form.number!,
      issueDate: form.issueDate!,
      clientSupplier: form.clientSupplier!,
      cnpjCpf: form.cnpjCpf || "",
      grossValue: gross,
      iss, pis, cofins,
      netValue: gross - iss - pis - cofins,
      pdfLink: form.pdfLink || "",
      competence: form.competence || "",
    };
    save([entry, ...entries]);
    setForm({});
    setOpen(false);
    toast.success("Nota adicionada!");
  };

  const handleDelete = (id: string) => { save(entries.filter((e) => e.id !== id)); toast.success("Removida."); };
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
                <div><Label>Data Emissão</Label><Input type="date" value={form.issueDate || ""} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cliente/Fornecedor</Label><Input value={form.clientSupplier || ""} onChange={(e) => setForm({ ...form, clientSupplier: e.target.value })} /></div>
                <div><Label>CNPJ/CPF</Label><Input value={form.cnpjCpf || ""} onChange={(e) => setForm({ ...form, cnpjCpf: e.target.value })} /></div>
              </div>
              <div><Label>Competência</Label><Input type="month" value={form.competence || ""} onChange={(e) => setForm({ ...form, competence: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor Bruto (R$)</Label><Input type="number" min="0" step="0.01" value={form.grossValue || ""} onChange={(e) => setForm({ ...form, grossValue: parseFloat(e.target.value) })} /></div>
                <div><Label>ISS (R$)</Label><Input type="number" min="0" step="0.01" value={form.iss || ""} onChange={(e) => setForm({ ...form, iss: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>PIS (R$)</Label><Input type="number" min="0" step="0.01" value={form.pis || ""} onChange={(e) => setForm({ ...form, pis: parseFloat(e.target.value) })} /></div>
                <div><Label>COFINS (R$)</Label><Input type="number" min="0" step="0.01" value={form.cofins || ""} onChange={(e) => setForm({ ...form, cofins: parseFloat(e.target.value) })} /></div>
              </div>
              <div><Label>Link PDF</Label><Input value={form.pdfLink || ""} onChange={(e) => setForm({ ...form, pdfLink: e.target.value })} placeholder="https://..." /></div>
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
                <TableHead>Nº</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Cliente/Forn.</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Bruto</TableHead>
                <TableHead>Líquido</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma nota cadastrada.</TableCell></TableRow>
              )}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.number}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.issueDate}</TableCell>
                  <TableCell>{e.clientSupplier}</TableCell>
                  <TableCell>{e.cnpjCpf}</TableCell>
                  <TableCell>{e.competence}</TableCell>
                  <TableCell>{fmt(e.grossValue)}</TableCell>
                  <TableCell className="font-medium">{fmt(e.netValue)}</TableCell>
                  <TableCell>
                    {e.pdfLink && <a href={e.pdfLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"><ExternalLink size={16} /></a>}
                  </TableCell>
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

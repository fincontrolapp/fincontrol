import { useState, useCallback } from "react";
import { InventoryItem } from "@/types/finance";
import { getInventory, saveInventory } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(getInventory);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<InventoryItem>>({ unit: "Un" });

  const save = useCallback((data: InventoryItem[]) => { setItems(data); saveInventory(data); }, []);

  const handleAdd = () => {
    if (!form.name || !form.code) { toast.error("Preencha código e nome."); return; }
    const entries = Number(form.entries || 0);
    const exits = Number(form.exits || 0);
    const unitCost = Number(form.unitCost || 0);
    const balance = entries - exits;
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      code: form.code!,
      name: form.name!,
      unit: form.unit || "Un",
      minStock: Number(form.minStock || 0),
      entries, exits,
      currentBalance: balance,
      unitCost,
      totalValue: balance * unitCost,
    };
    save([item, ...items]);
    setForm({ unit: "Un" });
    setOpen(false);
    toast.success("Item adicionado!");
  };

  const handleDelete = (id: string) => { save(items.filter((i) => i.id !== id)); toast.success("Removido."); };
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Controle de Estoque</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Novo Item</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Item</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Nome</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Unidade</Label><Input value={form.unit || "Un"} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Un, Kg, Litro" /></div>
                <div><Label>Estoque Mín.</Label><Input type="number" min="0" value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) })} /></div>
                <div><Label>Custo Unit.</Label><Input type="number" min="0" step="0.01" value={form.unitCost || ""} onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Entradas</Label><Input type="number" min="0" value={form.entries || ""} onChange={(e) => setForm({ ...form, entries: parseInt(e.target.value) })} /></div>
                <div><Label>Saídas</Label><Input type="number" min="0" value={form.exits || ""} onChange={(e) => setForm({ ...form, exits: parseInt(e.target.value) })} /></div>
              </div>
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
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Un.</TableHead>
                <TableHead>Mín.</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Custo Un.</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum item cadastrado.</TableCell></TableRow>
              )}
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.code}</TableCell>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell>{i.minStock}</TableCell>
                  <TableCell>{i.entries}</TableCell>
                  <TableCell>{i.exits}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${i.currentBalance <= i.minStock && i.minStock > 0 ? "stock-low px-2 py-0.5 rounded" : ""}`}>
                      {i.currentBalance}
                    </span>
                  </TableCell>
                  <TableCell>{fmt(i.unitCost)}</TableCell>
                  <TableCell className="font-medium">{fmt(i.totalValue)}</TableCell>
                  <TableCell><button onClick={() => handleDelete(i.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

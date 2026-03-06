import { useState, useCallback, useMemo } from "react";
import { ClientContact } from "@/types/finance";
import { getClients, saveClients } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientContact[]>(getClients);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Partial<ClientContact>>({});

  const save = useCallback((data: ClientContact[]) => { setClients(data); saveClients(data); }, []);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [clients, search]);

  const handleAdd = () => {
    if (!form.name) { toast.error("Nome é obrigatório."); return; }
    const client: ClientContact = {
      id: crypto.randomUUID(),
      name: form.name!,
      phone: form.phone || "",
      email: form.email || "",
      address: form.address || "",
      birthDate: form.birthDate || "",
    };
    save([client, ...clients]);
    setForm({});
    setOpen(false);
    toast.success("Cliente adicionado!");
  };

  const handleDelete = (id: string) => { save(clients.filter((c) => c.id !== id)); toast.success("Removido."); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Novo Cliente</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>Nome</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Data de Nascimento</Label><Input type="date" value={form.birthDate || ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
              <Button onClick={handleAdd} className="mt-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{search ? "Nenhum resultado encontrado." : "Nenhum cliente cadastrado."}</TableCell></TableRow>
              )}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.address}</TableCell>
                  <TableCell>{c.birthDate}</TableCell>
                  <TableCell><button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

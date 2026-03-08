import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("display_name").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-1 text-foreground">Configurações</h1>
      <p className="text-sm text-muted-foreground mb-6">Gerencie seu perfil e preferências</p>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><User size={14} /> Perfil</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette size={14} /> Aparência</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize seu nome de exibição e informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Nome de exibição</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize a interface do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Use o ícone de lua/sol no menu lateral para alternar entre tema claro e escuro.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

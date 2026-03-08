import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    lowStock: true,
    pendingPayments: true,
  });

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

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      toast({ title: "Erro ao enviar email", variant: "destructive" });
    } else {
      toast({ title: "Email de redefinição enviado!", description: "Verifique sua caixa de entrada." });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-1 text-foreground">Configurações</h1>
      <p className="text-sm text-muted-foreground mb-6">Gerencie seu perfil, segurança e preferências</p>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><User size={14} /> Perfil</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell size={14} /> Notificações</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield size={14} /> Segurança</TabsTrigger>
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

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Escolha quais alertas deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Notificações por email</p>
                  <p className="text-sm text-muted-foreground">Receba resumos e alertas por email</p>
                </div>
                <Switch checked={notifications.email} onCheckedChange={(v) => setNotifications({ ...notifications, email: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Alerta de estoque mínimo</p>
                  <p className="text-sm text-muted-foreground">Avise quando produtos atingirem o estoque mínimo</p>
                </div>
                <Switch checked={notifications.lowStock} onCheckedChange={(v) => setNotifications({ ...notifications, lowStock: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Pagamentos pendentes</p>
                  <p className="text-sm text-muted-foreground">Lembre de lançamentos com status pendente</p>
                </div>
                <Switch checked={notifications.pendingPayments} onCheckedChange={(v) => setNotifications({ ...notifications, pendingPayments: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground mb-1">Alterar senha</p>
                <p className="text-sm text-muted-foreground mb-3">Enviaremos um link de redefinição para seu email</p>
                <Button variant="outline" onClick={handleChangePassword}>Enviar email de redefinição</Button>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-destructive mb-1">Zona de perigo</p>
                <p className="text-sm text-muted-foreground mb-3">Ações irreversíveis para sua conta</p>
                <Button variant="destructive" size="sm" disabled>Excluir conta (em breve)</Button>
              </div>
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
              <p className="text-muted-foreground">Em breve: tema escuro, tamanho de fonte e personalização de cores.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

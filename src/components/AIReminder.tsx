import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  color: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function AIReminder({ appointments }: { appointments: Appointment[] }) {
  const [reminder, setReminder] = useState("");
  const [loading, setLoading] = useState(false);

  const generateReminder = async () => {
    if (appointments.length === 0) {
      setReminder("📋 Você não tem agendamentos cadastrados. Crie um compromisso para receber lembretes inteligentes!");
      return;
    }

    setLoading(true);
    setReminder("");

    const today = new Date().toISOString().split("T")[0];
    const summary = appointments
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 15)
      .map((a) => `• ${a.date} às ${a.time} (${a.duration}min): ${a.title}${a.notes ? ` — ${a.notes}` : ""}`)
      .join("\n");

    const userMessage = `Hoje é ${today}. Aqui estão meus próximos agendamentos:\n${summary}\n\nGere um lembrete inteligente e breve (máx 4 linhas) com o que tenho de mais importante hoje e nos próximos dias. Dê dicas de preparação se aplicável. Seja direto e amigável.`;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: userMessage }], mode: "tips" }),
      });

      if (!resp.ok) throw new Error("Erro ao gerar lembrete");
      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setReminder(full);
            }
          } catch {}
        }
      }
    } catch (e) {
      setReminder("⚠️ Não foi possível gerar o lembrete. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-accent">
            <Sparkles size={16} />
            Lembrete IA
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateReminder}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {reminder ? "Atualizar" : "Gerar"}
          </Button>
        </div>
        {reminder ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90">
            <ReactMarkdown>{reminder}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Clique em "Gerar" para receber um lembrete inteligente baseado nos seus agendamentos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

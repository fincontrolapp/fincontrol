import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Lightbulb, BarChart3, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

async function streamChat({
  messages,
  mode,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  mode: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, mode }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
    throw new Error(err.error || `Erro ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Sou o **FinBot**, seu assistente financeiro. Como posso ajudar?\n\nVocê pode me perguntar sobre:\n- 📊 Análise de fluxo de caixa\n- 💡 Dicas financeiras\n- 📋 Gestão de notas fiscais\n- 📦 Controle de estoque" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string, mode = "chat") => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.content === text) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        mode,
        onDelta: upsert,
        onDone: () => setLoading(false),
      });
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${e.message}` }]);
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Dicas Financeiras", icon: Lightbulb, prompt: "Me dê 5 dicas práticas para melhorar o controle financeiro do meu negócio", mode: "tips" },
    { label: "Analisar Finanças", icon: BarChart3, prompt: "Quais são os principais indicadores financeiros que devo acompanhar no meu negócio?", mode: "analysis" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-accent/10">
          <Sparkles size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Assistente IA</h1>
          <p className="text-sm text-muted-foreground">Converse com o FinBot para análises e dicas financeiras</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 border rounded-xl bg-card overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex gap-2 flex-wrap">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => send(a.prompt, a.mode)}
                className="flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg px-3 py-2 transition-colors"
              >
                <a.icon size={14} />
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Pergunte ao FinBot..."
            className="text-sm"
            disabled={loading}
          />
          <Button size="icon" onClick={() => send(input)} disabled={loading || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

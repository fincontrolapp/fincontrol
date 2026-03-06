import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      chat: `Você é o FinBot, assistente financeiro inteligente do FinControl. Você ajuda empreendedores brasileiros com:
- Análise de fluxo de caixa e orçamento
- Dicas de gestão financeira empresarial
- Interpretação de notas fiscais e impostos (ISS, PIS, COFINS)
- Controle de estoque e custos
- Planejamento financeiro e redução de despesas
Responda sempre em português brasileiro, de forma clara e prática. Use exemplos reais quando possível.`,
      analysis: `Você é um consultor financeiro especializado em análise de dados. O usuário vai enviar dados financeiros e você deve:
1. Identificar padrões e tendências
2. Apontar riscos e oportunidades
3. Dar recomendações práticas e acionáveis
4. Usar linguagem acessível para empreendedores
Responda em português brasileiro com formatação clara usando markdown.`,
      tips: `Você é um mentor financeiro para pequenos e médios empreendedores brasileiros. Gere 5 dicas práticas e acionáveis sobre o tema solicitado. Use bullet points, seja direto e inclua exemplos práticos. Responda em português brasileiro.`,
    };

    const systemContent = systemPrompts[mode] || systemPrompts.chat;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

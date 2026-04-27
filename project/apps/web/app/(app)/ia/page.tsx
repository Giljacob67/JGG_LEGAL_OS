"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Bot, User, Loader2 } from "lucide-react";
import { streamAI, AIProvider, getProviderLabel, AIMessage } from "@/lib/ai/gateway";

const PROVIDERS: AIProvider[] = ["claude", "openai", "kimi", "openrouter", "ollama"];

export default function IAPage() {
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: "system", content: "Voce e um assistente juridico senior do escritorio JGG GROUP, especializado em direito Agrario, Bancario e Tributario. Responda de forma precisa, tecnica e fundamentada." },
    { role: "assistant", content: "Ola, Dr. Gilberto. Estou pronto para auxiliar em analises juridicas, revisao de documentos, pesquisa de jurisprudencia e elaboracao de pecas. Como posso ajudar?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: AIMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = [...messages, userMsg];
    let assistantText = "";

    try {
      const stream = streamAI({ provider, messages: history });
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        assistantText += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantText };
          return next;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-card">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl">IA Juridica</h1>
            <span className="px-2 py-0.5 rounded-full bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)] text-[10px] font-semibold tracking-wide">BETA Â· USO INTERNO</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Multi-provider: Claude Â· OpenAI Â· Kimi Â· OpenRouter Â· Ollama
          </p>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as AIProvider)}
          className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>{getProviderLabel(p)}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.filter(m => m.role !== "system").map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "assistant" ? "bg-card border" : "bg-primary text-primary-foreground"}`}>
              {msg.content || <Loader2 className="animate-spin w-4 h-4" />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2">
          <button type="button" className="p-2.5 rounded-lg border border-input hover:bg-muted text-muted-foreground shrink-0" title="Anexar arquivo">
            <Paperclip size={18} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder="Pergunte sobre processos, jurisprudencia, analise de documentos..."
            className="flex-1 min-h-[44px] max-h-[160px] resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 shrink-0 transition-opacity"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          A IA e uma ferramenta de apoio. A revisao final do advogado e obrigatoria antes de qualquer protocolo.
        </p>
      </div>
    </div>
  );
}

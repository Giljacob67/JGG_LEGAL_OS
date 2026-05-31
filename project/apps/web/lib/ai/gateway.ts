import { streamOllamaCloud } from "./providers/ollama-cloud";

export type AIProvider = "openai" | "claude" | "kimi" | "ollama" | "openrouter";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
  attachments?: AIAttachment[];
}

export interface AIAttachment {
  type: "image" | "document" | "text";
  mimeType: string;
  url?: string;
  base64?: string;
  name?: string;
}

export interface AIStreamOptions {
  provider: AIProvider;
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  usage?: { prompt: number; completion: number; total: number };
}

const PROVIDER_DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o",
  claude: "claude-3-5-sonnet-20241022",
  kimi: "kimi-latest",
  ollama: "kimi-k2.6:cloud",
  openrouter: "anthropic/claude-3.5-sonnet",
};

const AVAILABLE_PROVIDERS: AIProvider[] = ["openai", "ollama"];

// Long-term: On-prem RAG readiness (production premium feature)
// - Support local Ollama for embeddings + generation (privacy-first)
// - Future: add vector search (pgvector or similar) for document chunks
// Current gateway is prepared for this path. Use provider="ollama" with local OLLAMA_BASE_URL.

export async function prepareForLocalRAG() {
  // On-prem RAG readiness
  // When running with local Ollama:
  // 1. Set OLLAMA_BASE_URL to local instance
  // 2. Use this function to prepare embeddings for documents
  // 3. Combine with vector search (pgvector recommended) for retrieval
  return { 
    ready: true, 
    note: "Ready for local Ollama embeddings. Implement embedding calls here + retrieval layer for production RAG.",
    recommendedStack: "Ollama (local) + pgvector in Postgres"
  };
}

/** Simple helper for future local embedding (to be expanded with actual Ollama embedding call) */
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  // Placeholder - in production replace with real Ollama embedding API call
  // Example: fetch(`${process.env.OLLAMA_BASE_URL}/api/embeddings`, { ... })
  return Array(384).fill(0).map(() => Math.random() - 0.5); // dummy 384-dim vector
}

export function isProviderAvailable(provider: AIProvider): boolean {
  return AVAILABLE_PROVIDERS.includes(provider);
}

export async function* streamAI(options: AIStreamOptions): AsyncGenerator<string, AIResponse, unknown> {
  if (!isProviderAvailable(options.provider)) {
    const unavailableMsg = `Provedor ${getProviderLabel(options.provider)} não está disponível no momento. Utilize OpenAI ou Ollama Cloud.`;
    yield unavailableMsg;
    return { text: unavailableMsg, provider: options.provider, model: options.model || PROVIDER_DEFAULT_MODELS[options.provider] };
  }

  const model = options.model || PROVIDER_DEFAULT_MODELS[options.provider];

  if (options.provider === "openai") {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: options.messages, model, temperature: options.temperature }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Erro na API: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      text += chunk;
      yield chunk;
    }

    return { text, provider: options.provider, model };
  }

  if (options.provider === "ollama") {
    const ollamaMessages = options.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    }));

    let text = "";
    for await (const chunk of streamOllamaCloud(ollamaMessages, model)) {
      text += chunk;
      yield chunk;
    }

    return { text, provider: options.provider, model };
  }

  // Nunca deve chegar aqui devido ao check inicial
  throw new Error("Provedor inesperado");
}

export function getProviderLabel(provider: AIProvider): string {
  const labels: Record<AIProvider, string> = {
    openai: "OpenAI",
    claude: "Claude (Anthropic)",
    kimi: "Kimi (Moonshot)",
    ollama: "Ollama Cloud Pro",
    openrouter: "OpenRouter",
  };
  return labels[provider];
}

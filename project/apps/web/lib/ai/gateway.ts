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

/** 
 * Generate embedding vector using local Ollama (on-prem RAG path).
 * Falls back to deterministic dummy vector if Ollama is unreachable (dev/CI safe).
 * Set OLLAMA_BASE_URL (e.g. http://localhost:11434) to enable real local embeddings.
 */
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    // Dev/CI fallback — consistent enough for testing retrieval wiring
    const seed = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 384 }, (_, i) => Math.sin(seed + i) * 0.5);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
        prompt: text.slice(0, 8000), // guard against huge inputs
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn("[RAG] Ollama embedding failed, using fallback vector");
      return Array.from({ length: 384 }, (_, i) => Math.sin(text.length + i) * 0.4);
    }

    const data = await res.json();
    const emb = data?.embedding;
    if (Array.isArray(emb) && emb.length > 0) {
      return emb.slice(0, 384); // normalize to expected dim
    }
    return Array.from({ length: 384 }, (_, i) => Math.sin(text.length + i) * 0.4);
  } catch (err) {
    clearTimeout(timeout);
    console.warn("[RAG] Ollama unreachable — using local fallback embedding for", text.slice(0, 40));
    return Array.from({ length: 384 }, (_, i) => Math.sin(text.length + i) * 0.4);
  }
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

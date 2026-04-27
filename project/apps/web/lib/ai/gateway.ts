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

export async function* streamAI(options: AIStreamOptions): AsyncGenerator<string, AIResponse, unknown> {
  const model = options.model || PROVIDER_DEFAULT_MODELS[options.provider];

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

    return {
      text,
      provider: options.provider,
      model,
    };
  }

  // Fallback simulado para outros providers ate integrarmos
  const fullText = "Resposta simulada do provedor **" + options.provider + "** (modelo: " + model + "). Em producao, este gateway fara chamadas reais as APIs.";
  const chunks = fullText.split(" ");
  let accumulated = "";
  for (const chunk of chunks) {
    await new Promise((r) => setTimeout(r, 40));
    accumulated += chunk + " ";
    yield chunk + " ";
  }

  return {
    text: accumulated.trim(),
    provider: options.provider,
    model,
    usage: { prompt: 120, completion: 80, total: 200 },
  };
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
export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function* streamOllamaCloud(
  messages: OllamaMessage[],
  model: string = "kimi-k2.6:cloud"
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.OLLAMA_CLOUD_API_KEY;
  const baseUrl = process.env.OLLAMA_CLOUD_BASE_URL || "https://api.ollama.ai/v1";

  if (!apiKey) {
    throw new Error("OLLAMA_CLOUD_API_KEY nao configurada");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama Cloud erro ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Resposta sem stream");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // ignora linhas malformadas
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
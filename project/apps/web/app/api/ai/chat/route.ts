import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getAuthUser } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return new Response("Nao autenticado", { status: 401 });

  const { messages, model = "gpt-4o", temperature = 0.3 } = await req.json();

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      temperature,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    return new Response(error.message || "Erro na API OpenAI", { status: 500 });
  }
}

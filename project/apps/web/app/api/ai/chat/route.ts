import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.ia_use)) {
      throw new AppError("Sem permissão para usar IA", 403, "FORBIDDEN");
    }

    const { messages, model = "gpt-4o", temperature = 0.3 } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError("OPENAI_API_KEY não configurada", 500, "CONFIG_ERROR", false);
    }

    // Import dinâmico para evitar erro no build time
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

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
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

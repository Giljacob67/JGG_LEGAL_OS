import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { z } from "zod";

const ALLOWED_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] as const;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(32000),
      })
    )
    .min(1)
    .max(50),
  model: z.enum(ALLOWED_MODELS).default("gpt-4o"),
  temperature: z.number().min(0).max(2).default(0.3),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.ia_use)) {
      throw new AppError("Sem permissão para usar IA", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        `Payload inválido: ${parsed.error.issues[0]?.message || "entrada inválida"}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const { messages, model, temperature } = parsed.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError("OPENAI_API_KEY não configurada", 500, "CONFIG_ERROR", false);
    }

    // Import dinâmico para evitar erro no build time
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
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
    return handleApiError(error);
  }
}

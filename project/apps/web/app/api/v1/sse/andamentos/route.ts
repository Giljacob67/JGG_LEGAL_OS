/**
 * Server-Sent Events (SSE) para notificacoes de novos andamentos.
 *
 * Uso por processo: new EventSource("/api/v1/sse/andamentos?processoId=abc&since=...")
 * Uso global:       new EventSource("/api/v1/sse/andamentos?since=...")
 *
 * NOTA: Em producao serverless (Vercel), conexoes longas podem ser terminadas
 * prematuramente. Para escala, considere Pusher/Ably/Soketi.
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const processoId = searchParams.get("processoId");
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date();

  let processoIds: string[] | null = null;

  if (processoId) {
    processoIds = [processoId];
  } else {
    // Modo global: buscar todos os processos do usuario logado
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new Response("Unauthorized", { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) {
      return new Response("Usuario nao encontrado", { status: 404 });
    }
    const processos = await prisma.processo.findMany({
      where: {
        OR: [
          { responsavelId: user.id },
          { equipe: { some: { id: user.id } } },
        ],
      },
      select: { id: true },
    });
    processoIds = processos.map((p) => p.id);
    if (processoIds.length === 0) {
      // Sem processos: retorna stream vazio que so envia connected
      processoIds = null;
    }
  }

  const encoder = new TextEncoder();
  let lastCheck = since;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Enviar header de conexao
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }
        if (!processoIds) return; // sem processos, nao faz polling

        try {
          const novos = await prisma.andamento.findMany({
            where: {
              processoId: processoIds.length === 1 ? processoIds[0] : { in: processoIds },
              createdAt: { gt: lastCheck },
            },
            orderBy: { createdAt: "asc" },
            take: 20,
            include: {
              processo: { select: { id: true, cnj: true } },
            },
          });

          if (novos.length > 0) {
            lastCheck = novos[novos.length - 1].createdAt;
            for (const a of novos) {
              const payload = JSON.stringify({
                id: a.id,
                processoId: a.processoId,
                cnj: a.processo?.cnj,
                data: a.data,
                evento: a.evento,
                descricao: a.descricao,
                fonte: a.fonte,
                critico: a.critico,
                createdAt: a.createdAt,
              });
              controller.enqueue(
                encoder.encode(`event: novo_andamento\ndata: ${payload}\n\n`)
              );
            }
          }
        } catch {
          // Ignorar erros de polling
        }
      }, 5000); // poll a cada 5s

      // Timeout de seguranca: fechar apos 5 minutos
      setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // ja fechado
        }
      }, 5 * 60 * 1000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

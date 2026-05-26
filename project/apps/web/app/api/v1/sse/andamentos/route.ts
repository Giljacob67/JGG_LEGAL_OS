/**
 * Server-Sent Events (SSE) para notificacoes de novos andamentos.
 *
 * Uso por processo: new EventSource("/api/v1/sse/andamentos?processoId=abc&since=...")
 * Uso global:       new EventSource("/api/v1/sse/andamentos?since=...")
 */

import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, getProcessoListWhere } from "@/lib/auth";
import { AppError } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const processoId = searchParams.get("processoId");
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date();

  let processoIds: string[] | null = null;

  try {
    if (processoId) {
      await assertProcessoAccess(user, processoId);
      processoIds = [processoId];
    } else {
      const processos = await prisma.processo.findMany({
        where: getProcessoListWhere(user),
        select: { id: true },
      });
      processoIds = processos.map((p) => p.id);
      if (processoIds.length === 0) {
        processoIds = null;
      }
    }
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return new Response("Processo não encontrado", { status: 404 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let lastCheck = since;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }
        if (!processoIds) return;

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
      }, 5000);

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

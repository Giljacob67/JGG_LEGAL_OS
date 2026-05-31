/**
 * Webhook do process-monitor → Next.js
 *
 * Recebe notificações de novas movimentações processuais
 * e insere/ atualiza andamentos no banco Prisma.
 *
 * Autenticação: Header X-Webhook-Key com valor de PROCESS_MONITOR_WEBHOOK_KEY
 */

import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const WEBHOOK_KEY = process.env.PROCESS_MONITOR_WEBHOOK_KEY;

const movementSchema = z.object({
  data: z.string().nullable(),
  descricao_original: z.string().max(2000),
  tipo_evento: z.string().nullable(),
});

const webhookPayloadSchema = z.object({
  event: z.literal("new_movements"),
  process_id: z.string().optional(),
  numero_cnj: z.string().nullable(),
  tribunal: z.string(),
  new_movements_count: z.number().optional(),
  movements: z.array(movementSchema).min(1).max(500),
  timestamp: z.string().optional(),
});

function validateAuth(req: Request): boolean {
  if (!WEBHOOK_KEY) {
    logger.warn("PROCESS_MONITOR_WEBHOOK_KEY não configurado");
    return false;
  }
  const headerKey = req.headers.get("x-webhook-key");
  if (!headerKey) return false;

  const headerBuf = Buffer.from(headerKey, "utf-8");
  const expectedBuf = Buffer.from(WEBHOOK_KEY, "utf-8");
  if (headerBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(headerBuf, expectedBuf);
}

export async function POST(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = webhookPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const { numero_cnj, tribunal, movements } = payload;

    if (!numero_cnj) {
      return NextResponse.json(
        { error: "Payload inválido: numero_cnj ausente" },
        { status: 400 }
      );
    }

    // Buscar processo pelo CNJ
    const processo = await prisma.processo.findUnique({
      where: { cnj: numero_cnj },
      select: { id: true, responsavelId: true },
    });

    if (!processo) {
      logger.warn("Processo não encontrado para CNJ no webhook", { numero_cnj });
      return NextResponse.json(
        { error: "Processo não encontrado", cnj: numero_cnj },
        { status: 404 }
      );
    }

    // Inserir novos andamentos
    const created: Array<{ id: string; evento: string; data: Date }> = [];
    for (const mov of movements) {
      if (!mov.data || !mov.descricao_original) continue;

      const dataMov = new Date(mov.data + "T00:00:00-03:00");
      if (isNaN(dataMov.getTime())) continue;

      // Evitar duplicatas por data + descrição
      const existing = await prisma.andamento.findFirst({
        where: {
          processoId: processo.id,
          data: dataMov,
          descricao: mov.descricao_original,
        },
      });

      if (existing) continue;

      const andamento = await prisma.andamento.create({
        data: {
          processoId: processo.id,
          data: dataMov,
          evento: mov.tipo_evento || "outro",
          descricao: mov.descricao_original,
          fonte: tribunal,
          critico: isCriticalMovement(mov.tipo_evento, mov.descricao_original),
        },
      });

      created.push({ id: andamento.id, evento: andamento.evento, data: andamento.data });
    }

    // Atualizar ultimoAndamento do processo
    if (created.length > 0) {
      const latest = created.reduce((a, b) => (a.data > b.data ? a : b));
      await prisma.processo.update({
        where: { id: processo.id },
        data: { ultimoAndamento: latest.data },
      });
    }

    // Premium security / LGPD audit trail for external data ingestion (critical for compliance)
    if (created.length > 0) {
      await prisma.auditLog.create({
        data: {
          userId: null,
          userEmail: "system@process-monitor",
          acao: "INGEST",
          entidade: "Andamento",
          entidadeId: processo.id,
          diff: {
            fonte: "process-monitor",
            tribunal,
            cnj: numero_cnj,
            count: created.length,
            eventos: created.map((a) => a.evento),
          } as any,
        },
      }).catch(() => {});
    }

    logger.info("Webhook process-monitor: andamentos inseridos", {
      count: created.length,
      numero_cnj,
    });

    return NextResponse.json(
      {
        success: true,
        processoId: processo.id,
        inseridos: created.length,
        andamentos: created.map((a) => ({ id: a.id, evento: a.evento })),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Erro ao processar webhook process-monitor", error);
    return NextResponse.json(
      { error: "Erro interno ao processar webhook" },
      { status: 500 }
    );
  }
}

function isCriticalMovement(tipo: string | null, descricao: string): boolean {
  const lower = (tipo || "").toLowerCase() + " " + descricao.toLowerCase();
  const criticalKeywords = [
    "sentença",
    "decisão",
    "acórdão",
    "transito em julgado",
    "arquivamento",
    "baixa",
    "execução",
    "penhora",
    "bloqueio",
    "liminar",
    "tutela",
    "mandado",
    "intimação",
    "citacao",
    "audiencia",
  ];
  return criticalKeywords.some((k) => lower.includes(k));
}

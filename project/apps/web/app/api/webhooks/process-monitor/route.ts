/**
 * Webhook do process-monitor → Next.js
 *
 * Recebe notificações de novas movimentações processuais
 * e insere/ atualiza andamentos no banco Prisma.
 *
 * Autenticação: Header X-Webhook-Key com valor de PROCESS_MONITOR_WEBHOOK_KEY
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const WEBHOOK_KEY = process.env.PROCESS_MONITOR_WEBHOOK_KEY;

interface WebhookPayload {
  event: "new_movements";
  process_id: string;
  numero_cnj: string | null;
  tribunal: string;
  new_movements_count: number;
  movements: Array<{
    data: string | null;
    descricao_original: string;
    tipo_evento: string | null;
  }>;
  timestamp: string;
}

function validateAuth(req: Request): boolean {
  if (!WEBHOOK_KEY) {
    console.warn("[PROCESS_MONITOR_WEBHOOK] PROCESS_MONITOR_WEBHOOK_KEY não configurado");
    return false;
  }
  const headerKey = req.headers.get("x-webhook-key");
  return headerKey === WEBHOOK_KEY;
}

export async function POST(req: Request) {
  try {
    if (!validateAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as WebhookPayload;

    if (payload.event !== "new_movements") {
      return NextResponse.json(
        { error: `Evento não suportado: ${payload.event}` },
        { status: 400 }
      );
    }

    const { numero_cnj, tribunal, movements } = payload;

    if (!numero_cnj || movements.length === 0) {
      return NextResponse.json(
        { error: "Payload inválido: numero_cnj ou movements ausentes" },
        { status: 400 }
      );
    }

    // Buscar processo pelo CNJ
    const processo = await prisma.processo.findUnique({
      where: { cnj: numero_cnj },
      select: { id: true, responsavelId: true },
    });

    if (!processo) {
      console.warn(
        `[PROCESS_MONITOR_WEBHOOK] Processo não encontrado para CNJ: ${numero_cnj}`
      );
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

    console.log(
      `[PROCESS_MONITOR_WEBHOOK] ${created.length} andamentos inseridos para ${numero_cnj}`
    );

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
    console.error("[PROCESS_MONITOR_WEBHOOK] Erro:", error);
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

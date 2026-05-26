import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccessibleProcessoWhere, getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/[id]/dashboard - Métricas do processo
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const processo = await prisma.processo.findFirst({
      where: getAccessibleProcessoWhere(user, id),
      include: {
        andamentos: {
          where: { deletedAt: null },
          orderBy: { data: "desc" },
        },
        prazos: {
          where: { deletedAt: null },
        },
        documentos: {
          where: { deletedAt: null },
        },
      },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    // Andamentos por mês (últimos 12 meses)
    const andamentosPorMes: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      andamentosPorMes[key] = 0;
    }

    processo.andamentos.forEach((a) => {
      const d = new Date(a.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in andamentosPorMes) {
        andamentosPorMes[key]++;
      }
    });

    const porMes = Object.entries(andamentosPorMes).map(([mes, count]) => ({
      mes: mes.slice(5) + "/" + mes.slice(2, 4),
      count,
    }));

    // Documentos por tipo
    const docPorTipo: Record<string, number> = {};
    processo.documentos.forEach((d) => {
      docPorTipo[d.tipo] = (docPorTipo[d.tipo] || 0) + 1;
    });

    const documentosPorTipo = Object.entries(docPorTipo).map(([tipo, count]) => ({
      tipo,
      count,
    }));

    // Prazos
    const prazosAbertos = processo.prazos.filter((p) => p.status === "aberto").length;
    const prazosCumpridos = processo.prazos.filter((p) => p.status === "cumprido").length;
    const prazosPerdidos = processo.prazos.filter((p) => p.status === "perdido").length;

    // Tempo
    const diasDesdeDistribuicao = processo.distribuicao
      ? Math.floor((now.getTime() - new Date(processo.distribuicao).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const ultimoAndamento = processo.andamentos[0];
    const diasDesdeUltimoAndamento = ultimoAndamento
      ? Math.floor((now.getTime() - new Date(ultimoAndamento.data).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return NextResponse.json({
      andamentos: {
        total: processo.andamentos.length,
        porMes,
        criticos: processo.andamentos.filter((a) => a.critico).length,
      },
      prazos: {
        total: processo.prazos.length,
        abertos: prazosAbertos,
        cumpridos: prazosCumpridos,
        perdidos: prazosPerdidos,
      },
      documentos: {
        total: processo.documentos.length,
        porTipo: documentosPorTipo,
      },
      tempo: {
        diasDesdeDistribuicao,
        diasDesdeUltimoAndamento,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

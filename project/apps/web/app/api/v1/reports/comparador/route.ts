import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// POST /api/v1/reports/comparador - Comparar 2-3 processos
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.relatorio_view);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { processoIds } = await req.json();

    if (!Array.isArray(processoIds) || processoIds.length < 2 || processoIds.length > 3) {
      return NextResponse.json(
        { error: "Selecione entre 2 e 3 processos para comparar" },
        { status: 400 }
      );
    }

    const processos = await prisma.processo.findMany({
      where: { id: { in: processoIds } },
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        andamentos: {
          orderBy: { data: "desc" },
          take: 50,
        },
        prazos: {
          orderBy: { vence: "desc" },
        },
        documentos: true,
        honorarios: {
          include: { faturas: true },
        },
      },
    });

    if (processos.length !== processoIds.length) {
      return NextResponse.json(
        { error: "Um ou mais processos não foram encontrados" },
        { status: 404 }
      );
    }

    // Calcular métricas para cada processo
    const processosComMetricas = processos.map((processo) => {
      const diasDesdeDistribuicao = processo.distribuicao
        ? Math.floor((Date.now() - new Date(processo.distribuicao).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const diasDesdeUltimoAndamento = processo.andamentos[0]
        ? Math.floor((Date.now() - new Date(processo.andamentos[0].data).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...processo,
        metricas: {
          diasDesdeDistribuicao,
          diasDesdeUltimoAndamento,
          totalAndamentos: processo.andamentos.length,
          andamentosCriticos: processo.andamentos.filter((a) => a.critico).length,
          totalPrazos: processo.prazos.length,
          prazosCumpridos: processo.prazos.filter((p) => p.status === "cumprido").length,
          prazosPendentes: processo.prazos.filter((p) => p.status === "aberto").length,
          prazosPerdidos: processo.prazos.filter((p) => p.status === "perdido").length,
          totalDocumentos: processo.documentos.length,
          totalHonorarios: processo.honorarios.reduce((acc, h) => acc + (Number(h.valorFixo) || 0), 0),
        },
      };
    });

    return NextResponse.json({
      processos: processosComMetricas,
      geradoEm: new Date().toISOString(),
      geradoPor: user.nome,
    });
  } catch (error) {
    logger.error("Erro ao comparar processos", error);
    return NextResponse.json(
      { error: "Erro ao comparar processos" },
      { status: 500 }
    );
  }
}

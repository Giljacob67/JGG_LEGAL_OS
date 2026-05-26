import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccessibleProcessoWhere, getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/reports/processo/[id] - Relatório completo de um processo
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.relatorio_view);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const processo = await prisma.processo.findFirst({
      where: getAccessibleProcessoWhere(user, id),
      include: {
        cliente: true,
        responsavel: { select: { id: true, nome: true, email: true } },
        equipe: { select: { id: true, nome: true, email: true } },
        andamentos: {
          orderBy: { data: "desc" },
          take: 100,
        },
        documentos: {
          orderBy: { createdAt: "desc" },
        },
        prazos: {
          orderBy: { vence: "desc" },
        },
        honorarios: {
          include: {
            faturas: true,
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            autor: { select: { nome: true } },
          },
        },
      },
    });

    if (!processo) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
    }

    // Calcular estatísticas
    const stats = {
      totalAndamentos: processo.andamentos.length,
      andamentosCriticos: processo.andamentos.filter((a) => a.critico).length,
      totalDocumentos: processo.documentos.length,
      totalPrazos: processo.prazos.length,
      prazosCumpridos: processo.prazos.filter((p) => p.status === "cumprido").length,
      prazosPendentes: processo.prazos.filter((p) => p.status === "aberto").length,
      prazosPerdidos: processo.prazos.filter((p) => p.status === "perdido").length,
      totalHonorarios: processo.honorarios.reduce((acc, h) => acc + (Number(h.valorFixo) || 0), 0),
      totalFaturas: processo.honorarios.reduce((acc, h) => acc + h.faturas.length, 0),
    };

    return NextResponse.json({
      processo,
      stats,
      geradoEm: new Date().toISOString(),
      geradoPor: user.nome,
    });
  } catch (error) {
    logger.error("Erro ao gerar relatório de processo", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}

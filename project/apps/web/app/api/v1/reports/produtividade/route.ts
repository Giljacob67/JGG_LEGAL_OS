import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoScope } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/reports/produtividade - Relatório de produtividade por advogado/período
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.relatorio_view);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const userId = searchParams.get("userId");

    const processoScope = getProcessoScope(user);

    let where: any = {};
    if (dataInicio) where.createdAt = { ...where.createdAt, gte: new Date(dataInicio) };
    if (dataFim) where.createdAt = { ...where.createdAt, lte: new Date(dataFim) };
    if (userId) where.responsavelId = userId;

    // Apply scoping for restricted roles
    if (Object.keys(processoScope).length > 0) {
      where = { ...where, ...processoScope };
    }

    const processos = await prisma.processo.findMany({
      where,
      include: {
        responsavel: { select: { id: true, nome: true } },
        andamentos: true,
        prazos: true,
        documentos: true,
      },
    });

    // Agrupar por responsável
    const porResponsavel = processos.reduce((acc, processo) => {
      const respId = processo.responsavelId;
      if (!acc[respId]) {
        acc[respId] = {
          responsavel: processo.responsavel,
          totalProcessos: 0,
          totalAndamentos: 0,
          totalPrazos: 0,
          prazosCumpridos: 0,
          prazosPerdidos: 0,
          totalDocumentos: 0,
        };
      }
      acc[respId].totalProcessos++;
      acc[respId].totalAndamentos += processo.andamentos.length;
      acc[respId].totalPrazos += processo.prazos.length;
      acc[respId].prazosCumpridos += processo.prazos.filter((p) => p.status === "cumprido").length;
      acc[respId].prazosPerdidos += processo.prazos.filter((p) => p.status === "perdido").length;
      acc[respId].totalDocumentos += processo.documentos.length;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      periodo: { dataInicio, dataFim },
      porResponsavel: Object.values(porResponsavel),
      geradoEm: new Date().toISOString(),
      geradoPor: user.nome,
    });
  } catch (error) {
    logger.error("Erro ao gerar relatório de produtividade", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}

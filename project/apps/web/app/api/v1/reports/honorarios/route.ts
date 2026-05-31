import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoScope } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/reports/honorarios - Relatório de honorários
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
    const clienteId = searchParams.get("clienteId");
    const processoId = searchParams.get("processoId");

    const processoScope = getProcessoScope(user);

    const where: any = {};
    if (dataInicio) where.createdAt = { ...where.createdAt, gte: new Date(dataInicio) };
    if (dataFim) where.createdAt = { ...where.createdAt, lte: new Date(dataFim) };
    if (clienteId) where.clienteId = clienteId;
    if (processoId) where.processoId = processoId;

    // Apply scoping for restricted roles
    if (Object.keys(processoScope).length > 0) {
      where.processo = processoScope;
    }

    const honorarios = await prisma.contratoHonorarios.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        processo: { select: { id: true, cnj: true } },
        faturas: {
          orderBy: { vencimento: "asc" },
        },
      },
    });

    // Calcular totais
    const totais = honorarios.reduce(
      (acc, h) => {
        acc.totalContratos++;
        acc.valorTotal += Number(h.valorFixo) || 0;
        acc.totalFaturas += h.faturas.length;
        acc.faturasPagas += h.faturas.filter((f) => f.status === "pago").length;
        acc.faturasPendentes += h.faturas.filter((f) => f.status === "pendente").length;
        acc.valorRecebido += h.faturas
          .filter((f) => f.status === "pago")
          .reduce((sum, f) => sum + Number(f.valor), 0);
        acc.valorPendente += h.faturas
          .filter((f) => f.status === "pendente")
          .reduce((sum, f) => sum + Number(f.valor), 0);
        return acc;
      },
      {
        totalContratos: 0,
        valorTotal: 0,
        totalFaturas: 0,
        faturasPagas: 0,
        faturasPendentes: 0,
        valorRecebido: 0,
        valorPendente: 0,
      }
    );

    return NextResponse.json({
      honorarios,
      totais,
      periodo: { dataInicio, dataFim },
      geradoEm: new Date().toISOString(),
      geradoPor: user.nome,
    });
  } catch (error) {
    logger.error("Erro ao gerar relatório de honorários", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}

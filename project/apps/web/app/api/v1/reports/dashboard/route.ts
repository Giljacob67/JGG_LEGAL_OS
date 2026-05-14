import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.relatorio_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const seteDias = new Date(hoje);
    seteDias.setDate(hoje.getDate() + 7);
    const trintaDias = new Date(hoje);
    trintaDias.setDate(hoje.getDate() + 30);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [
      // Financeiro
      receitaTotal,
      receitaPendente,
      receitaAtrasada,
      receitaPorMes,

      // Processos
      processosAtivos,
      processosEncerrados,
      processosPorArea,
      processosPorStatus,
      processosPorRisco,
      valorLitigioTotal,
      processosMaisAntigos,

      // Clientes
      clientesAtivos,
      clientesInativos,
      clientesPorStatus,
      topClientesPorValor,

      // Prazos
      prazosHoje,
      prazosSemana,
      prazosVencidos,
      prazosProximos,

      // Produtividade
      horasTrabalhadasMes,
      rankingAdvogados,
      tarefasPorStatus,

      // Faturas
      faturasPorStatus,
    ] = await Promise.all([
      // Receita total
      prisma.fatura.aggregate({ _sum: { valor: true }, where: { status: "pago", deletedAt: null } }),
      prisma.fatura.aggregate({ _sum: { valor: true }, where: { status: "pendente", deletedAt: null } }),
      prisma.fatura.aggregate({ _sum: { valor: true }, where: { status: "atrasado", deletedAt: null } }),
      prisma.fatura.groupBy({
        by: ["ano", "mes"],
        _sum: { valor: true },
        where: { status: "pago", createdAt: { gte: new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1) }, deletedAt: null },
        orderBy: [{ ano: "asc" }, { mes: "asc" }],
      }),

      // Processos
      prisma.processo.count({ where: { status: { not: "encerrado" }, deletedAt: null } }),
      prisma.processo.count({ where: { status: "encerrado", deletedAt: null } }),
      prisma.processo.groupBy({ by: ["area"], _count: { id: true }, _sum: { valorCausa: true }, where: { deletedAt: null } }),
      prisma.processo.groupBy({ by: ["status"], _count: { id: true }, where: { deletedAt: null } }),
      prisma.processo.groupBy({ by: ["risco"], _count: { id: true }, _sum: { valorCausa: true }, where: { deletedAt: null, status: { not: "encerrado" } } }),
      prisma.processo.aggregate({ _sum: { valorCausa: true }, where: { deletedAt: null } }),
      prisma.processo.findMany({
        where: { status: { not: "encerrado" }, deletedAt: null },
        select: { id: true, cnj: true, tipo: true, area: true, valorCausa: true, distribuicao: true, cliente: { select: { nome: true } }, risco: true },
        orderBy: { distribuicao: "asc" },
        take: 10,
      }),

      // Clientes
      prisma.cliente.count({ where: { status: "ativo", deletedAt: null } }),
      prisma.cliente.count({ where: { status: "inativo", deletedAt: null } }),
      prisma.cliente.groupBy({ by: ["status"], _count: { id: true }, where: { deletedAt: null } }),
      prisma.cliente.findMany({
        where: { deletedAt: null },
        select: { id: true, nome: true, _count: { select: { processos: true } } },
        orderBy: { processos: { _count: "desc" } },
        take: 10,
      }),

      // Prazos
      prisma.prazo.count({ where: { deletedAt: null, vence: { gte: hoje, lt: new Date(hoje.getTime() + 86400000) }, status: { not: "cumprido" } } }),
      prisma.prazo.count({ where: { deletedAt: null, vence: { gte: hoje, lte: seteDias }, status: { not: "cumprido" } } }),
      prisma.prazo.count({ where: { deletedAt: null, vence: { lt: hoje }, status: { not: "cumprido" } } }),
      prisma.prazo.findMany({
        where: { deletedAt: null, vence: { gte: hoje, lte: seteDias }, status: { not: "cumprido" } },
        include: { processo: { select: { cnj: true, cliente: { select: { nome: true } } } }, responsavel: { select: { nome: true } } },
        orderBy: { vence: "asc" },
        take: 5,
      }),

      // Produtividade
      prisma.timesheet.aggregate({ _sum: { horas: true }, where: { data: { gte: inicioMes }, deletedAt: null } }),
      prisma.timesheet.groupBy({
        by: ["userId"],
        _sum: { horas: true },
        where: { deletedAt: null, data: { gte: inicioAno } },
        orderBy: { _sum: { horas: "desc" } },
        take: 10,
      }),
      prisma.task.groupBy({ by: ["status"], _count: { id: true }, where: { deletedAt: null } }),

      // Faturas
      prisma.fatura.groupBy({ by: ["status"], _count: { id: true }, _sum: { valor: true }, where: { deletedAt: null } }),
    ]);

    // Buscar nomes dos advogados para o ranking
    const advogadoIds = rankingAdvogados.map((r) => r.userId);
    const advogados = await prisma.user.findMany({
      where: { id: { in: advogadoIds } },
      select: { id: true, nome: true },
    });
    const advogadoMap = new Map(advogados.map((a) => [a.id, a.nome]));

    return NextResponse.json({
      financeiro: {
        receitaTotal: receitaTotal._sum.valor?.toNumber() || 0,
        receitaPendente: receitaPendente._sum.valor?.toNumber() || 0,
        receitaAtrasada: receitaAtrasada._sum.valor?.toNumber() || 0,
        receitaPorMes,
      },
      processos: {
        ativos: processosAtivos,
        encerrados: processosEncerrados,
        porArea: processosPorArea,
        porStatus: processosPorStatus,
        porRisco: processosPorRisco,
        valorLitigioTotal: valorLitigioTotal._sum.valorCausa?.toNumber() || 0,
        maisAntigos: processosMaisAntigos,
      },
      clientes: {
        ativos: clientesAtivos,
        inativos: clientesInativos,
        porStatus: clientesPorStatus,
        topPorProcessos: topClientesPorValor,
      },
      prazos: {
        hoje: prazosHoje,
        semana: prazosSemana,
        vencidos: prazosVencidos,
        proximos: prazosProximos,
      },
      produtividade: {
        horasMes: horasTrabalhadasMes._sum.horas?.toNumber() || 0,
        rankingAdvogados: rankingAdvogados.map((r) => ({
          userId: r.userId,
          nome: advogadoMap.get(r.userId) || "Desconhecido",
          horas: r._sum.horas?.toNumber() || 0,
        })),
        tarefasPorStatus,
      },
      faturas: { porStatus: faturasPorStatus },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

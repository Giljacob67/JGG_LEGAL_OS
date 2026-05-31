import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoListWhere } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/stats — KPIs reais do total da carteira (não da página corrente)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const scope = getProcessoListWhere(user);
    const baseWhere = { deletedAt: null, ...scope };

    const agora = new Date();
    const em3Dias = new Date(agora);
    em3Dias.setDate(agora.getDate() + 3);
    const em7Dias = new Date(agora);
    em7Dias.setDate(agora.getDate() + 7);

    const [
      total,
      ativos,
      suspensos,
      encerrados,
      altoRisco,
      semFonte,
      prazosProximos7d,
      prazosProximos3d,
      prazosPerdidos,
    ] = await Promise.all([
      prisma.processo.count({ where: baseWhere }),
      prisma.processo.count({ where: { ...baseWhere, status: "em_andamento" } }),
      prisma.processo.count({ where: { ...baseWhere, status: "suspenso" } }),
      prisma.processo.count({ where: { ...baseWhere, status: { in: ["arquivado", "encerrado"] } } }),
      prisma.processo.count({ where: { ...baseWhere, risco: "alto" } }),
      prisma.processo.count({
        where: { ...baseWhere, fontes: { none: {} } },
      }),
      // Prazos fatais abertos vencendo em até 7 dias
      prisma.prazo.count({
        where: {
          processo: baseWhere,
          tipo: "fatal",
          status: "aberto",
          deletedAt: null,
          vence: { gte: agora, lte: em7Dias },
        },
      }),
      // Prazos fatais abertos vencendo em até 3 dias (urgente)
      prisma.prazo.count({
        where: {
          processo: baseWhere,
          tipo: "fatal",
          status: "aberto",
          deletedAt: null,
          vence: { gte: agora, lte: em3Dias },
        },
      }),
      // Prazos fatais perdidos (passado do prazo sem cumprir)
      prisma.prazo.count({
        where: {
          processo: baseWhere,
          tipo: "fatal",
          status: "aberto",
          deletedAt: null,
          vence: { lt: agora },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      ativos,
      suspensos,
      encerrados,
      altoRisco,
      semFonte,
      prazos: {
        fataisEm7Dias: prazosProximos7d,
        fataisEm3Dias: prazosProximos3d,
        fataisPerdidos: prazosPerdidos,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

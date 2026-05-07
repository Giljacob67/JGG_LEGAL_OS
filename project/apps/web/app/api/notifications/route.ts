import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.prazo_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const em7dias = new Date(hoje);
    em7dias.setDate(em7dias.getDate() + 7);

    const [hojeCount, amanhaCount, estaSemana, vencidos] = await Promise.all([
      prisma.prazo.count({ where: { deletedAt: null, vence: { gte: hoje, lt: amanha }, status: { not: "cumprido" } } }),
      prisma.prazo.count({ where: { deletedAt: null, vence: { gte: amanha, lt: new Date(amanha.getTime() + 86400000) }, status: { not: "cumprido" } } }),
      prisma.prazo.findMany({
        where: { deletedAt: null, vence: { gte: hoje, lte: em7dias }, status: { not: "cumprido" } },
        include: { processo: { include: { cliente: true } }, responsavel: true },
        orderBy: { vence: "asc" },
        take: 20,
      }),
      prisma.prazo.findMany({
        where: { deletedAt: null, vence: { lt: hoje }, status: { not: "cumprido" } },
        include: { processo: { include: { cliente: true } }, responsavel: true },
        orderBy: { vence: "asc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      counts: { hoje: hojeCount, amanha: amanhaCount, total: hojeCount + amanhaCount + vencidos.length },
      prazos: [...vencidos, ...estaSemana],
    });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

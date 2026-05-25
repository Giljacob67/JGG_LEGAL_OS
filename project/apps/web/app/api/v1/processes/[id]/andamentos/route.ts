import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    if (!hasPermission(user, Permission.processo_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { id } = params;

    // Buscar processo para verificar se existe
    const processo = await prisma.processo.findFirst({
      where: { id, deletedAt: null },
    });

    if (!processo) {
      throw new AppError("Processo não encontrado", 404, "NOT_FOUND");
    }

    // Buscar andamentos
    const andamentos = await prisma.andamento.findMany({
      where: {
        processoId: id,
        deletedAt: null,
      },
      orderBy: {
        data: "desc",
      },
      take: 100, // Limitar para performance
    });

    return NextResponse.json(andamentos);
  } catch (error) {
    return handleApiError(error);
  }
}

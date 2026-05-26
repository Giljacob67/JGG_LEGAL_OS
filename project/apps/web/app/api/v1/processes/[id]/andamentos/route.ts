import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }

    if (!hasPermission(user, Permission.processo_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    await assertProcessoAccess(user, id);

    const andamentos = await prisma.andamento.findMany({
      where: {
        processoId: id,
        deletedAt: null,
      },
      orderBy: {
        data: "desc",
      },
      take: 100,
    });

    return NextResponse.json(andamentos);
  } catch (error) {
    return handleApiError(error);
  }
}

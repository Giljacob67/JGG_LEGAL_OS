import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/[id]/history - Buscar histórico de alterações do processo
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

    await assertProcessoAccess(user, id);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entidade: "Processo", entidadeId: id },
          { entidade: "Documento", diff: { path: ["processoId"], equals: id } },
          { entidade: "Prazo", diff: { path: ["processoId"], equals: id } },
          { entidade: "Andamento", diff: { path: ["processoId"], equals: id } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    return handleApiError(error);
  }
}

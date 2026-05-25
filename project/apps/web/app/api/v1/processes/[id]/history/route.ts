import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/[id]/history - Buscar histórico de alterações do processo
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    // Buscar logs relacionados ao processo e suas entidades relacionadas
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entidade: "Processo", entidadeId: params.id },
          { entidade: "Documento", diff: { path: ["processoId"], equals: params.id } },
          { entidade: "Prazo", diff: { path: ["processoId"], equals: params.id } },
          { entidade: "Andamento", diff: { path: ["processoId"], equals: params.id } },
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { id } = await params;

    const job = await prisma.processoImportJob.findUnique({
      where: { id },
      include: {
        iniciadoPor: { select: { id: true, nome: true } },
        candidates: {
          orderBy: { createdAt: "desc" },
          take: 200,
        },
        _count: { select: { candidates: true } },
      },
    });

    if (!job) {
      throw new AppError("Job não encontrado", 404, "NOT_FOUND");
    }

    return NextResponse.json(job);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

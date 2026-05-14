import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(_req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const jobs = await prisma.processoImportJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        iniciadoPor: { select: { id: true, nome: true } },
        _count: { select: { candidates: true } }
      }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return handleApiError(error);
  }
}

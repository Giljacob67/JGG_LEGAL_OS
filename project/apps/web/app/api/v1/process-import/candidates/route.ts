import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const candidates = await prisma.processoImportCandidate.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        job: { select: { id: true, tipo: true } }
      }
    });

    return NextResponse.json(candidates);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

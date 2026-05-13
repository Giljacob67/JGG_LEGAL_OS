import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const fonte = searchParams.get("fonte");
    const tribunal = searchParams.get("tribunal");
    const jobId = searchParams.get("jobId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const where: Prisma.ProcessoImportCandidateWhereInput = {};
    if (status) where.status = status;
    if (fonte) where.fonte = fonte;
    if (tribunal) where.tribunal = { contains: tribunal, mode: "insensitive" };
    if (jobId) where.jobId = jobId;

    const candidates = await prisma.processoImportCandidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        job: { select: { id: true, tipo: true, fonte: true } },
      },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

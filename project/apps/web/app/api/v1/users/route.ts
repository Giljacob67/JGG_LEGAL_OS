import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.admin_users)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    if (Number.isNaN(limit) || limit < 1 || limit > 200) {
      throw new AppError("Limite inválido", 400, "BAD_REQUEST");
    }

    const users = await prisma.user.findMany({
      where: { ativo: true, deletedAt: null },
      take: limit,
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, email: true, role: true, cor: true, oab: true },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    return handleApiError(error);
  }
}

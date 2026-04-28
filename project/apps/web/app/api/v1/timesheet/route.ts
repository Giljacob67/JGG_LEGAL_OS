import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { paginationSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.financeiro_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy") || "data",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const where: any = { deletedAt: null };
    if (pagination.search) {
      where.OR = [
        { atividade: { contains: pagination.search, mode: "insensitive" } },
        { user: { nome: { contains: pagination.search, mode: "insensitive" } } },
      ];
    }

    const userId = searchParams.get("userId");
    if (userId) where.userId = userId;

    const processoId = searchParams.get("processoId");
    if (processoId) where.processoId = processoId;

    const [registros, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy!]: pagination.sortOrder },
        include: {
          user: { select: { id: true, nome: true } },
        },
      }),
      prisma.timesheet.count({ where }),
    ]);

    return NextResponse.json({ data: registros, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.financeiro_create)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const body = await req.json();
    const { atividade, horas, data, processoId, faturado } = body;

    const registro = await prisma.timesheet.create({
      data: {
        userId: user.id,
        atividade,
        horas: horas != null ? Number(horas) : 0,
        data: data ? new Date(data) : new Date(),
        processoId: processoId || null,
        faturado: faturado ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "CREATE", entidade: "Timesheet", entidadeId: registro.id, diff: body },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { contratoSchema, paginationSchema } from "@/lib/validations/zod-schemas";
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
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const where: any = { deletedAt: null };
    if (pagination.search) {
      where.OR = [
        { numero: { contains: pagination.search, mode: "insensitive" } },
        { cliente: { nome: { contains: pagination.search, mode: "insensitive" } } },
        { processo: { cnj: { contains: pagination.search, mode: "insensitive" } } },
      ];
    }

    const tipo = searchParams.get("tipo");
    if (tipo) where.tipo = tipo;

    const vigente = searchParams.get("vigente");
    if (vigente) where.vigente = vigente === "true";

    const clienteId = searchParams.get("clienteId");
    if (clienteId) where.clienteId = clienteId;

    const [contratos, total] = await Promise.all([
      prisma.contratoHonorarios.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy!]: pagination.sortOrder },
        include: {
          cliente: { select: { id: true, nome: true } },
          processo: { select: { id: true, cnj: true, tipo: true } },
          _count: { select: { faturas: true } },
        },
      }),
      prisma.contratoHonorarios.count({ where }),
    ]);

    return NextResponse.json({ data: contratos, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
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
    const data = contratoSchema.parse(body);

    const contrato = await prisma.contratoHonorarios.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any,
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "CREATE", entidade: "ContratoHonorarios", entidadeId: contrato.id, diff: data as any },
    });

    return NextResponse.json(contrato, { status: 201 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

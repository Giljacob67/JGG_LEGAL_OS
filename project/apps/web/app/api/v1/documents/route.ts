import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { documentoSchema, paginationSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.documento_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

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
        { nome: { contains: pagination.search, mode: "insensitive" } },
        { processo: { cnj: { contains: pagination.search, mode: "insensitive" } } },
      ];
    }

    const tipo = searchParams.get("tipo");
    if (tipo) where.tipo = tipo;

    const status = searchParams.get("status");
    if (status) where.status = status;

    const [documentos, total] = await Promise.all([
      prisma.documento.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy!]: pagination.sortOrder },
        include: {
          processo: { select: { id: true, cnj: true } },
          autor: { select: { id: true, nome: true } },
        },
      }),
      prisma.documento.count({ where }),
    ]);

    return NextResponse.json({ data: documentos, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.documento_create)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const body = await req.json();
    const data = documentoSchema.parse(body);

    const documento = await prisma.documento.create({
      data: { ...data, autorId: user.id, createdAt: new Date(), updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "CREATE", entidade: "Documento", entidadeId: documento.id, diff: data as any },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

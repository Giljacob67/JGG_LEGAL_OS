import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { processoSchema, paginationSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

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
        { cnj: { contains: pagination.search, mode: "insensitive" } },
        { adverso: { contains: pagination.search, mode: "insensitive" } },
        { cliente: { nome: { contains: pagination.search, mode: "insensitive" } } },
      ];
    }

    const status = searchParams.get("status");
    if (status) where.status = status;

    const area = searchParams.get("area");
    if (area) where.area = area;

    const risco = searchParams.get("risco");
    if (risco) where.risco = risco;

    const [processos, total] = await Promise.all([
      prisma.processo.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy!]: pagination.sortOrder },
        include: {
          cliente: { select: { id: true, nome: true, cpfCnpj: true } },
          responsavel: { select: { id: true, nome: true, cor: true } },
          _count: { select: { prazos: true, documentos: true, andamentos: true } },
        },
      }),
      prisma.processo.count({ where }),
    ]);

    return NextResponse.json({ data: processos, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_create)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const body = await req.json();
    const data = processoSchema.parse(body);

    const existing = await prisma.processo.findUnique({ where: { cnj: data.cnj } });
    if (existing) throw new AppError("Já existe um processo com este CNJ", 409, "DUPLICATE_CNJ");

    const processo = await prisma.processo.create({
      data: {
        ...data,
        valorCausa: data.valorCausa != null ? data.valorCausa : undefined,
        valorProvavel: data.valorProvavel != null ? data.valorProvavel : undefined,
        distribuicao: data.distribuicao || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "CREATE", entidade: "Processo", entidadeId: processo.id, diff: data as any },
    });

    return NextResponse.json(processo, { status: 201 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import {
  clienteSchema,
  clienteUpdateSchema,
  paginationSchema,
} from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

// ============================================================
// GET /api/v1/clients
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.cliente_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

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
        { cpfCnpj: { contains: pagination.search, mode: "insensitive" } },
        { email: { contains: pagination.search, mode: "insensitive" } },
      ];
    }

    const status = searchParams.get("status");
    if (status) where.status = status;

    const area = searchParams.get("area");
    if (area) where.area = area;

    const [clients, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy!]: pagination.sortOrder },
        include: {
          processos: { select: { id: true, cnj: true, status: true } },
          _count: { select: { processos: true, faturas: true } },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({
      data: clients,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

// ============================================================
// POST /api/v1/clients
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.cliente_create)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const data = clienteSchema.parse(body);

    // Verifica duplicidade de CPF/CNPJ
    const existing = await prisma.cliente.findUnique({
      where: { cpfCnpj: data.cpfCnpj },
    });
    if (existing) {
      throw new AppError(
        "Já existe um cliente com este CPF/CNPJ",
        409,
        "DUPLICATE_CPF_CNPJ"
      );
    }

    const client = await prisma.cliente.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "CREATE",
        entidade: "Cliente",
        entidadeId: client.id,
        diff: data as any,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoScope, hasEthicalWallConflict, logSensitiveDataAccess } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import {
  clienteSchema,
  paginationSchemaCliente,
} from "@/lib/validations/zod-schemas";
import { Prisma, Permission, Area } from "@prisma/client";

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
    const pagination = paginationSchemaCliente.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const where: Prisma.ClienteWhereInput = { deletedAt: null };

    // Apply scoping for restricted roles (advogado / estagiario)
    const processoScope = getProcessoScope(user);
    if (Object.keys(processoScope).length > 0) {
      where.processos = {
        some: processoScope,
      };
    }

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
    if (area) where.area = area as Area;

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
    return handleApiError(error);
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

    // Pen-test readiness: rate limiting + abuse detection recommended on this endpoint
    // Consider using middleware with ioredis for sliding window limits
    await logSensitiveDataAccess(user, {
      entity: "Cliente",
      entityId: "creation-attempt",
      action: "CLIENTE_CREATE_ATTEMPT",
      purpose: "Security audit trail",
    }).catch(() => {});

    const body = await req.json();
    const data = clienteSchema.parse(body);

    // Ethical wall warning (non-blocking for client creation)
    if (await hasEthicalWallConflict(user, data.nome)) {
      // In production, could create an alert or log for review
      console.warn(`Possible ethical wall for new client ${data.nome}`);
    }

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
        diff: data as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

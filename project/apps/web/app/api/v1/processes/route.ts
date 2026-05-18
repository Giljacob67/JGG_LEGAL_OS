import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoScope } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { processoSchema, paginationSchemaProcesso } from "@/lib/validations/zod-schemas";
import { registerMonitoredProcess } from "@/lib/process-monitor/client";
import { Prisma, Permission, Area, ProcessoStatus, Risco } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchemaProcesso.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    const where: Prisma.ProcessoWhereInput = { deletedAt: null, ...getProcessoScope(user) };
    if (pagination.search) {
      where.OR = [
        { cnj: { contains: pagination.search, mode: "insensitive" } },
        { adverso: { contains: pagination.search, mode: "insensitive" } },
        { cliente: { nome: { contains: pagination.search, mode: "insensitive" } } },
      ];
    }

    const status = searchParams.get("status");
    if (status) where.status = status as ProcessoStatus;

    const area = searchParams.get("area");
    if (area) where.area = area as Area;

    const risco = searchParams.get("risco");
    if (risco) where.risco = risco as Risco;

    const [processos, total] = await Promise.all([
      prisma.processo.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy!]: pagination.sortOrder },
        include: {
          cliente: { select: { id: true, nome: true, cpfCnpj: true } },
          responsavel: { select: { id: true, nome: true, cor: true } },
          fontes: { select: { fonte: true, tribunal: true, statusSync: true, ultimaSync: true } },
          _count: { select: { prazos: true, documentos: true, andamentos: true } },
        },
      }),
      prisma.processo.count({ where }),
    ]);

    return NextResponse.json({ data: processos, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (error) {
    return handleApiError(error);
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
      data: { userId: user.id, userEmail: user.email, acao: "CREATE", entidade: "Processo", entidadeId: processo.id, diff: data as unknown as Prisma.InputJsonValue },
    });

    // Registrar automaticamente no process-monitor (fire-and-forget)
    if (processo.cnj) {
      registerMonitoredProcess({
        numero_cnj: processo.cnj,
        tribunal: processo.tribunal || undefined,
        jgg_processo_id: processo.id,
        prioridade: "normal",
      }).catch(() => {
        // Silently fail — não bloquear criação do processo
      });
    }

    return NextResponse.json(processo, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

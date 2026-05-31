import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoListWhere, assertNoEthicalWallConflict, findEthicalWallConflictsDetailed, logSensitiveDataAccess } from "@/lib/auth";
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

    // Sempre excluir soft-deleted
    const filters: Prisma.ProcessoWhereInput[] = [
      { deletedAt: null },
      getProcessoListWhere(user),
    ];

    if (pagination.search) {
      filters.push({
        OR: [
          { cnj: { contains: pagination.search, mode: "insensitive" } },
          { adverso: { contains: pagination.search, mode: "insensitive" } },
          { cliente: { nome: { contains: pagination.search, mode: "insensitive" } } },
        ],
      });
    }

    const status = searchParams.get("status");
    if (status) filters.push({ status: status as ProcessoStatus });

    const area = searchParams.get("area");
    if (area) filters.push({ area: area as Area });

    const risco = searchParams.get("risco");
    if (risco) filters.push({ risco: risco as Risco });

    // Filtros avançados
    const tribunal = searchParams.get("tribunal");
    if (tribunal) filters.push({ tribunal: { contains: tribunal, mode: "insensitive" } });

    const vara = searchParams.get("vara");
    if (vara) filters.push({ vara: { contains: vara, mode: "insensitive" } });

    const clienteId = searchParams.get("clienteId");
    if (clienteId) filters.push({ clienteId });

    const responsavelId = searchParams.get("responsavelId");
    if (responsavelId) filters.push({ responsavelId });

    const dataDistribuicaoInicio = searchParams.get("dataDistribuicaoInicio");
    const dataDistribuicaoFim = searchParams.get("dataDistribuicaoFim");
    if (dataDistribuicaoInicio || dataDistribuicaoFim) {
      filters.push({
        distribuicao: {
          ...(dataDistribuicaoInicio ? { gte: new Date(dataDistribuicaoInicio) } : {}),
          ...(dataDistribuicaoFim ? { lte: new Date(dataDistribuicaoFim) } : {}),
        },
      });
    }

    const valorCausaMin = searchParams.get("valorCausaMin");
    const valorCausaMax = searchParams.get("valorCausaMax");
    if (valorCausaMin || valorCausaMax) {
      filters.push({
        valorCausa: {
          ...(valorCausaMin ? { gte: parseFloat(valorCausaMin) } : {}),
          ...(valorCausaMax ? { lte: parseFloat(valorCausaMax) } : {}),
        },
      });
    }

    const tags = searchParams.get("tags");
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) filters.push({ etiquetas: { hasSome: tagList } });
    }

    // Prazos fatais próximos (N dias)
    const prazoFatalAte = searchParams.get("prazoFatalAte");
    if (prazoFatalAte) {
      const diasLimit = parseInt(prazoFatalAte);
      if (!isNaN(diasLimit)) {
        const limite = new Date();
        limite.setDate(limite.getDate() + diasLimit);
        filters.push({
          prazos: {
            some: {
              tipo: "fatal",
              status: "aberto",
              deletedAt: null,
              vence: { lte: limite },
            },
          },
        });
      }
    }

    const where: Prisma.ProcessoWhereInput = { AND: filters };

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

    // Pen-test hardening note: Consider adding rate limiting middleware on this route in production
    await logSensitiveDataAccess(user, {
      entity: "Processo",
      entityId: "creation-attempt",
      action: "PROCESSO_CREATE_ATTEMPT",
      purpose: "Security audit trail for sensitive creation",
    }).catch(() => {});

    const body = await req.json();
    const data = processoSchema.parse(body);

    // Ethical wall check (premium compliance) - before any creation
    await assertNoEthicalWallConflict(user, data.adverso);

    // Production-grade: log detailed potential conflicts for review
    const detailedConflicts = await findEthicalWallConflictsDetailed(user, data.adverso);
    if (detailedConflicts.length > 0) {
      await logSensitiveDataAccess(user, {
        entity: "Processo",
        entityId: "pre-creation-check",
        action: "ETHICAL_WALL_CONFLICT_DETECTED",
        purpose: "Potential ethical wall conflict on new processo creation",
      }).catch(() => {});
    }

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

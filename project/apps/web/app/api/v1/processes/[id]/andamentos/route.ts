import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission, Prisma } from "@prisma/client";
import { z } from "zod";

const andamentoCreateSchema = z.object({
  data: z.coerce.date(),
  evento: z.string().min(1, "Evento obrigatório").max(500),
  descricao: z.string().min(1, "Descrição obrigatória").max(5000),
  critico: z.boolean().default(false),
  tipo: z
    .enum(["andamento", "intimacao", "sentenca", "despacho", "publicacao"])
    .default("andamento"),
});

// GET /api/v1/processes/[id]/andamentos — lista com paginação por cursor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    await assertProcessoAccess(user, id);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const cursor = searchParams.get("cursor"); // id do último item da página anterior
    const fonte = searchParams.get("fonte"); // manual | datajud | etc
    const tipo = searchParams.get("tipo"); // andamento | intimacao | etc
    const apenasOriticos = searchParams.get("criticos") === "true";
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const where: Prisma.AndamentoWhereInput = {
      processoId: id,
      deletedAt: null,
      ...(fonte ? { fonte } : {}),
      ...(tipo ? { tipo } : {}),
      ...(apenasOriticos ? { critico: true } : {}),
      ...(dataInicio || dataFim
        ? {
            data: {
              ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
              ...(dataFim ? { lte: new Date(dataFim) } : {}),
            },
          }
        : {}),
    };

    const andamentos = await prisma.andamento.findMany({
      where,
      orderBy: { data: "desc" },
      take: limit + 1, // +1 para detectar se há próxima página
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = andamentos.length > limit;
    const items = hasNextPage ? andamentos.slice(0, limit) : andamentos;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    // Total para o filtro atual (sem paginação)
    const total = await prisma.andamento.count({ where });

    return NextResponse.json({ data: items, nextCursor, total });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/processes/[id]/andamentos — registrar andamento manual
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_edit))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    await assertProcessoAccess(user, id);

    const body = await req.json();
    const data = andamentoCreateSchema.parse(body);

    const andamento = await prisma.andamento.create({
      data: {
        processoId: id,
        data: data.data,
        evento: data.evento,
        descricao: data.descricao,
        critico: data.critico,
        fonte: "manual",
        // @ts-ignore — campo tipo será adicionado via migration futura
        tipo: data.tipo,
      },
    });

    // Atualizar ultimoAndamento no processo se esta data for mais recente
    await prisma.processo.update({
      where: { id },
      data: {
        ultimoAndamento: data.data,
        updatedAt: new Date(),
      },
    }).catch(() => {}); // não bloquear se falhar

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "CREATE",
        entidade: "Andamento",
        entidadeId: andamento.id,
        diff: { processoId: id, evento: data.evento, critico: data.critico } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(andamento, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

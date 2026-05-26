import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/processes/[id]/notes - Listar notas do processo
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_view);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await assertProcessoAccess(user, id);

    const notas = await prisma.note.findMany({
      where: {
        processoId: id,
        deletedAt: null,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        editadoPor: {
          select: {
            id: true,
            nome: true,
          },
        },
        anexos: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notas);
  } catch (error) {
    logger.error("Erro ao listar notas", error);
    return NextResponse.json(
      { error: "Erro ao listar notas" },
      { status: 500 }
    );
  }
}

// POST /api/v1/processes/[id]/notes - Criar nota
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_edit);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await assertProcessoAccess(user, id);

    const body = await req.json();
    const { titulo, conteudo, tipo = "interna", mencoes = [] } = body;

    if (!conteudo) {
      return NextResponse.json(
        { error: "Conteúdo é obrigatório" },
        { status: 400 }
      );
    }

    const nota = await prisma.note.create({
      data: {
        processoId: id,
        titulo,
        conteudo,
        tipo,
        mencoes,
        autorId: user.id,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        anexos: true,
      },
    });

    // TODO: Enviar notificações para usuários mencionados
    // await sendMentionsNotifications(nota.id, mencoes);

    return NextResponse.json(nota, { status: 201 });
  } catch (error) {
    logger.error("Erro ao criar nota", error);
    return NextResponse.json(
      { error: "Erro ao criar nota" },
      { status: 500 }
    );
  }
}

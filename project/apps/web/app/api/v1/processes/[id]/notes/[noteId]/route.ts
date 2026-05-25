import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// PATCH /api/v1/processes/[id]/notes/[noteId] - Atualizar nota
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_edit);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Verificar se o usuário é o autor da nota
    const notaExistente = await prisma.note.findUnique({
      where: { id: params.noteId },
    });

    if (!notaExistente) {
      return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
    }

    if (notaExistente.autorId !== user.id) {
      return NextResponse.json(
        { error: "Você só pode editar suas próprias notas" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { titulo, conteudo, tipo, mencoes } = body;

    // Criar histórico de edição
    const historicoEdicoes = notaExistente.historicoEdicoes
      ? [...(notaExistente.historicoEdicoes as any[])]
      : [];

    historicoEdicoes.push({
      data: new Date().toISOString(),
      userId: user.id,
      userName: user.nome,
      alteracoes: {
        ...(titulo !== undefined && titulo !== notaExistente.titulo && { titulo: { de: notaExistente.titulo, para: titulo } }),
        ...(conteudo !== undefined && conteudo !== notaExistente.conteudo && { conteudo: { de: notaExistente.conteudo, para: conteudo } }),
        ...(tipo !== undefined && tipo !== notaExistente.tipo && { tipo: { de: notaExistente.tipo, para: tipo } }),
      },
    });

    const nota = await prisma.note.update({
      where: { id: params.noteId },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(conteudo !== undefined && { conteudo }),
        ...(tipo !== undefined && { tipo }),
        ...(mencoes !== undefined && { mencoes }),
        editadoPorId: user.id,
        editadoEm: new Date(),
        historicoEdicoes,
        updatedAt: new Date(),
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
        anexos: true,
      },
    });

    return NextResponse.json(nota);
  } catch (error) {
    logger.error("Erro ao atualizar nota", error);
    return NextResponse.json(
      { error: "Erro ao atualizar nota" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/processes/[id]/notes/[noteId] - Deletar nota (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_edit);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Verificar se o usuário é o autor da nota
    const notaExistente = await prisma.note.findUnique({
      where: { id: params.noteId },
    });

    if (!notaExistente) {
      return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
    }

    if (notaExistente.autorId !== user.id) {
      return NextResponse.json(
        { error: "Você só pode excluir suas próprias notas" },
        { status: 403 }
      );
    }

    await prisma.note.update({
      where: { id: params.noteId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erro ao deletar nota", error);
    return NextResponse.json(
      { error: "Erro ao deletar nota" },
      { status: 500 }
    );
  }
}

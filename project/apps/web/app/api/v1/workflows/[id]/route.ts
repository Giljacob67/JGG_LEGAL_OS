import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/workflows/[id] - Obter workflow específico
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

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        criadoPor: { select: { id: true, nome: true } },
        logs: {
          orderBy: { executadoEm: "desc" },
          take: 20,
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow não encontrado" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    logger.error("Erro ao obter workflow", error);
    return NextResponse.json(
      { error: "Erro ao obter workflow" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/workflows/[id] - Atualizar workflow
export async function PATCH(
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

    const body = await req.json();
    const { nome, descricao, trigger, condicoes, acoes, ativo } = body;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(trigger !== undefined && { trigger }),
        ...(condicoes !== undefined && { condicoes }),
        ...(acoes !== undefined && { acoes }),
        ...(ativo !== undefined && { ativo }),
        updatedAt: new Date(),
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    logger.error("Erro ao atualizar workflow", error);
    return NextResponse.json(
      { error: "Erro ao atualizar workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/workflows/[id] - Deletar workflow
export async function DELETE(
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

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erro ao deletar workflow", error);
    return NextResponse.json(
      { error: "Erro ao deletar workflow" },
      { status: 500 }
    );
  }
}

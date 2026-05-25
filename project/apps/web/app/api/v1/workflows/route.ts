import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/workflows - Listar todos os workflows
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_view);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const workflows = await prisma.workflow.findMany({
      include: {
        criadoPor: { select: { id: true, nome: true } },
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    logger.error("Erro ao listar workflows", error);
    return NextResponse.json(
      { error: "Erro ao listar workflows" },
      { status: 500 }
    );
  }
}

// POST /api/v1/workflows - Criar novo workflow
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_edit);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const { nome, descricao, trigger, condicoes, acoes } = body;

    if (!nome || !trigger || !acoes) {
      return NextResponse.json(
        { error: "Nome, trigger e ações são obrigatórios" },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflow.create({
      data: {
        nome,
        descricao,
        trigger,
        condicoes,
        acoes,
        criadoPorId: user.id,
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    logger.error("Erro ao criar workflow", error);
    return NextResponse.json(
      { error: "Erro ao criar workflow" },
      { status: 500 }
    );
  }
}

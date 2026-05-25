import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/processes/[id]/alerts - Listar alertas do processo
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const hasAccess = await hasPermission(user, Permission.processo_view);
    if (!hasAccess) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const alertas = await prisma.alerta.findMany({
      where: { processoId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alertas);
  } catch (error) {
    logger.error("Erro ao listar alertas", error);
    return NextResponse.json(
      { error: "Erro ao listar alertas" },
      { status: 500 }
    );
  }
}

// POST /api/v1/processes/[id]/alerts - Criar alerta
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await req.json();
    const { tipo, ativo = true, configuracao } = body;

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo do alerta é obrigatório" },
        { status: 400 }
      );
    }

    const alerta = await prisma.alerta.create({
      data: {
        processoId: params.id,
        tipo,
        ativo,
        configuracao: configuracao || null,
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    logger.error("Erro ao criar alerta", error);
    return NextResponse.json(
      { error: "Erro ao criar alerta" },
      { status: 500 }
    );
  }
}

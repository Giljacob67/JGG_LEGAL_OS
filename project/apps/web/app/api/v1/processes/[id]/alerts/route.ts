import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/[id]/alerts - Listar alertas do processo
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

    if (!hasPermission(user, Permission.processo_view)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await assertProcessoAccess(user, id);

    const alertas = await prisma.alerta.findMany({
      where: { processoId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alertas);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/processes/[id]/alerts - Criar alerta
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

    if (!hasPermission(user, Permission.processo_edit)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await assertProcessoAccess(user, id);

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
        processoId: id,
        tipo,
        ativo,
        configuracao: configuracao || null,
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

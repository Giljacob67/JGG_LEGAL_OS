import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// PATCH /api/v1/processes/[id]/alerts/[alertId] - Atualizar alerta
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; alertId: string } }
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
    const { ativo, configuracao } = body;

    const alerta = await prisma.alerta.update({
      where: { id: params.alertId },
      data: {
        ...(ativo !== undefined && { ativo }),
        ...(configuracao !== undefined && { configuracao }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(alerta);
  } catch (error) {
    logger.error("Erro ao atualizar alerta", error);
    return NextResponse.json(
      { error: "Erro ao atualizar alerta" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/processes/[id]/alerts/[alertId] - Deletar alerta
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; alertId: string } }
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

    await prisma.alerta.delete({
      where: { id: params.alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erro ao deletar alerta", error);
    return NextResponse.json(
      { error: "Erro ao deletar alerta" },
      { status: 500 }
    );
  }
}

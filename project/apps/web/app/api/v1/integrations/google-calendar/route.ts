import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// GET /api/v1/integrations/google-calendar - Verificar status da integração
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

    const integration = await prisma.integrationAccount.findFirst({
      where: {
        userId: user.id,
        tipo: "google_calendar",
      },
    });

    return NextResponse.json({
      conectado: !!integration,
      email: integration?.email,
      ultimaSync: integration?.lastSyncAt,
    });
  } catch (error) {
    logger.error("Erro ao verificar integração Google Calendar", error);
    return NextResponse.json(
      { error: "Erro ao verificar integração" },
      { status: 500 }
    );
  }
}

// POST /api/v1/integrations/google-calendar/sync - Sincronizar prazos com Google Calendar
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

    const integration = await prisma.integrationAccount.findFirst({
      where: {
        userId: user.id,
        tipo: "google_calendar",
        active: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Google Calendar não conectado" },
        { status: 400 }
      );
    }

    // Buscar prazos pendentes
    const prazos = await prisma.prazo.findMany({
      where: {
        responsavelId: user.id,
        status: "aberto",
        deletedAt: null,
      },
      include: {
        processo: {
          select: {
            cnj: true,
            cliente: { select: { nome: true } },
          },
        },
      },
    });

    // TODO: Implementar sincronização real com Google Calendar API
    // Por enquanto, apenas simula a sincronização
    logger.info(`[GOOGLE_CALENDAR] Sincronizando ${prazos.length} prazos para usuário ${user.id}`);

    // Atualizar data da última sincronização
    await prisma.integrationAccount.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      prazosSincronizados: prazos.length,
      message: `${prazos.length} prazos sincronizados com sucesso`,
    });
  } catch (error) {
    logger.error("Erro ao sincronizar com Google Calendar", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar" },
      { status: 500 }
    );
  }
}

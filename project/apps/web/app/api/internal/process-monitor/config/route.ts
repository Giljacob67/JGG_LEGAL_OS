import { NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { getProcessMonitorConfig } from "@/lib/process-monitor/client";
import { logger } from "@/lib/logger";
import { Permission } from "@prisma/client";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.processo_view)) {
    return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
  }

  try {
    const data = await getProcessMonitorConfig();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    logger.error("Erro ao buscar config do process-monitor", error);
    return NextResponse.json(
      { ok: false, error: "Serviço indisponível" },
      { status: 503 }
    );
  }
}

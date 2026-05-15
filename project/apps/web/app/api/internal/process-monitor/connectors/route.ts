import { NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { listProcessMonitorConnectors } from "@/lib/process-monitor/client";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.processo_view)) {
    return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
  }

  const result = await listProcessMonitorConnectors();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

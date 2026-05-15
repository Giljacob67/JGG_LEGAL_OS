import { NextResponse } from "next/server";
import { getAuthUser, hasAnyPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { registerMonitoredProcess } from "@/lib/process-monitor/client";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }
  if (!hasAnyPermission(user, [Permission.processo_create, Permission.processo_edit])) {
    return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await registerMonitoredProcess(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

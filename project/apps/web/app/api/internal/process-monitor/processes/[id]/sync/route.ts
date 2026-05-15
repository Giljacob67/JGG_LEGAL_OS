import { NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { requestProcessSync } from "@/lib/process-monitor/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.processo_edit)) {
    return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await requestProcessSync(id, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

const MONITORING_URL = process.env.MONITORING_SERVICE_URL ?? "http://localhost:8001";
const MONITORING_API_KEY = process.env.MONITORING_API_KEY ?? "";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const cnj = searchParams.get("cnj");
    if (!cnj) throw new AppError("CNJ obrigatório", 400, "VALIDATION_ERROR");

    const res = await fetch(`${MONITORING_URL}/documentos/${encodeURIComponent(cnj)}`, {
      headers: { "X-API-Key": MONITORING_API_KEY },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return handleApiError(e);
  }
}

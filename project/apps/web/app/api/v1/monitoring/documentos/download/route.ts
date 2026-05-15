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
    const docId = searchParams.get("docId");
    if (!cnj || !docId) throw new AppError("CNJ e docId obrigatórios", 400, "VALIDATION_ERROR");

    const res = await fetch(
      `${MONITORING_URL}/documentos/${encodeURIComponent(cnj)}/${docId}/download`,
      {
        headers: { "X-API-Key": MONITORING_API_KEY },
        redirect: "manual",
      }
    );

    // Se o monitoring retornou redirect, repassamos
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        return NextResponse.redirect(location);
      }
    }

    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? { message: "Erro ao obter documento" }, { status: res.status });
  } catch (e) {
    return handleApiError(e);
  }
}

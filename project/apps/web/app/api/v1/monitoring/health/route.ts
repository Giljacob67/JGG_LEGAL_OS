import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";

const MONITORING_URL = process.env.MONITORING_SERVICE_URL ?? "http://localhost:8001";
const MONITORING_API_KEY = process.env.MONITORING_API_KEY ?? "";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");

    const [health, tribunais] = await Promise.all([
      fetch(`${MONITORING_URL}/health`, { headers: { "X-API-Key": MONITORING_API_KEY } }),
      fetch(`${MONITORING_URL}/health/tribunais`, { headers: { "X-API-Key": MONITORING_API_KEY } }),
    ]);

    return NextResponse.json({
      service: await health.json(),
      tribunais: await tribunais.json(),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

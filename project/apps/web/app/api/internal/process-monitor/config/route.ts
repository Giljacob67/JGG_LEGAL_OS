import { NextResponse } from "next/server";
import { getProcessMonitorConfig } from "@/lib/process-monitor/client";
import { logger } from "@/lib/logger";

export async function GET() {
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

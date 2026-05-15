import { NextResponse } from "next/server";
import { getProcessMonitorConfig } from "@/lib/process-monitor/client";

export async function GET() {
  try {
    const data = await getProcessMonitorConfig();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[PROCESS_MONITOR_CONFIG_PROXY] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Serviço indisponível" },
      { status: 503 }
    );
  }
}

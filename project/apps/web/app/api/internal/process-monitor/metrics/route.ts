import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.PROCESS_MONITOR_URL || "http://localhost:8001";
    const apiKey = process.env.PROCESS_MONITOR_API_KEY || "";

    const res = await fetch(`${baseUrl}/metrics`, {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Serviço indisponível" }, { status: 503 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro de rede" }, { status: 503 });
  }
}

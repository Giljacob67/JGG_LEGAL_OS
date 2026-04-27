import { NextRequest, NextResponse } from "next/server";
import { buscarProcessoPorCNJ } from "@/lib/datajud";

export async function GET(req: NextRequest) {
  const cnj = req.nextUrl.searchParams.get("cnj");
  if (!cnj) {
    return NextResponse.json({ error: "CNJ obrigatorio" }, { status: 400 });
  }

  try {
    const processo = await buscarProcessoPorCNJ(cnj);
    if (!processo) {
      return NextResponse.json({ error: "Processo nao encontrado no DataJud" }, { status: 404 });
    }
    return NextResponse.json(processo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro na consulta" }, { status: 500 });
  }
}
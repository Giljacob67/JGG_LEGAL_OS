import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Permission } from "@prisma/client";
import { encryptCredential, CourtAuthType } from "@/lib/court-credentials";
import { z } from "zod";

const credentialSchema = z.object({
  tribunal: z.string().min(1),
  sistema: z.string().min(1),
  descricao: z.string().optional(),
  tipoAuth: z.enum(["none", "api_key", "bearer_token", "basic_auth", "cert_a1"]),
  payload: z.record(z.string(), z.any()),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.processo_view)) {
    return NextResponse.json({ ok: false, error: "Sem permissao" }, { status: 403 });
  }

  const creds = await prisma.courtConnectorCredential.findMany({
    orderBy: { tribunal: "asc" },
  });

  // Nao expor dados cifrados na listagem
  const safe = creds.map((c) => ({
    id: c.id,
    tribunal: c.tribunal,
    sistema: c.sistema,
    descricao: c.descricao,
    tipoAuth: c.tipoAuth,
    ativo: c.ativo,
    ultimoTeste: c.ultimoTeste,
    statusTeste: c.statusTeste,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json({ ok: true, data: safe });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.admin_integrations)) {
    return NextResponse.json({ ok: false, error: "Sem permissao" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = credentialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Dados invalidos", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { tribunal, sistema, descricao, tipoAuth, payload } = parsed.data;

  try {
    const encrypted = tipoAuth === "none" ? null : encryptCredential(tipoAuth as CourtAuthType, payload);

    const credential = await prisma.courtConnectorCredential.upsert({
      where: { tribunal_sistema: { tribunal, sistema } },
      update: {
        descricao: descricao || null,
        tipoAuth,
        encryptedCredential: encrypted,
        ativo: true,
        statusTeste: "nunca_testado",
      },
      create: {
        tribunal,
        sistema,
        descricao: descricao || null,
        tipoAuth,
        encryptedCredential: encrypted,
      },
    });

    return NextResponse.json({ ok: true, data: { id: credential.id, tribunal, sistema, tipoAuth } });
  } catch (err) {
    console.error("[credentials] erro ao salvar:", err);
    return NextResponse.json({ ok: false, error: "Erro ao salvar credencial" }, { status: 500 });
  }
}

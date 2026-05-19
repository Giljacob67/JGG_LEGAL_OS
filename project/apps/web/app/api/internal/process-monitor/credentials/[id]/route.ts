import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Permission } from "@prisma/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.admin_integrations)) {
    return NextResponse.json({ ok: false, error: "Sem permissao" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.courtConnectorCredential.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Credencial nao encontrada" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Nao autenticado" }, { status: 401 });
  }
  if (!hasPermission(user, Permission.admin_integrations)) {
    return NextResponse.json({ ok: false, error: "Sem permissao" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const updated = await prisma.courtConnectorCredential.update({
      where: { id },
      data: {
        statusTeste: body.statusTeste ?? undefined,
        ultimoTeste: body.statusTeste ? new Date() : undefined,
        ativo: body.ativo ?? undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        statusTeste: updated.statusTeste,
        ultimoTeste: updated.ultimoTeste,
        ativo: updated.ativo,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Credencial nao encontrada" }, { status: 404 });
  }
}

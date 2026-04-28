import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { prazoUpdateSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.prazo_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const prazo = await prisma.prazo.findFirst({
      where: { id, deletedAt: null },
      include: {
        processo: { select: { id: true, cnj: true, tipo: true } },
        responsavel: { select: { id: true, nome: true, cor: true } },
      },
    });

    if (!prazo) throw new AppError("Prazo não encontrado", 404, "NOT_FOUND");
    return NextResponse.json(prazo);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.prazo_edit)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const body = await req.json();
    const data = prazoUpdateSchema.parse(body);

    const existing = await prisma.prazo.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Prazo não encontrado", 404, "NOT_FOUND");

    const updated = await prisma.prazo.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "UPDATE", entidade: "Prazo", entidadeId: id, diff: data as any },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.prazo_delete)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const existing = await prisma.prazo.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Prazo não encontrado", 404, "NOT_FOUND");

    await prisma.prazo.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "DELETE", entidade: "Prazo", entidadeId: id, diff: { deletedAt: new Date().toISOString() } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

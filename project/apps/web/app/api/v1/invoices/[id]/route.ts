import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { faturaUpdateSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.financeiro_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const fatura = await prisma.fatura.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
        contrato: { select: { id: true, numero: true, tipo: true, valorFixo: true, percentual: true } },
        emitidoPor: { select: { id: true, nome: true } },
      },
    });

    if (!fatura) throw new AppError("Fatura não encontrada", 404, "NOT_FOUND");
    return NextResponse.json(fatura);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.financeiro_edit)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const body = await req.json();
    const data = faturaUpdateSchema.parse(body);

    const existing = await prisma.fatura.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Fatura não encontrada", 404, "NOT_FOUND");

    const updated = await prisma.fatura.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "UPDATE", entidade: "Fatura", entidadeId: id, diff: data as any },
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
    if (!hasPermission(user, Permission.financeiro_delete)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const existing = await prisma.fatura.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Fatura não encontrada", 404, "NOT_FOUND");

    await prisma.fatura.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "DELETE", entidade: "Fatura", entidadeId: id, diff: { deletedAt: new Date().toISOString() } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

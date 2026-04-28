import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { contratoUpdateSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.financeiro_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const contrato = await prisma.contratoHonorarios.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true } },
        processo: { select: { id: true, cnj: true, tipo: true } },
        faturas: { where: { deletedAt: null }, orderBy: { vencimento: "desc" }, take: 12 },
      },
    });

    if (!contrato) throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");
    return NextResponse.json(contrato);
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
    const data = contratoUpdateSchema.parse(body);

    const existing = await prisma.contratoHonorarios.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");

    const updated = await prisma.contratoHonorarios.update({
      where: { id },
      data: { ...data, updatedAt: new Date() } as any,
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "UPDATE", entidade: "ContratoHonorarios", entidadeId: id, diff: data as any },
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
    const existing = await prisma.contratoHonorarios.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");

    await prisma.contratoHonorarios.update({ where: { id }, data: { deletedAt: new Date(), vigente: false } });
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "DELETE", entidade: "ContratoHonorarios", entidadeId: id, diff: { deletedAt: new Date().toISOString() } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

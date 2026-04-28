import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.financeiro_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const registro = await prisma.timesheet.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, nome: true } },
      },
    });

    if (!registro) throw new AppError("Registro não encontrado", 404, "NOT_FOUND");
    return NextResponse.json(registro);
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
    const { atividade, horas, data, processoId, faturado } = body;

    const existing = await prisma.timesheet.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Registro não encontrado", 404, "NOT_FOUND");

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        ...(atividade !== undefined && { atividade }),
        ...(horas !== undefined && { horas: Number(horas) }),
        ...(data !== undefined && { data: new Date(data) }),
        ...(processoId !== undefined && { processoId: processoId || null }),
        ...(faturado !== undefined && { faturado }),
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "UPDATE", entidade: "Timesheet", entidadeId: id, diff: body },
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
    const existing = await prisma.timesheet.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Registro não encontrado", 404, "NOT_FOUND");

    await prisma.timesheet.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "DELETE", entidade: "Timesheet", entidadeId: id, diff: { deletedAt: new Date().toISOString() } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

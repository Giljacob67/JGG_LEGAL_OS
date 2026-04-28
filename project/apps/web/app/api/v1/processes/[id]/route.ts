import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { processoUpdateSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const processo = await prisma.processo.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: { select: { id: true, nome: true, cpfCnpj: true, tipo: true } },
        responsavel: { select: { id: true, nome: true, oab: true, cor: true } },
        equipe: { select: { id: true, nome: true, cor: true } },
        andamentos: { where: { deletedAt: null }, orderBy: { data: "desc" }, take: 20 },
        prazos: { where: { deletedAt: null }, orderBy: { vence: "asc" } },
        documentos: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 10 },
        honorarios: { where: { deletedAt: null } },
        _count: { select: { andamentos: true, prazos: true, documentos: true } },
      },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");
    return NextResponse.json(processo);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_edit)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const body = await req.json();
    const data = processoUpdateSchema.parse(body);

    const existing = await prisma.processo.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    if (data.cnj && data.cnj !== existing.cnj) {
      const dup = await prisma.processo.findUnique({ where: { cnj: data.cnj } });
      if (dup) throw new AppError("CNJ já existe", 409, "DUPLICATE_CNJ");
    }

    const updated = await prisma.processo.update({
      where: { id },
      data: {
        ...data,
        valorCausa: data.valorCausa != null ? data.valorCausa : undefined,
        valorProvavel: data.valorProvavel != null ? data.valorProvavel : undefined,
        distribuicao: data.distribuicao || undefined,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "UPDATE", entidade: "Processo", entidadeId: id, diff: data as any },
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
    if (!hasPermission(user, Permission.processo_delete)) throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { id } = await params;
    const existing = await prisma.processo.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    await prisma.processo.update({ where: { id }, data: { deletedAt: new Date(), status: "arquivado" } });
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, acao: "DELETE", entidade: "Processo", entidadeId: id, diff: { deletedAt: new Date().toISOString() } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

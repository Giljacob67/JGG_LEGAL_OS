import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { clienteUpdateSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";

// ============================================================
// GET /api/v1/clients/:id
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.cliente_view)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { id } = await params;

    const client = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
      include: {
        processos: {
          where: { deletedAt: null },
          select: { id: true, cnj: true, status: true, area: true, valorCausa: true },
        },
        honorarios: { where: { deletedAt: null } },
        faturas: {
          where: { deletedAt: null },
          orderBy: { vencimento: "desc" },
          take: 10,
        },
        _count: {
          select: { processos: true, honorarios: true, faturas: true },
        },
      },
    });

    if (!client) {
      throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
    }

    return NextResponse.json(client);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

// ============================================================
// PATCH /api/v1/clients/:id
// ============================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.cliente_edit)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const body = await req.json();
    const data = clienteUpdateSchema.parse(body);

    const existing = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
    }

    // Verifica duplicidade de CPF/CNPJ se estiver sendo alterado
    if (data.cpfCnpj && data.cpfCnpj !== existing.cpfCnpj) {
      const duplicate = await prisma.cliente.findUnique({
        where: { cpfCnpj: data.cpfCnpj },
      });
      if (duplicate) {
        throw new AppError(
          "Já existe um cliente com este CPF/CNPJ",
          409,
          "DUPLICATE_CPF_CNPJ"
        );
      }
    }

    const updated = await prisma.cliente.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "UPDATE",
        entidade: "Cliente",
        entidadeId: id,
        diff: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

// ============================================================
// DELETE /api/v1/clients/:id
// ============================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasPermission(user, Permission.cliente_delete)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { id } = await params;

    const existing = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
    }

    // Soft delete
    await prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ex-cliente" },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "DELETE",
        entidade: "Cliente",
        entidadeId: id,
        diff: { deletedAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}

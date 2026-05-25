import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/[id]/team - Listar equipe do processo
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const processo = await prisma.processo.findUnique({
      where: { id: params.id },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            cor: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            cor: true,
          },
        },
      },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    return NextResponse.json({
      responsavel: processo.responsavel,
      equipe: processo.equipe,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/processes/[id]/team - Adicionar membro à equipe
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_edit))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { userId } = await req.json();
    if (!userId) throw new AppError("userId é obrigatório", 400, "VALIDATION_ERROR");

    const processo = await prisma.processo.findUnique({
      where: { id: params.id },
      include: { equipe: true },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    // Verificar se já está na equipe
    if (processo.equipe.some((u) => u.id === userId)) {
      throw new AppError("Usuário já está na equipe", 400, "ALREADY_IN_TEAM");
    }

    const updated = await prisma.processo.update({
      where: { id: params.id },
      data: {
        equipe: {
          connect: { id: userId },
        },
      },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            cor: true,
          },
        },
      },
    });

    // Registrar no histórico
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "TEAM_MEMBER_ADDED",
        entidade: "Processo",
        entidadeId: params.id,
        diff: { userId } as any,
      },
    });

    return NextResponse.json({ equipe: updated.equipe });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/v1/processes/[id]/team - Remover membro da equipe
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_edit))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) throw new AppError("userId é obrigatório", 400, "VALIDATION_ERROR");

    const processo = await prisma.processo.findUnique({
      where: { id: params.id },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    const updated = await prisma.processo.update({
      where: { id: params.id },
      data: {
        equipe: {
          disconnect: { id: userId },
        },
      },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            cor: true,
          },
        },
      },
    });

    // Registrar no histórico
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "TEAM_MEMBER_REMOVED",
        entidade: "Processo",
        entidadeId: params.id,
        diff: { userId } as any,
      },
    });

    return NextResponse.json({ equipe: updated.equipe });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

// GET /api/v1/processes/[id]/documents - Listar documentos do processo
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.documento_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");

    const where: any = {
      processoId: params.id,
      deletedAt: null,
    };

    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    const documentos = await prisma.documento.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(documentos);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/processes/[id]/documents - Criar documento vinculado ao processo
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.documento_create))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const { nome, tipo, url, mimeType, tamanho, segredo } = await req.json();

    if (!nome) throw new AppError("Nome é obrigatório", 400, "VALIDATION_ERROR");
    if (!tipo) throw new AppError("Tipo é obrigatório", 400, "VALIDATION_ERROR");

    // Verificar se processo existe
    const processo = await prisma.processo.findUnique({
      where: { id: params.id },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    const documento = await prisma.documento.create({
      data: {
        nome,
        tipo,
        url,
        mimeType,
        tamanho,
        segredo: segredo || false,
        processoId: params.id,
        autorId: user.id,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    // Registrar no histórico
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "DOCUMENT_CREATED",
        entidade: "Documento",
        entidadeId: documento.id,
        diff: { nome, tipo, processoId: params.id } as any,
      },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

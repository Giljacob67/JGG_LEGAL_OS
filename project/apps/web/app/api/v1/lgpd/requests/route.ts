import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthUser,
  hasLGPDRequestPermission,
  createLGPDRequest,
  getLGPDRequestsForClient,
  updateLGPDRequestStatus,
  logSensitiveDataAccess,
  getClienteScope,
} from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { lgpdRequestCreateSchema, lgpdRequestUpdateSchema } from "@/lib/validations/zod-schemas";
import { DataSubjectRight, LGPDRequestStatus } from "@prisma/client";

// ============================================================
// GET /api/v1/lgpd/requests?clienteId=xxx
// List LGPD data subject requests for a client (with full scoping + audit log)
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDRequestPermission(user, "view")) {
      throw new AppError("Sem permissão para visualizar solicitações LGPD", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get("clienteId");

    if (!clienteId) {
      throw new AppError("clienteId é obrigatório", 400, "VALIDATION_ERROR");
    }

    // Use the scoped helper from auth.ts (already enforces + throws on violation)
    const requests = await getLGPDRequestsForClient(clienteId, user);

    await logSensitiveDataAccess(user, {
      entity: "LGPDRequest",
      entityId: clienteId,
      action: "LIST_REQUESTS",
      purpose: "LGPD data subject rights request audit",
    });

    return NextResponse.json({ data: requests });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================
// POST /api/v1/lgpd/requests
// Create a new data subject rights request (any authorized role with view/manage)
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDRequestPermission(user, "manage") && !hasLGPDRequestPermission(user, "view")) {
      throw new AppError("Sem permissão para criar solicitações LGPD", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const data = lgpdRequestCreateSchema.parse(body);

    // If clienteId provided, enforce scoping
    if (data.clienteId) {
      const clienteScope = getClienteScope(user);
      if (Object.keys(clienteScope).length > 0) {
        const accessible = await prisma.cliente.count({
          where: { id: data.clienteId, deletedAt: null, ...clienteScope },
        });
        if (accessible === 0) {
          throw new AppError("Cliente não encontrado ou sem acesso", 404, "NOT_FOUND");
        }
      }
    }

    const request = await createLGPDRequest({
      clienteId: data.clienteId,
      requestType: data.requestType as DataSubjectRight,
      description: data.description,
      requestedBy: data.requestedBy,
    });

    await logSensitiveDataAccess(user, {
      entity: "LGPDRequest",
      entityId: request.id,
      action: "CREATE_REQUEST",
      purpose: `LGPD data subject right: ${data.requestType}`,
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================
// PATCH /api/v1/lgpd/requests
// Update status + response (requires manage permission)
// Body: { id, status, response? }
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDRequestPermission(user, "manage")) {
      throw new AppError("Sem permissão para atualizar solicitações LGPD", 403, "FORBIDDEN");
    }

    const body = await req.json();
    if (!body?.id || !body?.status) {
      throw new AppError("id e status são obrigatórios", 400, "VALIDATION_ERROR");
    }

    const validated = lgpdRequestUpdateSchema.parse({
      status: body.status,
      response: body.response,
    });
    const { id } = body;

    // Fetch to enforce scoping before update
    const existing = await prisma.lGPDRequest.findUnique({
      where: { id },
      select: { clienteId: true },
    });
    if (!existing) {
      throw new AppError("Solicitação não encontrada", 404, "NOT_FOUND");
    }

    if (existing.clienteId) {
      const clienteScope = getClienteScope(user);
      if (Object.keys(clienteScope).length > 0) {
        const accessible = await prisma.cliente.count({
          where: { id: existing.clienteId, deletedAt: null, ...clienteScope },
        });
        if (accessible === 0) {
          throw new AppError("Acesso negado ao cliente da solicitação", 403, "FORBIDDEN");
        }
      }
    }

    const updated = await updateLGPDRequestStatus(
      id,
      validated.status as LGPDRequestStatus,
      user.id,
      validated.response
    );

    await logSensitiveDataAccess(user, {
      entity: "LGPDRequest",
      entityId: id,
      action: "UPDATE_REQUEST_STATUS",
      purpose: `LGPD request status changed to ${validated.status}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

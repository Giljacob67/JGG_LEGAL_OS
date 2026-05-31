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
  exportClientDataForLGPD,
  processErasureRequest,
  processRectificationRequest,
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
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get("trackingId");
    const clienteEmail = searchParams.get("email");
    const cpfCnpj = searchParams.get("cpfCnpj");

    // Public self-service portal mode: data subject checking their own request status
    if (trackingId) {
      const request = await prisma.lGPDRequest.findUnique({
        where: { id: trackingId },
        select: {
          id: true,
          requestType: true,
          status: true,
          description: true,
          response: true,
          requestedAt: true,
          completedAt: true,
          cliente: { select: { email: true, cpfCnpj: true } },
        },
      });

      if (!request) {
        throw new AppError("Solicitação não encontrada", 404, "NOT_FOUND");
      }

      // Basic verification for public access (email or cpf match if provided)
      if (clienteEmail && request.cliente?.email !== clienteEmail) {
        throw new AppError("Dados de verificação não correspondem", 403, "FORBIDDEN");
      }
      if (cpfCnpj && request.cliente?.cpfCnpj !== cpfCnpj) {
        throw new AppError("Dados de verificação não correspondem", 403, "FORBIDDEN");
      }

      await logSensitiveDataAccess(
        { id: "public", email: clienteEmail || "public" } as any,
        {
          entity: "LGPDRequest",
          entityId: trackingId,
          action: "PUBLIC_STATUS_CHECK",
          purpose: "Data subject checked own LGPD request status via portal",
        }
      );

      return NextResponse.json({
        data: {
          id: request.id,
          requestType: request.requestType,
          status: request.status,
          description: request.description,
          response: request.response,
          requestedAt: request.requestedAt,
          completedAt: request.completedAt,
          // Enhanced basic portal data for data subject self-service
          cliente: {
            nome: request.cliente?.nome,
            email: request.cliente?.email,
          },
          resumo: {
            totalProcessos: await prisma.processo.count({ where: { clienteId: request.clienteId, deletedAt: null } }),
            totalPrazosAbertos: await prisma.prazo.count({ where: { clienteId: request.clienteId, status: "aberto", deletedAt: null } }),
          },
          processosRecentes: await prisma.processo.findMany({
            where: { clienteId: request.clienteId, deletedAt: null },
            select: { id: true, cnj: true, status: true, area: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          documentosRecentes: await prisma.documento.findMany({
            where: { clienteId: request.clienteId, deletedAt: null },
            select: { id: true, nome: true, tipo: true, status: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
        },
      });
    }

    // Internal authenticated flow (existing behavior)
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDRequestPermission(user, "view")) {
      throw new AppError("Sem permissão para visualizar solicitações LGPD", 403, "FORBIDDEN");
    }

    const clienteId = searchParams.get("clienteId");
    if (!clienteId) {
      throw new AppError("clienteId é obrigatório", 400, "VALIDATION_ERROR");
    }

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
    const body = await req.json();

    // Basic self-service portal support for data subjects (no full auth required)
    // Pen-test readiness: Rate limiting strongly recommended on this public endpoint
    if (body.isPublicDataSubjectRequest) {
      // Support public data export using trackingId (for data subjects who have a request ID)
      if (body.action === "export_data" && body.trackingId) {
        const req = await prisma.lGPDRequest.findUnique({
          where: { id: body.trackingId },
          include: { cliente: true },
        });
        if (!req?.cliente) {
          throw new AppError("Solicitação não encontrada", 404, "NOT_FOUND");
        }
        // Basic verification
        if (body.clienteEmail && req.cliente.email !== body.clienteEmail) {
          throw new AppError("Verificação falhou", 403, "FORBIDDEN");
        }

        // Public portal action: data subject can request their basic data summary
        if (body.action === "get_my_data") {
          const basicData = await exportClientDataForLGPD(req.cliente.id, { id: "public", email: body.clienteEmail || "public" } as any);
          return NextResponse.json({ 
            message: "Dados básicos do titular",
            data: {
              cliente: basicData.cliente,
              totalProcessos: basicData.processos?.length || 0,
              totalDocumentos: basicData.documentos?.length || 0,
            }
          });
        }

        const exportData = await exportClientDataForLGPD(req.cliente.id, { id: "public", email: body.clienteEmail || "public" } as any);
        return NextResponse.json(exportData);
      }

      if (!body.clienteEmail && !body.cpfCnpj) {
        throw new AppError("clienteEmail ou cpfCnpj é obrigatório para solicitação pública", 400, "VALIDATION_ERROR");
      }

      // Simple lookup for public data subject
      const where: any = {};
      if (body.clienteEmail) where.email = body.clienteEmail;
      else if (body.cpfCnpj) where.cpfCnpj = body.cpfCnpj;

      const cliente = await prisma.cliente.findFirst({ where: { ...where, deletedAt: null } });
      if (!cliente) {
        throw new AppError("Cliente não encontrado para os dados fornecidos", 404, "NOT_FOUND");
      }

      const publicRequest = await createLGPDRequest({
        clienteId: cliente.id,
        requestType: body.requestType as DataSubjectRight,
        description: body.description || "Solicitação via portal do titular",
        requestedBy: body.requestedBy || body.clienteEmail || "Titular",
      });

      await logSensitiveDataAccess({ id: "public", email: body.clienteEmail || "public" } as any, {
        entity: "LGPDRequest",
        entityId: publicRequest.id,
        action: "PUBLIC_DATA_SUBJECT_REQUEST",
        purpose: "LGPD request created via self-service portal",
      });

      // If it's a rectification with data, auto-apply it for the portal experience
      if (body.requestType === "rectification" && body.newData) {
        await processRectificationRequest(publicRequest.id, "public", body.newData).catch(() => {});
      }

      return NextResponse.json({ 
        id: publicRequest.id, 
        message: "Solicitação registrada com sucesso. Guarde este ID para acompanhar o andamento.",
        trackingId: publicRequest.id,
        tipo: publicRequest.requestType,
        status: publicRequest.status
      }, { status: 201 });
    }

    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDRequestPermission(user, "manage") && !hasLGPDRequestPermission(user, "view")) {
      throw new AppError("Sem permissão para criar solicitações LGPD", 403, "FORBIDDEN");
    }

    // Special action for data subject export (LGPD portability)
    if (body.action === "export_data" && body.clienteId) {
      const exportData = await exportClientDataForLGPD(body.clienteId, user);
      return NextResponse.json(exportData);
    }

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
    const erasureStrategy = body.erasureStrategy as 'soft_anonymization' | 'aggressive_anonymization' | 'hard_delete_referential' | undefined;

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

    // Fetch full request for strategy persistence and workflow automation
    const fullRequest = await prisma.lGPDRequest.findUnique({ where: { id } });

    // Persist chosen erasure strategy when provided
    if (erasureStrategy && fullRequest?.requestType === "erasure") {
      await prisma.lGPDRequest.update({
        where: { id },
        data: { erasureStrategy: erasureStrategy as any },
      }).catch(() => {});
    }

    const updated = await updateLGPDRequestStatus(
      id,
      validated.status as LGPDRequestStatus,
      user.id,
      validated.response
    );

    // Advanced workflow automation for key data subject rights
    // BullMQ example (foundation added in package.json):
    // In a real worker (e.g. workers/lgpd.worker.ts - to be created later):
    // import { Queue } from 'bullmq';
    // const lgpdQueue = new Queue('lgpd', { connection: redis });
    // Then: await lgpdQueue.add('process-erasure', { requestId: id, strategy });
    if (validated.status === "completed" && fullRequest) {
      if (fullRequest.requestType === "erasure") {
        if (erasureStrategy === "hard_delete_referential" && !body.confirmHardDelete) {
          throw new AppError("Confirmação obrigatória para estratégia hard_delete_referential", 400, "CONFIRMATION_REQUIRED");
        }
        await processErasureRequest(id, user.id, erasureStrategy || 'soft_anonymization').catch(() => {});
      } else if (fullRequest.requestType === "rectification") {
        await processRectificationRequest(id, user.id, body.newData).catch(() => {});
      } else if (fullRequest.requestType === "restriction_processing") {
        await logSensitiveDataAccess(user, {
          entity: "LGPDRequest",
          entityId: id,
          action: "LGPD_RESTRICTION_APPLIED",
          purpose: "LGPD restriction of processing applied",
        }).catch(() => {});
      }
    }

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

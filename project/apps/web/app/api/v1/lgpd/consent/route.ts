import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthUser,
  hasLGPDConsentPermission,
  registerConsent,
  revokeConsent,
  logSensitiveDataAccess,
  getClienteScope,
} from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { lgpdConsentSchema, lgpdConsentRevokeSchema } from "@/lib/validations/zod-schemas";
import { ConsentPurpose, Permission } from "@prisma/client";

// ============================================================
// GET /api/v1/lgpd/consent?clienteId=xxx
// List consents for a client (scoped + permission checked)
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDConsentPermission(user, "view")) {
      throw new AppError("Sem permissão para visualizar consentimentos LGPD", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get("clienteId");

    if (!clienteId) {
      throw new AppError("clienteId é obrigatório", 400, "VALIDATION_ERROR");
    }

    // Enforce scoping for non-privileged roles
    const clienteScope = getClienteScope(user);
    if (Object.keys(clienteScope).length > 0) {
      const accessible = await prisma.cliente.count({
        where: { id: clienteId, deletedAt: null, ...clienteScope },
      });
      if (accessible === 0) {
        throw new AppError("Cliente não encontrado ou sem acesso", 404, "NOT_FOUND");
      }
    }

    const consents = await prisma.consent.findMany({
      where: { clienteId },
      orderBy: { grantedAt: "desc" },
      include: {
        collectedBy: { select: { id: true, nome: true, email: true } },
      },
    });

    await logSensitiveDataAccess(user, {
      entity: "Consent",
      entityId: clienteId,
      action: "LIST_CONSENTS",
      purpose: "LGPD consent audit / data subject rights support",
    });

    return NextResponse.json({ data: consents });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================
// POST /api/v1/lgpd/consent
// Register new consent (requires manage permission + client access)
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDConsentPermission(user, "manage")) {
      throw new AppError("Sem permissão para gerenciar consentimentos LGPD", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const data = lgpdConsentSchema.parse(body);

    // Scoping enforcement
    const clienteScope = getClienteScope(user);
    if (Object.keys(clienteScope).length > 0) {
      const accessible = await prisma.cliente.count({
        where: { id: data.clienteId, deletedAt: null, ...clienteScope },
      });
      if (accessible === 0) {
        throw new AppError("Cliente não encontrado ou sem acesso", 404, "NOT_FOUND");
      }
    }

    // Capture audit metadata server-side (never trust client)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const consent = await registerConsent({
      clienteId: data.clienteId,
      purpose: data.purpose as ConsentPurpose,
      granted: data.granted,
      legalBasis: data.legalBasis,
      consentText: data.consentText,
      version: data.version,
      ipAddress,
      userAgent,
      collectedById: user.id,
    });

    await logSensitiveDataAccess(user, {
      entity: "Consent",
      entityId: consent.id,
      action: "REGISTER_CONSENT",
      purpose: `LGPD consent registration - purpose: ${data.purpose}`,
      ipAddress,
    });

    return NextResponse.json(consent, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ============================================================
// DELETE /api/v1/lgpd/consent  (revoke)
// Body: { consentId }
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasLGPDConsentPermission(user, "manage")) {
      throw new AppError("Sem permissão para revogar consentimentos", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const { consentId } = lgpdConsentRevokeSchema.parse(body);

    const consent = await prisma.consent.findUnique({
      where: { id: consentId },
      select: { clienteId: true },
    });
    if (!consent) {
      throw new AppError("Consentimento não encontrado", 404, "NOT_FOUND");
    }

    // Scoping
    const clienteScope = getClienteScope(user);
    if (Object.keys(clienteScope).length > 0) {
      const accessible = await prisma.cliente.count({
        where: { id: consent.clienteId, deletedAt: null, ...clienteScope },
      });
      if (accessible === 0) {
        throw new AppError("Acesso negado", 403, "FORBIDDEN");
      }
    }

    const revoked = await revokeConsent(consentId, user.id);

    await logSensitiveDataAccess(user, {
      entity: "Consent",
      entityId: consentId,
      action: "REVOKE_CONSENT",
      purpose: "LGPD consent revocation by authorized user",
    });

    return NextResponse.json(revoked);
  } catch (error) {
    return handleApiError(error);
  }
}

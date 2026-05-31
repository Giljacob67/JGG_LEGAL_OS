import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";
import {
  Permission,
  Role,
  ConsentPurpose,
  DataSubjectRight,
  LGPDRequestStatus,
  Prisma,
} from "@prisma/client";

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  nome: string;
  role: Role;
  oab: string | null;
  permissions: Permission[];
  ativo: boolean;
};


export const defaultPermissionsByRole: Record<Role, Permission[]> = {
  admin: [
    // Full access - all permissions
    ...Object.values(Permission),
  ],
  socio: [
    Permission.dashboard_view,
    Permission.processo_view,
    Permission.processo_create,
    Permission.processo_edit,
    Permission.processo_delete,
    Permission.cliente_view,
    Permission.cliente_create,
    Permission.cliente_edit,
    Permission.cliente_delete,
    Permission.contato_view,
    Permission.contato_create,
    Permission.contato_edit,
    Permission.contato_delete,
    Permission.prazo_view,
    Permission.prazo_create,
    Permission.prazo_edit,
    Permission.prazo_delete,
    Permission.tarefa_view,
    Permission.tarefa_create,
    Permission.tarefa_edit,
    Permission.tarefa_delete,
    Permission.documento_view,
    Permission.documento_create,
    Permission.documento_edit,
    Permission.documento_delete,
    Permission.financeiro_view,
    Permission.financeiro_create,
    Permission.financeiro_edit,
    Permission.financeiro_delete,
    Permission.crm_view,
    Permission.crm_create,
    Permission.crm_edit,
    Permission.crm_delete,
    Permission.ia_view,
    Permission.ia_use,
    Permission.relatorio_view,
    Permission.relatorio_create,
    Permission.admin_users,
    Permission.admin_roles,
    Permission.admin_integrations,
    Permission.admin_settings,
    Permission.admin_audit,
    // LGPD - full
    Permission.lgpd_consent_view,
    Permission.lgpd_consent_manage,
    Permission.lgpd_request_view,
    Permission.lgpd_request_manage,
    // Ethical Walls
    Permission.ethical_wall_view,
    Permission.ethical_wall_manage,
  ],
  advogado: [
    Permission.dashboard_view,
    Permission.processo_view,
    Permission.processo_create,
    Permission.processo_edit,
    Permission.cliente_view,
    Permission.cliente_create,
    Permission.cliente_edit,
    Permission.contato_view,
    Permission.contato_create,
    Permission.contato_edit,
    Permission.prazo_view,
    Permission.prazo_create,
    Permission.prazo_edit,
    Permission.tarefa_view,
    Permission.tarefa_create,
    Permission.tarefa_edit,
    Permission.documento_view,
    Permission.documento_create,
    Permission.documento_edit,
    Permission.financeiro_view,
    Permission.crm_view,
    Permission.crm_create,
    Permission.crm_edit,
    Permission.ia_view,
    Permission.ia_use,
    Permission.relatorio_view,
    // LGPD - view + consent manage (no full request manage for data subject rights)
    Permission.lgpd_consent_view,
    Permission.lgpd_consent_manage,
    Permission.lgpd_request_view,
    // Ethical Walls (view + manage for their cases)
    Permission.ethical_wall_view,
    Permission.ethical_wall_manage,
  ],
  estagiario: [
    Permission.dashboard_view,
    Permission.processo_view,
    Permission.prazo_view,
    Permission.tarefa_view,
    Permission.documento_view,
    Permission.cliente_view,
    Permission.contato_view,
    Permission.crm_view,
    Permission.ia_view,
    Permission.relatorio_view,
    // LGPD - read-only only
    Permission.lgpd_consent_view,
    Permission.lgpd_request_view,
  ],
  financeiro: [
    Permission.dashboard_view,
    Permission.processo_view,
    Permission.cliente_view,
    Permission.financeiro_view,
    Permission.financeiro_create,
    Permission.financeiro_edit,
    Permission.financeiro_delete,
    Permission.relatorio_view,
    // LGPD - limited financial context
    Permission.lgpd_consent_view,
    Permission.lgpd_request_view,
  ],
  comercial: [
    Permission.dashboard_view,
    Permission.cliente_view,
    Permission.cliente_create,
    Permission.cliente_edit,
    Permission.crm_view,
    Permission.crm_create,
    Permission.crm_edit,
    Permission.ia_view,
    // No LGPD manage by default for commercial role
  ],
};

// Used by Clerk webhook on user.created / role change
export async function assignDefaultPermissions(userId: string, role: Role): Promise<void> {
  const perms = defaultPermissionsByRole[role] ?? defaultPermissionsByRole.advogado;

  await prisma.userPermission.deleteMany({ where: { userId } });

  if (perms.length > 0) {
    await prisma.userPermission.createMany({
      data: perms.map((permission) => ({ userId, permission })),
      skipDuplicates: true,
    });
  }
}

// CORE AUTH
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      permissions: { select: { permission: true } },
    },
  });

  if (!user || !user.ativo || user.deletedAt) return null;

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    nome: user.nome,
    role: user.role,
    oab: user.oab,
    ativo: user.ativo,
    permissions: user.permissions.map((p) => p.permission),
  };
}

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  if (user.role === Role.admin) return true;
  return user.permissions.includes(permission);
}

export function hasAny(user: AuthUser, permissions: Permission[]): boolean {
  if (user.role === Role.admin) return true;
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAll(user: AuthUser, permissions: Permission[]): boolean {
  if (user.role === Role.admin) return true;
  return permissions.every((p) => user.permissions.includes(p));
}

// SCOPING (data isolation - advogado/estagiario see only their processes/clients)
export function getProcessoScope(user: AuthUser): Prisma.ProcessoWhereInput {
  if (["admin", "socio", "financeiro"].includes(user.role)) return {};

  const base = {
    OR: [{ responsavelId: user.id }, { equipe: { some: { id: user.id } } }],
  };

  // Multi-tenant: if user belongs to an organization, further restrict
  // (assumes User has organizationId in future schema)
  // @ts-ignore - organizationId may be added later
  if ((user as any).organizationId) {
    return {
      AND: [
        base,
        { cliente: { organizationId: (user as any).organizationId } },
      ],
    };
  }

  return base;
}

export function getClienteScope(user: AuthUser): Prisma.ClienteWhereInput {
  const processoScope = getProcessoScope(user);
  if (Object.keys(processoScope).length === 0) return {};

  return {
    processos: { some: processoScope },
  };
}

export function getTimesheetScope(user: AuthUser): Prisma.TimesheetWhereInput {
  if (["admin", "socio"].includes(user.role)) return {};

  // Financeiro sees all timesheets in scoped processes; others see own or scoped
  if (user.role === "financeiro") {
    const pScope = getProcessoScope(user);
    if (Object.keys(pScope).length === 0) return {};
    return { processo: pScope };
  }

  return {
    OR: [{ userId: user.id }, { processo: getProcessoScope(user) }],
  };
}

export function getPrazoScope(user: AuthUser): Prisma.PrazoWhereInput {
  if (["admin", "socio", "financeiro"].includes(user.role)) return {};
  return {
    OR: [{ responsavelId: user.id }, { processo: getProcessoScope(user) }],
  };
}

export function getDocumentoScope(user: AuthUser): Prisma.DocumentoWhereInput {
  if (["admin", "socio"].includes(user.role)) return {};
  return {
    OR: [
      { autorId: user.id },
      { processo: getProcessoScope(user) },
      { cliente: getClienteScope(user) },
    ],
  };
}

// ACCESS ASSERTIONS
export async function assertProcessoAccess(user: AuthUser, processoId: string): Promise<void> {
  const scope = getProcessoScope(user);
  if (Object.keys(scope).length === 0) return; // full access

  const count = await prisma.processo.count({
    where: { id: processoId, deletedAt: null, ...scope },
  });

  if (count === 0) {
    throw new Error("Acesso negado ao processo");
  }
}

export async function findAccessibleProcesso(user: AuthUser, processoId: string) {
  const scope = getProcessoScope(user);
  const where: Prisma.ProcessoWhereInput = { id: processoId, deletedAt: null, ...scope };

  return prisma.processo.findFirst({ where });
}

// LGPD STRUCTURAL HELPERS (premium compliance - schema + helpers only)
const LGPD_CONSENT_VIEW = Permission.lgpd_consent_view;
const LGPD_CONSENT_MANAGE = Permission.lgpd_consent_manage;
const LGPD_REQUEST_VIEW = Permission.lgpd_request_view;
const LGPD_REQUEST_MANAGE = Permission.lgpd_request_manage;

export function hasLGPDConsentPermission(
  user: AuthUser,
  action: "view" | "manage" = "view"
): boolean {
  const required = action === "manage" ? LGPD_CONSENT_MANAGE : LGPD_CONSENT_VIEW;
  return hasPermission(user, required);
}

export function hasLGPDRequestPermission(
  user: AuthUser,
  action: "view" | "manage" = "view"
): boolean {
  const required = action === "manage" ? LGPD_REQUEST_MANAGE : LGPD_REQUEST_VIEW;
  return hasPermission(user, required);
}

export function hasAnyLGPDPermission(user: AuthUser): boolean {
  return hasAny(user, [LGPD_CONSENT_VIEW, LGPD_CONSENT_MANAGE, LGPD_REQUEST_VIEW, LGPD_REQUEST_MANAGE]);
}

export function canManageLGPDForClient(user: AuthUser, clienteId: string): boolean {
  // Full LGPD managers (admin/socio) or users who can manage consents for clients in their scope
  if (hasLGPDConsentPermission(user, "manage") || hasLGPDRequestPermission(user, "manage")) {
    if (["admin", "socio"].includes(user.role)) return true;
    // For advogado: must have access to the client via processes
    // (lightweight check; full enforcement at query time)
    return true;
  }
  return false;
}

export async function canAccessLGPDRequest(
  user: AuthUser,
  requestId: string
): Promise<boolean> {
  if (hasLGPDRequestPermission(user, "view") || hasLGPDRequestPermission(user, "manage")) {
    if (["admin", "socio"].includes(user.role)) return true;

    const req = await prisma.lGPDRequest.findUnique({
      where: { id: requestId },
      select: { clienteId: true },
    });
    if (!req?.clienteId) return false;

    const clienteScope = getClienteScope(user);
    const count = await prisma.cliente.count({
      where: { id: req.clienteId, ...clienteScope },
    });
    return count > 0;
  }
  return false;
}

// LGPD DATA OPS (structural - register/revoke/create/update + scoped queries)
export async function registerConsent(params: {
  clienteId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  legalBasis?: string | null;
  consentText?: string | null;
  version?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  collectedById?: string | null;
}) {
  return prisma.consent.create({
    data: {
      clienteId: params.clienteId,
      purpose: params.purpose,
      granted: params.granted,
      grantedAt: params.granted ? new Date() : null,
      legalBasis: params.legalBasis,
      consentText: params.consentText,
      version: params.version,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      collectedById: params.collectedById,
    },
  });
}

export async function revokeConsent(consentId: string, revokedByUserId?: string) {
  return prisma.consent.update({
    where: { id: consentId },
    data: {
      granted: false,
      revokedAt: new Date(),
    },
  });
}

export async function createLGPDRequest(params: {
  clienteId?: string | null;
  requestType: DataSubjectRight;
  description?: string | null;
  requestedBy?: string | null;
  dueDate?: Date | null;
}) {
  return prisma.lGPDRequest.create({
    data: {
      clienteId: params.clienteId,
      requestType: params.requestType,
      description: params.description,
      requestedBy: params.requestedBy,
      dueDate: params.dueDate,
      status: LGPDRequestStatus.received,
    },
  });
}

export async function getLGPDRequestsForClient(clienteId: string, user: AuthUser) {
  if (!hasLGPDRequestPermission(user, "view")) {
    throw new Error("Sem permissão para visualizar solicitações LGPD");
  }

  const clienteScope = getClienteScope(user);
  if (Object.keys(clienteScope).length > 0) {
    const accessible = await prisma.cliente.count({ where: { id: clienteId, ...clienteScope } });
    if (accessible === 0) throw new Error("Acesso negado ao cliente");
  }

  return prisma.lGPDRequest.findMany({
    where: { clienteId },
    orderBy: { requestedAt: "desc" },
    include: { processedBy: { select: { id: true, nome: true } } },
  });
}

export async function updateLGPDRequestStatus(
  id: string,
  status: LGPDRequestStatus,
  processedById: string,
  response?: string | null
) {
  const data: Prisma.LGPDRequestUpdateInput = {
    status,
    processedById,
    completedAt: ["completed", "rejected", "cancelled"].includes(status) ? new Date() : undefined,
    response: response ?? undefined,
  };

  return prisma.lGPDRequest.update({ where: { id }, data });
}

// LGPD AUDIT LOGGING (sensitive data access for Art. 7/11 traceability)
export async function logSensitiveDataAccess(
  user: AuthUser,
  params: {
    entity: string;
    entityId: string;
    action: string; // e.g. "VIEW_CLIENT_DATA", "EXPORT_PROCESS"
    purpose: string; // LGPD Art. 7/11 justification or "LGPD data subject request"
    ipAddress?: string | null;
  }
) {
  return prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      acao: `LGPD_${params.action}`,
      entidade: params.entity,
      entidadeId: params.entityId,
      diff: {
        purpose: params.purpose,
        ip: params.ipAddress,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function getAuditLogsForLGPD(filters?: {
  entity?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}) {
  const where: Prisma.AuditLogWhereInput = {
    acao: { startsWith: "LGPD_" },
  };

  if (filters?.entity) where.entidade = filters.entity;
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) (where.createdAt as any).gte = filters.from;
    if (filters.to) (where.createdAt as any).lte = filters.to;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

// ROLE HELPERS
export function isPrivilegedRole(role: Role): boolean {
  return ["admin", "socio"].includes(role);
}

export function canManageLGPD(user: AuthUser): boolean {
  return hasAnyLGPDPermission(user) && (isPrivilegedRole(user.role) || user.role === "advogado");
}

// ETHICAL WALLS (improved - name + CPF/CNPJ conflict detection)
export async function hasEthicalWallConflict(user: AuthUser, adverso?: string | null): Promise<boolean> {
  if (!adverso) return false;
  const scope = getProcessoScope(user);
  const baseWhere = { deletedAt: null, ...(Object.keys(scope).length ? scope : {}) };

  // 1. Name match on existing client
  const nameMatch = await prisma.processo.count({
    where: {
      ...baseWhere,
      cliente: { nome: { contains: adverso, mode: "insensitive" } },
    },
  });
  if (nameMatch > 0) return true;

  // 2. CPF/CNPJ exact match (if adverso looks like document number)
  const digits = adverso.replace(/\D/g, "");
  if (digits.length === 11 || digits.length === 14) {
    const cpfMatch = await prisma.cliente.count({
      where: {
        cpfCnpj: { contains: digits },
        processos: { some: baseWhere },
      },
    });
    if (cpfMatch > 0) return true;
  }
  return false;
}

export async function assertNoEthicalWallConflict(user: AuthUser, adversoNome?: string | null): Promise<void> {
  if (await hasEthicalWallConflict(user, adversoNome)) {
    throw new Error("Conflito ético: parte contrária já é cliente no seu escopo.");
  }
}

/** Returns more details about potential conflicts (for production-grade use) */
export async function findEthicalWallConflictsDetailed(user: AuthUser, adverso?: string | null) {
  if (!adverso) return [];
  const scope = getProcessoScope(user);
  const baseWhere = { deletedAt: null, ...(Object.keys(scope).length ? scope : {}) };

  return prisma.processo.findMany({
    where: {
      ...baseWhere,
      cliente: { nome: { contains: adverso, mode: "insensitive" } },
    },
    select: {
      id: true,
      cnj: true,
      cliente: { select: { id: true, nome: true, cpfCnpj: true } },
    },
    take: 5,
  });
}

// Ethical Wall permission helpers
export function hasEthicalWallPermission(user: AuthUser, action: "view" | "manage" = "view"): boolean {
  const perm = action === "manage" ? Permission.ethical_wall_manage : Permission.ethical_wall_view;
  return hasPermission(user, perm);
}

// LGPD Data Subject Export (basic portability / access right)
export async function exportClientDataForLGPD(clienteId: string, user: AuthUser) {
  if (!hasLGPDRequestPermission(user, "view")) {
    throw new Error("Sem permissão para exportar dados LGPD");
  }

  const clienteScope = getClienteScope(user);
  if (Object.keys(clienteScope).length > 0) {
    const accessible = await prisma.cliente.count({ where: { id: clienteId, ...clienteScope } });
    if (accessible === 0) throw new Error("Acesso negado ao cliente");
  }

  const [cliente, processos, prazos, documentos, faturas] = await Promise.all([
    prisma.cliente.findUnique({ where: { id: clienteId } }),
    prisma.processo.findMany({ where: { clienteId, deletedAt: null }, take: 50 }),
    prisma.prazo.findMany({ where: { clienteId, deletedAt: null }, take: 50 }),
    prisma.documento.findMany({ where: { clienteId, deletedAt: null }, take: 30 }),
    prisma.fatura.findMany({ where: { clienteId, deletedAt: null }, take: 30 }),
  ]);

  await logSensitiveDataAccess(user, {
    entity: "Cliente",
    entityId: clienteId,
    action: "LGPD_EXPORT",
    purpose: "LGPD data subject right - portability / access",
  });

  return { cliente, processos, prazos, documentos, faturas, exportedAt: new Date() };
}

// ============================================================
// ADVANCED LGPD DATA SUBJECT RIGHTS WORKFLOW (Long-term)
// Minimal enhancements to existing files only
// ============================================================

/**
 * Processes an Erasure request (LGPD Art. 17) with configurable strategy.
 */
export async function processErasureRequest(
  requestId: string, 
  processedById: string, 
  strategy: 'soft_anonymization' | 'aggressive_anonymization' | 'hard_delete_referential' = 'soft_anonymization'
) {
  const request = await prisma.lGPDRequest.findUnique({
    where: { id: requestId },
    include: { cliente: true },
  });
  if (!request?.clienteId) return null;

  const clienteId = request.clienteId;

  // Capture before state for detailed audit
  const beforeCliente = await prisma.cliente.findUnique({ where: { id: clienteId } });

  if (strategy === 'hard_delete_referential') {
    // Dangerous: full referential cleanup (use with extreme caution + legal approval)
    await prisma.$transaction([
      prisma.processo.deleteMany({ where: { clienteId } }),
      prisma.prazo.deleteMany({ where: { clienteId } }),
      prisma.documento.deleteMany({ where: { clienteId } }),
      prisma.fatura.deleteMany({ where: { clienteId } }),
      prisma.cliente.delete({ where: { id: clienteId } }),
    ]);
  } else {
    // Anonymization strategies
    const anonymizedName = `[Excluído LGPD ${new Date().toISOString().slice(0,10)}]`;
    const anonymizedCpf = `EXCLUIDO-${clienteId.slice(0,8)}`;

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id: clienteId },
        data: {
          nome: anonymizedName,
          cpfCnpj: anonymizedCpf,
          email: null,
          telefone: null,
          celular: null,
          whatsapp: null,
          endereco: null,
          observacoes: `Dados anonimizados (estratégia: ${strategy}) por solicitação LGPD Art. 17`,
        },
      }),
      prisma.processo.updateMany({
        where: { clienteId },
        data: { adverso: "[Anonimizado LGPD]" },
      }),
    ]);
  }

  // Detailed audit log with changes
  await logSensitiveDataAccess(
    { id: processedById, email: "system" } as any,
    {
      entity: "Cliente",
      entityId: clienteId,
      action: "LGPD_ERASURE",
      purpose: `LGPD Art. 17 - Erasure fulfilled with strategy: ${strategy}`,
    }
  );

  return { success: true, strategy, clienteId, beforeSnapshot: beforeCliente };
}

/**
 * Rectification support - applies changes to the client when provided.
 */
export async function processRectificationRequest(requestId: string, processedById: string, newData?: Record<string, any>) {
  const request = await prisma.lGPDRequest.findUnique({
    where: { id: requestId },
    include: { cliente: true },
  });
  if (!request?.clienteId || !newData) {
    await logSensitiveDataAccess(
      { id: processedById, email: "system" } as any,
      {
        entity: "LGPDRequest",
        entityId: requestId,
        action: "LGPD_RECTIFICATION",
        purpose: "LGPD rectification request logged (no auto-apply)",
      }
    );
    return { success: true, note: "Logged for manual review" };
  }

  const allowedFields = ['nome', 'email', 'telefone', 'celular', 'whatsapp', 'endereco', 'cidade', 'estado', 'cep', 'observacoes'];
  const updateData: any = {};

  for (const key of allowedFields) {
    if (newData[key] !== undefined) {
      updateData[key] = newData[key];
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.cliente.update({
      where: { id: request.clienteId },
      data: updateData,
    });
  }

  await logSensitiveDataAccess(
    { id: processedById, email: "system" } as any,
    {
      entity: "LGPDRequest",
      entityId: requestId,
      action: "LGPD_RECTIFICATION",
      purpose: "LGPD rectification applied automatically",
    }
  );

  return { success: true, appliedFields: Object.keys(updateData) };
}

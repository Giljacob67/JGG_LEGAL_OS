/**
 * Atribui permissões padrão a um usuário baseado no role.
 */
export async function assignDefaultPermissions(
  userId: string,
  role: Role
): Promise<void> {
  const permissions = defaultPermissionsByRole[role] || [];

  await prisma.$transaction(
    permissions.map((permission) =>
      prisma.userPermission.upsert({
        where: {
          userId_permission: {
            userId,
            permission,
          },
        },
        update: {},
        create: {
          userId,
          permission,
        },
      })
    )
  );
}

// ------------------------------------------------------------------ //
// LGPD Helpers (Lei Geral de Proteção de Dados)                        //
// ------------------------------------------------------------------ //

/** Permissões relacionadas a LGPD */
export const LGPD_PERMISSIONS = {
  consentView: Permission.lgpd_consent_view,
  consentManage: Permission.lgpd_consent_manage,
  requestView: Permission.lgpd_request_view,
  requestManage: Permission.lgpd_request_manage,
} as const;

/**
 * Verifica se o usuário tem permissão para visualizar ou gerenciar consentimentos LGPD.
 */
export function hasLGPDConsentPermission(user: AuthUser, action: 'view' | 'manage' = 'view'): boolean {
  if (user.role === Role.admin) return true;

  if (action === 'manage') {
    return hasPermission(user, LGPD_PERMISSIONS.consentManage);
  }
  return hasPermission(user, LGPD_PERMISSIONS.consentView) || hasPermission(user, LGPD_PERMISSIONS.consentManage);
}

/**
 * Verifica se o usuário tem permissão para visualizar ou gerenciar solicitações de direitos do titular (LGPD).
 */
export function hasLGPDRequestPermission(user: AuthUser, action: 'view' | 'manage' = 'view'): boolean {
  if (user.role === Role.admin) return true;

  if (action === 'manage') {
    return hasPermission(user, LGPD_PERMISSIONS.requestManage);
  }
  return hasPermission(user, LGPD_PERMISSIONS.requestView) || hasPermission(user, LGPD_PERMISSIONS.requestManage);
}

/**
 * Verifica se o usuário pode gerenciar dados LGPD de um cliente específico.
 */
export function canManageLGPDForClient(user: AuthUser, clienteId: string): boolean {
  if (user.role === Role.admin) return true;

  const hasLGPDPerm = hasLGPDConsentPermission(user) || hasLGPDRequestPermission(user);
  const hasClientAccess = hasPermission(user, Permission.cliente_view);

  return hasLGPDPerm && hasClientAccess;
}

/**
 * Retorna true se o usuário tem qualquer permissão LGPD ativa.
 */
export function hasAnyLGPDPermission(user: AuthUser): boolean {
  if (user.role === Role.admin) return true;

  return (
    hasPermission(user, LGPD_PERMISSIONS.consentView) ||
    hasPermission(user, LGPD_PERMISSIONS.consentManage) ||
    hasPermission(user, LGPD_PERMISSIONS.requestView) ||
    hasPermission(user, LGPD_PERMISSIONS.requestManage)
  );
}

// ------------------------------------------------------------------ //
// LGPD - Funções de Registro e Solicitações (Estrutural)               //
// ------------------------------------------------------------------ //

/**
 * Registra um consentimento LGPD de forma estruturada.
 * Valida permissão antes de persistir.
 */
export async function recordConsent(params: {
  clienteId: string;
  purpose: any; // ConsentPurpose
  granted: boolean;
  legalBasis?: string;
  consentText?: string;
  version?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<any> { // Consent
  const user = await getAuthUser();
  if (!user || !hasLGPDConsentPermission(user, 'manage')) {
    throw new AppError('Sem permissão para gerenciar consentimentos LGPD', 403, 'FORBIDDEN');
  }

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
      collectedById: user.id,
    },
  });
}

/**
 * Cria uma solicitação de direitos do titular (LGPD).
 */
export async function createLGPDRequest(params: {
  clienteId?: string;
  requestType: any; // DataSubjectRight
  description?: string;
  requestedBy?: string;
}): Promise<any> { // LGPDRequest
  const user = await getAuthUser();
  if (!user || !hasLGPDRequestPermission(user, 'manage')) {
    throw new AppError('Sem permissão para gerenciar solicitações LGPD', 403, 'FORBIDDEN');
  }

  return prisma.lGPDRequest.create({
    data: {
      clienteId: params.clienteId,
      requestType: params.requestType,
      description: params.description,
      requestedBy: params.requestedBy,
      status: 'received',
    },
  });
}

/**
 * Registra acesso a dados sensíveis de forma estruturada para fins de LGPD.
 * Usa o AuditLog existente com prefixo LGPD_.
 */
export async function logLGPDDataAccess(params: {
  entidade: string;
  entidadeId: string;
  acao: string;
  details?: any;
}) {
  const user = await getAuthUser();

  await prisma.auditLog.create({
    data: {
      userId: user?.id,
      userEmail: user?.email,
      acao: `LGPD_${params.acao}`,
      entidade: params.entidade,
      entidadeId: params.entidadeId,
      diff: params.details ?? {},
      ip: undefined, // pode ser passado via contexto futuro
    },
  });
}

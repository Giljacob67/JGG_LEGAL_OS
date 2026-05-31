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
 * Por enquanto usa a mesma lógica de cliente_view + permissões LGPD.
 * Pode evoluir para scoping mais fino no futuro.
 */
export function canManageLGPDForClient(user: AuthUser, clienteId: string): boolean {
  if (user.role === Role.admin) return true;

  // Precisa de pelo menos permissão de visualização de consentimentos + acesso ao cliente
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

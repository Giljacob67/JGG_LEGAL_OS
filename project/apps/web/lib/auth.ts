import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { Permission, Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  nome: string;
  role: Role;
  permissions: Permission[];
};

/**
 * Obtém o usuário autenticado com permissões do banco.
 * Se o usuário existir no Clerk mas não no Prisma, cria automaticamente.
 * Deve ser usado em Server Components e Route Handlers.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId: clerkId } = await clerkAuth();
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({
    where: { clerkId },
    include: { permissions: true },
  });

  // Auto-sync: usuário existe no Clerk mas não no Prisma — cria com defaults
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const nome = clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName ?? email.split("@")[0] ?? "Usuário";
    const role = ((clerkUser.publicMetadata?.role as string) ?? "advogado") as Role;

    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        nome,
        role,
      },
      include: { permissions: true },
    });

    // Atribui permissões padrão do role
    await assignDefaultPermissions(user.id, role);

    // Recarrega com permissões
    user = await prisma.user.findUnique({
      where: { clerkId },
      include: { permissions: true },
    });
  }

  if (!user) return null;

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    nome: user.nome,
    role: user.role,
    permissions: user.permissions.map((p) => p.permission),
  };
}

/**
 * Verifica se o usuário tem uma permissão específica.
 * Admin sempre tem permissão.
 */
export function hasPermission(user: AuthUser, permission: Permission): boolean {
  if (user.role === Role.admin) return true;
  return user.permissions.includes(permission);
}

/**
 * Verifica se o usuário tem pelo menos uma das permissões.
 */
export function hasAnyPermission(
  user: AuthUser,
  permissions: Permission[]
): boolean {
  if (user.role === Role.admin) return true;
  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Verifica se o usuário tem todas as permissões listadas.
 */
export function hasAllPermissions(
  user: AuthUser,
  permissions: Permission[]
): boolean {
  if (user.role === Role.admin) return true;
  return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Verifica se o usuário tem um dos roles permitidos.
 */
export function hasRole(user: AuthUser, roles: Role[]): boolean {
  return roles.includes(user.role);
}

/**
 * Mapeamento de roles para permissões padrão.
 * Usado no webhook de criação de usuário para atribuir permissões iniciais.
 */
export const defaultPermissionsByRole: Record<Role, Permission[]> = {
  admin: Object.values(Permission),
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
  ],
  estagiario: [
    Permission.dashboard_view,
    Permission.processo_view,
    Permission.cliente_view,
    Permission.contato_view,
    Permission.prazo_view,
    Permission.tarefa_view,
    Permission.tarefa_create,
    Permission.tarefa_edit,
    Permission.documento_view,
    Permission.documento_create,
    Permission.crm_view,
  ],
  financeiro: [
    Permission.dashboard_view,
    Permission.cliente_view,
    Permission.financeiro_view,
    Permission.financeiro_create,
    Permission.financeiro_edit,
    Permission.financeiro_delete,
    Permission.financeiro_admin,
    Permission.relatorio_view,
    Permission.relatorio_create,
  ],
  comercial: [
    Permission.dashboard_view,
    Permission.cliente_view,
    Permission.cliente_create,
    Permission.cliente_edit,
    Permission.crm_view,
    Permission.crm_create,
    Permission.crm_edit,
    Permission.crm_delete,
    Permission.relatorio_view,
  ],
};

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

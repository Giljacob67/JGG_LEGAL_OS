import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  getAccessibleProcessoWhere,
  getProcessoListWhere,
} from "../lib/auth";
import { Role, Permission } from "@prisma/client";

describe("RBAC", () => {
  const adminUser = {
    id: "1", clerkId: "c1", email: "a@test.com", nome: "Admin",
    role: Role.admin, permissions: [Permission.cliente_view],
  };

  const advogadoUser = {
    id: "2", clerkId: "c2", email: "b@test.com", nome: "Adv",
    role: Role.advogado, permissions: [Permission.processo_view, Permission.cliente_view],
  };

  const estagiarioUser = {
    id: "3", clerkId: "c3", email: "e@test.com", nome: "Est",
    role: Role.estagiario, permissions: [Permission.processo_view],
  };

  test("admin sempre tem permissão", () => {
    expect(hasPermission(adminUser, Permission.admin_users)).toBe(true);
    expect(hasPermission(adminUser, Permission.processo_delete)).toBe(true);
  });

  test("advogado tem permissões atribuídas", () => {
    expect(hasPermission(advogadoUser, Permission.processo_view)).toBe(true);
    expect(hasPermission(advogadoUser, Permission.financeiro_view)).toBe(false);
  });

  test("hasAnyPermission", () => {
    expect(hasAnyPermission(advogadoUser, [Permission.processo_view, Permission.financeiro_view])).toBe(true);
    expect(hasAnyPermission(estagiarioUser, [Permission.financeiro_view, Permission.admin_users])).toBe(false);
  });

  test("hasAllPermissions", () => {
    expect(hasAllPermissions(advogadoUser, [Permission.processo_view, Permission.cliente_view])).toBe(true);
    expect(hasAllPermissions(advogadoUser, [Permission.processo_view, Permission.financeiro_view])).toBe(false);
  });

  test("hasRole", () => {
    expect(hasRole(advogadoUser, [Role.advogado, Role.socio])).toBe(true);
    expect(hasRole(estagiarioUser, [Role.advogado])).toBe(false);
  });

  test("getAccessibleProcessoWhere — admin sem escopo extra", () => {
    const where = getAccessibleProcessoWhere(adminUser, "proc-1");
    expect(where).toEqual({ id: "proc-1", deletedAt: null });
  });

  test("getAccessibleProcessoWhere — advogado com escopo", () => {
    const where = getAccessibleProcessoWhere(advogadoUser, "proc-1");
    expect(where).toEqual({
      AND: [
        { id: "proc-1", deletedAt: null },
        {
          OR: [
            { responsavelId: advogadoUser.id },
            { equipe: { some: { id: advogadoUser.id } } },
          ],
        },
      ],
    });
  });

  test("getProcessoListWhere — advogado inclui soft delete e escopo", () => {
    const where = getProcessoListWhere(advogadoUser);
    expect(where).toEqual({
      AND: [
        { deletedAt: null },
        {
          OR: [
            { responsavelId: advogadoUser.id },
            { equipe: { some: { id: advogadoUser.id } } },
          ],
        },
      ],
    });
  });
});

import {
  hasPermission,
  hasAny,
  hasAll,
  getProcessoScope,
  getClienteScope,
  getTimesheetScope,
  getPrazoScope,
  getDocumentoScope,
  hasLGPDConsentPermission,
  hasLGPDRequestPermission,
  hasAnyLGPDPermission,
  canManageLGPD,
  isPrivilegedRole,
  defaultPermissionsByRole,
} from "../lib/auth";
import { Role, Permission } from "@prisma/client";

describe("RBAC + LGPD (current implementation)", () => {
  const makeUser = (role: Role, extraPerms: Permission[] = []) => ({
    id: "u-" + role,
    clerkId: "c-" + role,
    email: role + "@test.com",
    nome: role,
    role,
    oab: null,
    permissions: [...(defaultPermissionsByRole[role] || []), ...extraPerms],
    ativo: true,
  });

  const admin = makeUser(Role.admin);
  const socio = makeUser(Role.socio);
  const advogado = makeUser(Role.advogado);
  const estagiario = makeUser(Role.estagiario);
  const financeiro = makeUser(Role.financeiro);

  // --- Core permission checks ---
  test("admin bypasses all permission checks", () => {
    expect(hasPermission(admin, Permission.admin_users)).toBe(true);
    expect(hasPermission(admin, Permission.lgpd_request_manage)).toBe(true);
    expect(hasAny(admin, [Permission.financeiro_admin, Permission.sistema_edit])).toBe(true);
    expect(hasAll(admin, [Permission.processo_delete, Permission.lgpd_consent_manage])).toBe(true);
  });

  test("advogado has expected base + LGPD view/manage consent", () => {
    expect(hasPermission(advogado, Permission.processo_edit)).toBe(true);
    expect(hasPermission(advogado, Permission.financeiro_delete)).toBe(false);
    expect(hasLGPDConsentPermission(advogado, "manage")).toBe(true);
    expect(hasLGPDRequestPermission(advogado, "manage")).toBe(false); // only view for advogado
  });

  test("estagiario has read-only LGPD", () => {
    expect(hasLGPDConsentPermission(estagiario, "view")).toBe(true);
    expect(hasLGPDConsentPermission(estagiario, "manage")).toBe(false);
    expect(hasLGPDRequestPermission(estagiario, "view")).toBe(true);
    expect(hasAnyLGPDPermission(estagiario)).toBe(true);
  });

  // --- Scoping (data isolation) ---
  test("getProcessoScope — privileged roles get full access (empty object)", () => {
    expect(getProcessoScope(admin)).toEqual({});
    expect(getProcessoScope(socio)).toEqual({});
    expect(getProcessoScope(financeiro)).toEqual({});
  });

  test("getProcessoScope — advogado/estagiario get OR responsavel OR equipe", () => {
    const scope = getProcessoScope(advogado);
    expect(scope).toHaveProperty("OR");
    expect((scope as any).OR).toEqual([
      { responsavelId: advogado.id },
      { equipe: { some: { id: advogado.id } } },
    ]);
  });

  test("getClienteScope — delegates to processo scope when restricted", () => {
    const cScope = getClienteScope(estagiario);
    expect(cScope).toHaveProperty("processos.some");
  });

  test("getTimesheetScope — financeiro uses processo scope, others own + processo", () => {
    const fScope = getTimesheetScope(financeiro);
    expect(fScope).toHaveProperty("processo");

    const eScope = getTimesheetScope(estagiario);
    expect(eScope).toHaveProperty("OR");
  });

  test("getPrazoScope and getDocumentoScope follow same privileged vs scoped pattern", () => {
    expect(getPrazoScope(admin)).toEqual({});
    expect(getDocumentoScope(socio)).toEqual({});
    expect(getPrazoScope(advogado)).toHaveProperty("OR");
  });

  // --- LGPD specific helpers ---
  test("hasLGPD*Permission functions work correctly per role", () => {
    expect(hasLGPDConsentPermission(socio, "manage")).toBe(true);
    expect(hasLGPDRequestPermission(socio, "manage")).toBe(true);

    expect(hasLGPDConsentPermission(advogado, "view")).toBe(true);
    expect(hasLGPDRequestPermission(advogado, "view")).toBe(true);
    expect(hasLGPDRequestPermission(advogado, "manage")).toBe(false);

    expect(hasAnyLGPDPermission(estagiario)).toBe(true);
    expect(hasAnyLGPDPermission(financeiro)).toBe(true);
  });

  test("canManageLGPD and isPrivilegedRole", () => {
    expect(isPrivilegedRole(Role.admin)).toBe(true);
    expect(isPrivilegedRole(Role.socio)).toBe(true);
    expect(isPrivilegedRole(Role.advogado)).toBe(false);

    expect(canManageLGPD(socio)).toBe(true);
    expect(canManageLGPD(advogado)).toBe(true);
    expect(canManageLGPD(estagiario)).toBe(false);
  });

  // --- defaultPermissionsByRole contains LGPD entries ---
  test("defaultPermissionsByRole grants correct LGPD perms per role", () => {
    const adminPerms = defaultPermissionsByRole[Role.admin];
    expect(adminPerms).toContain(Permission.lgpd_consent_manage);
    expect(adminPerms).toContain(Permission.lgpd_request_manage);

    const estPerms = defaultPermissionsByRole[Role.estagiario];
    expect(estPerms).toContain(Permission.lgpd_consent_view);
    expect(estPerms).not.toContain(Permission.lgpd_consent_manage);
  });
});

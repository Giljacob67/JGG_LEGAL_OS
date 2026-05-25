import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, hasAnyPermission, AuthUser } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";

type ApiHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse>;

/**
 * HOF que encapsula autenticação, autorização e error handling
 * para route handlers do Next.js App Router.
 *
 * Uso:
 *   export const GET = withAuth(Permission.processo_view, async (req, { user }) => { ... });
 *   export const POST = withAuth([Permission.processo_create, Permission.processo_edit], handler);
 *   export const GET = withAuth(null, handler); // apenas autenticado, sem check de permissão
 */
export function withAuth(
  permission: Permission | Permission[] | null,
  handler: (req: NextRequest, ctx: { user: AuthUser }) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest, context?: unknown) => {
    try {
      const user = await getAuthUser();
      if (!user) {
        throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
      }

      if (permission !== null) {
        const perms = Array.isArray(permission) ? permission : [permission];
        if (!hasAnyPermission(user, perms)) {
          throw new AppError("Sem permissão", 403, "FORBIDDEN");
        }
      }

      return await handler(req, { user, ...(context as object) });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wrapper simples que adiciona apenas error handling (sem auth).
 * Para rotas públicas que precisam de try/catch padronizado.
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

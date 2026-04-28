import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/cadastro(.*)",
  "/api(.*)",
  "/_next(.*)",
  "/favicon.ico",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/v1/admin(.*)",
]);

const isFinanceiroRoute = createRouteMatcher([
  "/financeiro(.*)",
  "/api/v1/finance(.*)",
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  // Rotas públicas não precisam de proteção
  if (isPublicRoute(req)) {
    return;
  }

  // Verifica autenticação
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verifica role via metadata do Clerk (otimizado — evita query ao banco no middleware)
  const session = await auth();
  const role = (session.sessionClaims?.public_metadata as any)?.role as
    | string
    | undefined;

  // Admin tem acesso a tudo
  if (role === "admin") {
    return;
  }

  // Proteção de rotas admin
  if (isAdminRoute(req) && role !== "admin" && role !== "socio") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Proteção de rotas financeiras
  if (
    isFinanceiroRoute(req) &&
    role !== "admin" &&
    role !== "socio" &&
    role !== "financeiro"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Outras rotas: qualquer usuário autenticado pode acessar
  // O controle granular de permissões (ex: editar cliente) é feito nas API routes e Server Components
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

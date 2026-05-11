import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceiroWrapper } from "@/components/financeiro/financeiro-wrapper";
import { Permission } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.financeiro_view)) redirect("/dashboard");

  const [contratos, faturas, timesheet, clientes, processos] = await Promise.all([
    prisma.contratoHonorarios.findMany({
      where: { deletedAt: null },
      include: { cliente: { select: { nome: true } }, processo: { select: { tipo: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []),
    prisma.fatura.findMany({
      where: { deletedAt: null },
      include: { cliente: { select: { nome: true } } },
      orderBy: { vencimento: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.timesheet.findMany({
      where: { deletedAt: null },
      orderBy: { data: "desc" },
      take: 20,
    }).catch(() => []),
    prisma.cliente.findMany({
      where: { deletedAt: null, status: "ativo" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }).catch(() => []),
    prisma.processo.findMany({
      where: { deletedAt: null, status: { not: "encerrado" } },
      select: { id: true, cnj: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []),
  ]);

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <FinanceiroWrapper
        contratos={contratos}
        faturas={faturas}
        timesheet={timesheet}
        clientes={clientes}
        processos={processos}
      />
    </div>
  );
}

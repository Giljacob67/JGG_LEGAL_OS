import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FinanceiroWrapper } from "@/components/financeiro/financeiro-wrapper";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

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
        contratos={contratos as any}
        faturas={faturas as any}
        timesheet={timesheet as any}
        clientes={clientes}
        processos={processos}
      />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { KpiCards } from "@/components/financeiro/kpi-cards";
import { ContratosList } from "@/components/financeiro/contratos-list";
import { FaturasList } from "@/components/financeiro/faturas-list";
import { TimesheetList } from "@/components/financeiro/timesheet-list";

export default async function FinanceiroPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const [contratos, faturas, timesheet] = await Promise.all([
    prisma.contratoHonorarios.findMany({
      where: { vigente: true },
      include: { cliente: { select: { nome: true } }, processo: { select: { tipo: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.fatura.findMany({
      orderBy: { vencimento: "desc" },
      include: { cliente: { select: { nome: true } } },
      take: 50,
    }),
    prisma.timesheet.findMany({
      orderBy: { data: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Controle de honorarios, faturas e timesheet</p>
      </div>

      <KpiCards contratos={contratos} faturas={faturas} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FaturasList faturas={faturas} />
          <TimesheetList registros={timesheet} />
        </div>
        <div>
          <ContratosList contratos={contratos} />
        </div>
      </div>
    </div>
  );
}
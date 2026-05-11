import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TimesheetWrapper } from "@/components/timesheet/timesheet-wrapper";
import { Permission } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Registro {
  id: string;
  userId: string;
  processoId?: string | null;
  data: string;
  horas: number;
  atividade: string;
  faturado: boolean;
  user?: { id: string; nome: string } | null;
}

interface Processo { id: string; cnj: string; }

export default async function TimesheetPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.financeiro_view)) redirect("/dashboard");

  let registros: Registro[] = [];
  let processos: Processo[] = [];
  try {
    [registros, processos] = await Promise.all([
      prisma.timesheet.findMany({
        where: { deletedAt: null },
        include: { user: { select: { id: true, nome: true } } },
        orderBy: { data: "desc" },
        take: 100,
      }),
      prisma.processo.findMany({ where: { deletedAt: null }, select: { id: true, cnj: true }, orderBy: { updatedAt: "desc" }, take: 200 }),
    ]) as unknown as [Registro[], Processo[]];
  } catch {
    registros = [];
    processos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <TimesheetWrapper initialRegistros={registros} processos={processos} />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { TimesheetWrapper } from "@/components/timesheet/timesheet-wrapper";

export const dynamic = "force-dynamic";

export default async function TimesheetPage() {
  let registros: any[] = [];
  let processos: any[] = [];
  try {
    [registros, processos] = await Promise.all([
      prisma.timesheet.findMany({
        where: { deletedAt: null },
        include: { user: { select: { id: true, nome: true } } },
        orderBy: { data: "desc" },
        take: 100,
      }),
      prisma.processo.findMany({ where: { deletedAt: null }, select: { id: true, cnj: true }, orderBy: { updatedAt: "desc" }, take: 200 }),
    ]);
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

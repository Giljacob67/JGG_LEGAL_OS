import { prisma } from "@/lib/db";
import { ContratosWrapper } from "@/components/contratos/contratos-wrapper";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  let contratos: any[] = [];
  let clientes: any[] = [];
  let processos: any[] = [];
  try {
    [contratos, clientes, processos] = await Promise.all([
      prisma.contratoHonorarios.findMany({
        where: { deletedAt: null },
        include: {
          cliente: { select: { id: true, nome: true } },
          processo: { select: { id: true, cnj: true } },
          _count: { select: { faturas: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.cliente.findMany({ where: { deletedAt: null }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
      prisma.processo.findMany({ where: { deletedAt: null }, select: { id: true, cnj: true }, orderBy: { updatedAt: "desc" }, take: 200 }),
    ]);
  } catch {
    contratos = [];
    clientes = [];
    processos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <ContratosWrapper initialContratos={contratos} clientes={clientes} processos={processos} />
    </div>
  );
}

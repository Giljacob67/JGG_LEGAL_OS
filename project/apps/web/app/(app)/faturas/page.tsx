import { prisma } from "@/lib/db";
import { FaturasWrapper } from "@/components/faturas/faturas-wrapper";

export const dynamic = "force-dynamic";

export default async function FaturasPage() {
  let faturas: any[] = [];
  let clientes: any[] = [];
  let contratos: any[] = [];
  try {
    [faturas, clientes, contratos] = await Promise.all([
      prisma.fatura.findMany({
        where: { deletedAt: null },
        include: {
          cliente: { select: { id: true, nome: true } },
          contrato: { select: { id: true, numero: true, tipo: true } },
          emitidoPor: { select: { id: true, nome: true } },
        },
        orderBy: { vencimento: "asc" },
        take: 100,
      }),
      prisma.cliente.findMany({ where: { deletedAt: null }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
      prisma.contratoHonorarios.findMany({ where: { deletedAt: null, vigente: true }, select: { id: true, numero: true, tipo: true }, orderBy: { createdAt: "desc" } }),
    ]);
  } catch {
    faturas = [];
    clientes = [];
    contratos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <FaturasWrapper initialFaturas={faturas} clientes={clientes} contratos={contratos} />
    </div>
  );
}

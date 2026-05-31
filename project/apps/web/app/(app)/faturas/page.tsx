import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoScope } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FaturasWrapper } from "@/components/faturas/faturas-wrapper";
import { Permission } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Fatura {
  id: string;
  numero?: string | null;
  clienteId: string;
  contratoId?: string | null;
  mes: string;
  ano?: number | null;
  valor: number;
  desconto?: number | null;
  status: string;
  vencimento: string;
  pagoEm?: string | null;
  formaPagamento?: string | null;
  observacoes?: string | null;
  cliente?: { id: string; nome: string } | null;
  contrato?: { id: string; numero?: string | null; tipo: string } | null;
  emitidoPor?: { id: string; nome: string } | null;
}

interface Cliente { id: string; nome: string; }
interface Contrato { id: string; numero?: string | null; tipo: string; }

export default async function FaturasPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.financeiro_view)) redirect("/dashboard");

  const processoScope = getProcessoScope(user);

  let faturas: Fatura[] = [];
  let clientes: Cliente[] = [];
  let contratos: Contrato[] = [];
  try {
    [faturas, clientes, contratos] = await Promise.all([
      prisma.fatura.findMany({
        where: {
          deletedAt: null,
          ...(Object.keys(processoScope).length > 0 ? { processo: processoScope } : {}),
        },
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
    ]) as unknown as [Fatura[], Cliente[], Contrato[]];
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

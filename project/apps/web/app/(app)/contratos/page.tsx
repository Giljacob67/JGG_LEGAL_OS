import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission, getProcessoScope } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContratosWrapper } from "@/components/contratos/contratos-wrapper";
import { Permission } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Contrato {
  id: string;
  numero?: string | null;
  clienteId: string;
  processoId?: string | null;
  tipo: string;
  valorFixo?: number | null;
  percentual?: number | null;
  taxaHora?: number | null;
  horasMes?: number | null;
  estimativa?: number | null;
  vigente: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  observacoes?: string | null;
  cliente?: { id: string; nome: string } | null;
  processo?: { id: string; cnj: string } | null;
  _count?: { faturas: number };
}

interface Cliente { id: string; nome: string; }
interface Processo { id: string; cnj: string; }

export default async function ContratosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.financeiro_view)) redirect("/dashboard");

  const processoScope = getProcessoScope(user);

  let contratos: Contrato[] = [];
  let clientes: Cliente[] = [];
  let processos: Processo[] = [];
  try {
    [contratos, clientes, processos] = await Promise.all([
      prisma.contratoHonorarios.findMany({
        where: {
          deletedAt: null,
          ...(Object.keys(processoScope).length > 0 ? { processo: processoScope } : {}),
        },
        include: {
          cliente: { select: { id: true, nome: true } },
          processo: { select: { id: true, cnj: true } },
          _count: { select: { faturas: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.cliente.findMany({ where: { deletedAt: null }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
      prisma.processo.findMany({
        where: { deletedAt: null, ...processoScope },
        select: { id: true, cnj: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]) as unknown as [Contrato[], Cliente[], Processo[]];
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

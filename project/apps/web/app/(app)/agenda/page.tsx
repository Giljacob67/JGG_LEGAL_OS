import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AgendaWrapper } from "@/components/agenda/agenda-wrapper";
import { Permission } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Prazo {
  id: string;
  tipo: string;
  titulo: string;
  vence: Date | string;
  status: string;
  descricao?: string | null;
  prazoInterno?: Date | string | null;
  responsavelId?: string | null;
  processoId?: string | null;
  clienteId?: string | null;
  notificar?: boolean;
  responsavel?: { nome: string; cor?: string | null; avatar?: string | null } | null;
  processo?: { cnj: string; cliente?: { nome: string } | null } | null;
}

interface Processo {
  id: string;
  cnj: string;
  cliente?: { nome: string } | null;
}

export default async function AgendaPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.prazo_view)) redirect("/dashboard");

  const [prazos, users, processos] = await Promise.all([
    prisma.prazo.findMany({
      where: { deletedAt: null },
      include: {
        processo: { include: { cliente: true } },
        responsavel: true,
      },
      orderBy: { vence: "asc" },
    }).catch(() => []),
    prisma.user.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }).catch(() => []),
    prisma.processo.findMany({
      where: { deletedAt: null, status: { not: "encerrado" } },
      select: { id: true, cnj: true, cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []),
  ]);

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <AgendaWrapper
        initialPrazos={prazos as unknown as Prazo[]}
        users={users}
        processos={processos as unknown as Processo[]}
      />
    </div>
  );
}

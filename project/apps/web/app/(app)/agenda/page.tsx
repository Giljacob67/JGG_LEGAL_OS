import { prisma } from "@/lib/db";
import { AgendaWrapper } from "@/components/agenda/agenda-wrapper";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
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
        initialPrazos={prazos as any}
        users={users}
        processos={processos as any}
      />
    </div>
  );
}

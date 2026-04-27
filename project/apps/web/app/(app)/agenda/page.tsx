import { prisma } from "@/lib/db";
import { KanbanView } from "@/components/agenda/kanban-view";
import { ListaView } from "@/components/agenda/lista-view";
import { CalendarioView } from "@/components/agenda/calendario-view";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  let prazos: any[] = [];
  try {
    prazos = await prisma.prazo.findMany({
      include: {
        processo: { include: { cliente: true } },
        responsavel: true,
      },
      orderBy: { vence: "asc" },
    });
  } catch {
    prazos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Agenda & Prazos</h1>
          <p className="text-xs text-muted-foreground">
            {prazos.length} prazos abertos · integrado com DataJud
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-colors">
          + Novo prazo
        </button>
      </div>

      <div className="mb-6">
        <KanbanView prazos={prazos} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListaView prazos={prazos} />
        <CalendarioView prazos={prazos} />
      </div>
    </div>
  );
}
import { prisma } from "@/lib/db";
import { BuscaCNJ } from "@/components/processos/busca-cnj";
import { TabelaProcessos } from "@/components/processos/tabela-processos";

export const dynamic = "force-dynamic";

export default async function ProcessosPage() {
  let processos: any[] = [];

  try {
    processos = await prisma.processo.findMany({
      include: {
        cliente: true,
        responsavel: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    // Banco nao configurado ainda; retorna lista vazia
    processos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Processos</h1>
          <p className="text-xs text-muted-foreground">
            {processos.length} processos · integracao DataJud ativa
          </p>
        </div>
      </div>

      <div className="mb-5">
        <BuscaCNJ />
      </div>

      <TabelaProcessos processos={processos} />
    </div>
  );
}
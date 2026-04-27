"use client";

import Link from "next/link";

interface ProcessoRow {
  id: string;
  cnj: string;
  tipo: string;
  status: string;
  risco: string;
  area: string;
  valor: any;
  proximoPrazo?: Date | null;
  cliente?: { nome: string } | null;
  responsavel?: { nome: string; avatar?: string | null; cor?: string | null } | null;
}

export function TabelaProcessos({ processos }: { processos: ProcessoRow[] }) {
  if (processos.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground text-sm">Nenhum processo cadastrado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Use a busca acima para importar do DataJud ou cadastre manualmente.</p>
      </div>
    );
  }

  const statusMap: Record<string, string> = {
    em_andamento: "Em andamento",
    suspenso: "Suspenso",
    arquivado: "Arquivado",
    encerrado: "Encerrado",
  };

  const riscoClasses: Record<string, string> = {
    alto: "bg-destructive/10 text-destructive border-transparent",
    medio: "bg-[var(--status-warn-bg)] text-[var(--status-warn)] border-transparent",
    baixo: "bg-[var(--status-success-bg)] text-[var(--status-success)] border-transparent",
  };

  const areaClasses: Record<string, string> = {
    bancario: "bg-accent/10 text-accent border-transparent",
    agrario: "bg-[var(--status-info-bg)] text-[var(--status-info)] border-transparent",
    tributario: "bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)] border-transparent",
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">CNJ</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Area</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Risco</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {processos.map((p) => (
              <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.cnj}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.cliente?.nome || "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.tipo}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${areaClasses[p.area] || "bg-muted text-muted-foreground"}`}>
                    {p.area}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular font-medium">
                  {p.valor ? `R$ ${Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${riscoClasses[p.risco] || "bg-muted text-muted-foreground"}`}>
                    {p.risco}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{statusMap[p.status] || p.status}</td>
                <td className="px-4 py-3">
                  {p.responsavel ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                        style={{ background: p.responsavel.cor || "var(--jgg-navy-700)" }}
                      >
                        {p.responsavel.avatar || p.responsavel.nome.charAt(0)}
                      </div>
                      <span className="text-xs">{p.responsavel.nome}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
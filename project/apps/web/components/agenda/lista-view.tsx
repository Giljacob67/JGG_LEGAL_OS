"use client";

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

export function ListaView({ prazos, onEdit, onDelete }: { prazos: Prazo[]; onEdit?: (p: Prazo) => void; onDelete?: (p: Prazo) => void }) {
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  function diasAte(vence: Date | string) {
    const d = new Date(vence); d.setHours(0,0,0,0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Lista de prazos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Vence</th>
              <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Prazo</th>
              <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Processo</th>
              <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Tipo</th>
              <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Resp.</th>
            </tr>
          </thead>
          <tbody>
            {prazos.map((pz) => {
              const d = diasAte(pz.vence);
              return (
                <tr key={pz.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className={`font-serif text-lg font-bold ${d <= 3 ? "text-destructive" : "text-foreground"}`}>
                      {d === 0 ? "HOJE" : `${d}d`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{new Date(pz.vence).toLocaleDateString("pt-BR")}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{pz.titulo}</div>
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(pz); }} className="text-[10px] text-muted-foreground hover:text-foreground underline">Editar</button>
                      )}
                      {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(pz); }} className="text-[10px] text-muted-foreground hover:text-destructive underline">Excluir</button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-foreground">{pz.processo?.cliente?.nome?.slice(0, 28) || "-"}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{pz.processo?.cnj || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      pz.tipo === "fatal" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      pz.tipo === "audiencia" ? "bg-[var(--status-warn-bg)] text-[var(--status-warn)] border-[var(--status-warn)]/20" :
                      "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20"
                    }`}>{pz.tipo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold" style={{ background: pz.responsavel?.cor || "var(--jgg-navy-700)" }}>
                        {pz.responsavel?.avatar || pz.responsavel?.nome?.charAt(0) || "?"}
                      </div>
                      <span className="text-xs">{pz.responsavel?.nome?.split(" ")[0] || "-"}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
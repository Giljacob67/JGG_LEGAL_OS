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

export function KanbanView({ prazos, onEdit, onDelete }: { prazos: Prazo[]; onEdit?: (p: Prazo) => void; onDelete?: (p: Prazo) => void }) {
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const cols = [
    { id: "critico", label: "Criticos · <= 3 dias", cor: "bg-destructive/10 text-destructive border-destructive/20" },
    { id: "semana", label: "Esta semana · 4-7 dias", cor: "bg-[var(--status-warn-bg)] text-[var(--status-warn)] border-[var(--status-warn)]/20" },
    { id: "quinzena", label: "Proximos 14 dias", cor: "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20" },
    { id: "mes", label: "Mais de 14 dias", cor: "bg-muted text-muted-foreground border-muted" },
  ];

  function diasAte(vence: Date | string) {
    const d = new Date(vence);
    d.setHours(0,0,0,0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  const items = cols.map((col) => {
    const filtrados = prazos.filter((p) => {
      const d = diasAte(p.vence);
      if (col.id === "critico") return d <= 3;
      if (col.id === "semana") return d > 3 && d <= 7;
      if (col.id === "quinzena") return d > 7 && d <= 14;
      return d > 14;
    });
    return { ...col, items: filtrados };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((col) => (
        <div key={col.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className={`w-2 h-2 rounded-full ${col.cor.split(" ")[0].replace("bg-", "bg-").replace("/10", "")}`} />
            <span className="text-xs font-semibold text-foreground">{col.label}</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{col.items.length}</span>
          </div>
          {col.items.map((pz) => {
            const d = diasAte(pz.vence);
            return (
              <div key={pz.id} className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow group">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                    pz.tipo === "fatal" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    pz.tipo === "audiencia" ? "bg-[var(--status-warn-bg)] text-[var(--status-warn)] border-[var(--status-warn)]/20" :
                    "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20"
                  }`}>
                    {pz.tipo}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground">{d === 0 ? "HOJE" : `${d}d`}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(pz); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(pz); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground mb-1">{pz.titulo}</div>
                <div className="text-[11px] text-muted-foreground mb-2">{pz.processo?.cliente?.nome?.slice(0, 32) || "-"}</div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold" style={{ background: pz.responsavel?.cor || "var(--jgg-navy-700)" }}>
                    {pz.responsavel?.avatar || pz.responsavel?.nome?.charAt(0) || "?"}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{pz.processo?.cnj?.slice(-8) || "-"}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
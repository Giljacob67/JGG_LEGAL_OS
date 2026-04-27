"use client";

interface Prazo {
  id: string;
  tipo: string;
  titulo: string;
  vence: Date | string;
  status: string;
  responsavel?: { nome: string; cor?: string | null; avatar?: string | null } | null;
  processo?: { cnj: string; cliente?: { nome: string } | null } | null;
}

export function KanbanView({ prazos }: { prazos: Prazo[] }) {
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
              <div key={pz.id} className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                    pz.tipo === "fatal" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    pz.tipo === "audiencia" ? "bg-[var(--status-warn-bg)] text-[var(--status-warn)] border-[var(--status-warn)]/20" :
                    "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20"
                  }`}>
                    {pz.tipo}
                  </span>
                  <span className="ml-auto text-[10px] font-mono font-semibold text-muted-foreground">{d === 0 ? "HOJE" : `${d}d`}</span>
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
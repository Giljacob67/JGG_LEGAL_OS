"use client";

interface Prazo {
  id: string;
  tipo: string;
  titulo: string;
  vence: Date | string;
}

export function CalendarioView({ prazos }: { prazos: Prazo[] }) {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);

  const prazosMap: Record<string, Prazo[]> = {};
  prazos.forEach((pz) => {
    const iso = new Date(pz.vence).toISOString().slice(0, 10);
    if (!prazosMap[iso]) prazosMap[iso] = [];
    prazosMap[iso].push(pz);
  });

  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const start = new Date(hoje);
  start.setDate(hoje.getDate() - hoje.getDay() + 1);

  const dias: Date[] = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dias.push(d);
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Calendario</h3>
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />fatal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--status-warn)]" />audiencia</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--status-info)]" />outros</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 bg-border rounded-lg overflow-hidden">
        {diasSemana.map((n) => (
          <div key={n} className="bg-muted/70 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground text-center uppercase tracking-wide">
            {n}
          </div>
        ))}
        {dias.map((dt) => {
          const iso = dt.toISOString().slice(0, 10);
          const lista = prazosMap[iso] || [];
          const isHoje = iso === hojeStr;
          const fimDeSemana = dt.getDay() === 0 || dt.getDay() === 6;
          return (
            <div key={iso} className={`min-h-[72px] bg-card p-1 ${fimDeSemana ? "opacity-60" : ""} ${isHoje ? "ring-1 ring-inset ring-accent" : ""}`}>
              <div className={`text-[11px] font-medium mb-1 ${isHoje ? "text-accent font-bold" : "text-foreground"}`}>
                {dt.getDate()}
              </div>
              {lista.slice(0, 2).map((pz) => {
                const cor = pz.tipo === "fatal" ? "bg-destructive" : pz.tipo === "audiencia" ? "bg-[var(--status-warn)]" : "bg-[var(--status-info)]";
                return (
                  <div key={pz.id} className={`text-[9px] px-1 py-0.5 rounded mb-0.5 text-white truncate ${cor}`}>
                    {pz.titulo.slice(0, 16)}
                  </div>
                );
              })}
              {lista.length > 2 && (
                <div className="text-[9px] text-muted-foreground pl-1">+{lista.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
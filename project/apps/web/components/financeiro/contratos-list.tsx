"use client";

export function ContratosList({ contratos, onEdit, onDelete }: { contratos: any[]; onEdit?: (c: any) => void; onDelete?: (c: any) => void }) {
  if (contratos.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold mb-3">Contratos de honorarios</h3>
        <p className="text-xs text-muted-foreground">Nenhum contrato cadastrado.</p>
      </div>
    );
  }

  const tipoLabel: Record<string, string> = {
    fixo_mensal: "Fixo mensal",
    exito: "Por exito",
    hora: "Por hora",
    combinado: "Combinado",
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Contratos de honorarios</h3>
      </div>
      <div className="divide-y">
        {contratos.map((c) => (
          <div key={c.id} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer group relative">
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(c); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                c.tipo === "exito" ? "bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)] border-[var(--jgg-gold-500)]/20" :
                c.tipo === "fixo_mensal" ? "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20" :
                "bg-muted text-muted-foreground border-muted"
              }`}>
                {tipoLabel[c.tipo] || c.tipo}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] border border-transparent">Vigente</span>
            </div>
            <div className="text-sm font-medium text-foreground">{c.cliente?.nome}</div>
            <div className="text-[11px] text-muted-foreground">{c.processo?.tipo || "Sem processo vinculado"}</div>
            <div className="mt-2 text-sm font-serif font-semibold text-foreground">
              {c.estimativa ? `R$ ${Number(c.estimativa).toLocaleString("pt-BR")}` : c.valorFixo ? `R$ ${Number(c.valorFixo).toLocaleString("pt-BR")}` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
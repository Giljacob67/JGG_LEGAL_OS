"use client";

export function ContratosList({ contratos }: { contratos: any[] }) {
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
          <div key={c.id} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer">
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
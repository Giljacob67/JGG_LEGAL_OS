"use client";

export function TimesheetList({ registros, onEdit, onDelete }: { registros: any[]; onEdit?: (t: any) => void; onDelete?: (t: any) => void }) {
  if (registros.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold mb-3">Timesheet</h3>
        <p className="text-xs text-muted-foreground">Nenhum registro de horas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Timesheet</h3>
      </div>
      <div className="divide-y">
        {registros.map((t) => (
          <div key={t.id} className="p-4 hover:bg-muted/20 transition-colors group relative">
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(t); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">{t.atividade}</span>
              <span className="ml-auto text-xs font-mono font-semibold text-foreground">{Number(t.horas).toFixed(1)}h</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t.data ? new Date(t.data).toLocaleDateString("pt-BR") : "—"}
              {t.processoId ? ` · Processo ${t.processoId.slice(-6)}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
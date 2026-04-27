"use client";

export function TimesheetList({ registros }: { registros: any[] }) {
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
          <div key={t.id} className="p-4 hover:bg-muted/20 transition-colors">
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
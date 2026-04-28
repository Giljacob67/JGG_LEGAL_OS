"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function FaturasList({ faturas, onEdit, onDelete }: { faturas: any[]; onEdit?: (f: any) => void; onDelete?: (f: any) => void }) {
  if (faturas.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold mb-3">Faturas</h3>
        <p className="text-xs text-muted-foreground">Nenhuma fatura cadastrada.</p>
      </div>
    );
  }

  const statusIcon: Record<string, any> = {
    pago: CheckCircle2,
    pendente: Clock,
    atrasado: AlertCircle,
  };

  const statusClass: Record<string, string> = {
    pago: "text-[var(--status-success)]",
    pendente: "text-[var(--status-info)]",
    atrasado: "text-[var(--status-danger)]",
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Faturas</h3>
      </div>
      <div className="divide-y">
        {faturas.map((f) => {
          const Icon = statusIcon[f.status] || Clock;
          return (
            <div key={f.id} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer group relative">
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button onClick={(e) => { e.stopPropagation(); onEdit(f); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                )}
                {onDelete && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(f); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}
              </div>
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 ${statusClass[f.status] || "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{f.cliente?.nome}</span>
                    <span className="ml-auto text-sm font-serif font-semibold text-foreground">R$ {Number(f.valor).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Vencimento: {new Date(f.vencimento).toLocaleDateString("pt-BR")}
                    {f.status === "pago" && f.pagoEm ? ` · Pago em ${new Date(f.pagoEm).toLocaleDateString("pt-BR")}` : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
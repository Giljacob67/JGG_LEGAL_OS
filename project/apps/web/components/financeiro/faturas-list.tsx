"use client";

import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function FaturasList({ faturas }: { faturas: any[] }) {
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
            <div key={f.id} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer">
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
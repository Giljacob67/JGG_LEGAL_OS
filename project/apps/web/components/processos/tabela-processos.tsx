"use client";

import Link from "next/link";
import { Pencil, Trash2, Database, AlertTriangle, XCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREA_LABELS, AREA_TAILWIND, RISCO_TAILWIND, STATUS_PROCESSO } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Processo } from "@/lib/types";

type ProcessoRow = Processo;

export function TabelaProcessos({
  processos,
  onEdit,
  onDelete,
}: {
  processos: ProcessoRow[];
  onEdit?: (p: ProcessoRow) => void;
  onDelete?: (id: string) => void;
}) {
  if (processos.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground text-sm">Nenhum processo encontrado.</p>
        <p className="text-xs text-muted-foreground mt-1">Use a busca acima para importar do DataJud ou cadastre manualmente.</p>
      </div>
    );
  }


  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">CNJ</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Área</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Risco</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Fonte</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Resp.</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {processos.map((p) => (
              <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/processos/${p.id}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {p.cnj}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {p.cliente?.nome || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${AREA_TAILWIND[p.area] ? `${AREA_TAILWIND[p.area].bg} ${AREA_TAILWIND[p.area].text} ${AREA_TAILWIND[p.area].border}` : "bg-muted text-muted-foreground"}`}>
                    {AREA_LABELS[p.area] || p.area}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular font-medium">
                  {p.valorCausa != null ? formatCurrency(p.valorCausa) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${RISCO_TAILWIND[p.risco] ? `${RISCO_TAILWIND[p.risco].bg} ${RISCO_TAILWIND[p.risco].text} ${RISCO_TAILWIND[p.risco].border}` : "bg-muted text-muted-foreground"}`}>
                    {p.risco}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{STATUS_PROCESSO[p.status] || p.status}</td>
                <td className="px-4 py-3">
                  {(() => {
                    if (!p.fontes || p.fontes.length === 0) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60" title="Sem fonte de dados externa">
                          <Minus size={11} />
                          Sem fonte
                        </span>
                      );
                    }
                    const f = p.fontes[0];
                    if (f.statusSync === "ok") {
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium" title={`Sincronizado: ${f.fonte} ${f.tribunal || ''}`}>
                          <Database size={11} />
                          {f.fonte === 'datajud_public' ? 'DataJud' : f.fonte} OK
                        </span>
                      );
                    }
                    if (f.statusSync === "failed" || f.statusSync === "auth_error") {
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium" title={`Falha sync: ${f.statusSync}`}>
                          <XCircle size={11} />
                          Falha sync
                        </span>
                      );
                    }
                    if (f.statusSync === "stale") {
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium" title="Dados desatualizados">
                          <AlertTriangle size={11} />
                          Desatualizado
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Database size={11} />
                        {f.statusSync}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  {p.responsavel ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                        style={{ background: p.responsavel.cor || "#1e3a5f" }}
                      >
                        {p.responsavel.nome.charAt(0)}
                      </div>
                      <span className="text-xs">{p.responsavel.nome}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Processo } from "@/lib/types";
import { RiscoBadge, StatusProcessoBadge, SyncBadge, AreaBadge } from "./status-badges";

interface ProcessosTableProps {
  processos: Processo[];
  onEdit?: (p: Processo) => void;
  onDelete?: (id: string) => void;
  onSync?: (cnj: string) => Promise<void>;
}

export function ProcessosTable({ processos, onEdit, onDelete, onSync }: ProcessosTableProps) {
  const [syncingCnjs, setSyncingCnjs] = useState<Set<string>>(new Set());

  const handleSync = async (cnj: string) => {
    if (!onSync) return;
    setSyncingCnjs((prev) => new Set(prev).add(cnj));
    try {
      await onSync(cnj);
    } finally {
      setSyncingCnjs((prev) => {
        const next = new Set(prev);
        next.delete(cnj);
        return next;
      });
    }
  };

  if (processos.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Nenhum processo encontrado com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Processo</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Área</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Risco</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sync</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resp.</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
          <tbody>
            {processos.map((p) => {
              const isSyncing = syncingCnjs.has(p.cnj);
              const fonte = p.fontes?.[0];

              return (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  {/* Processo */}
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/processos-v2/${p.id}`}
                      className="font-mono text-xs text-[#1e3a5f] hover:underline block"
                    >
                      {p.cnj}
                    </Link>
                    {p.classe && (
                      <span className="text-[11px] text-muted-foreground/70 block mt-0.5">
                        {p.classe}
                      </span>
                    )}
                  </td>

                  {/* Cliente */}
                  <td className="px-5 py-3.5 text-foreground font-medium">
                    {p.cliente?.nome || "—"}
                  </td>

                  {/* Área */}
                  <td className="px-5 py-3.5">
                    <AreaBadge area={p.area} />
                  </td>

                  {/* Risco */}
                  <td className="px-5 py-3.5">
                    <RiscoBadge risco={p.risco} />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusProcessoBadge status={p.status} />
                  </td>

                  {/* Sync */}
                  <td className="px-5 py-3.5">
                    <SyncBadge statusSync={fonte?.statusSync} ultimaSync={fonte?.ultimaSync} />
                  </td>

                  {/* Responsável */}
                  <td className="px-5 py-3.5">
                    {p.responsavel ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                          style={{ background: p.responsavel.cor || "#1e3a5f" }}
                        >
                          {p.responsavel.nome.charAt(0)}
                        </div>
                        <span className="text-xs text-muted-foreground">{p.responsavel.nome}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link href={`/processos-v2/${p.id}`} className="cursor-pointer">
                            Ver detalhes
                          </Link>
                        </DropdownMenuItem>
                        {onSync && (
                          <DropdownMenuItem
                            onClick={() => handleSync(p.cnj)}
                            disabled={isSyncing}
                            className="cursor-pointer"
                          >
                            {isSyncing ? (
                              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5 mr-2" />
                            )}
                            Sincronizar
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(p)} className="cursor-pointer">
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(p.id)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

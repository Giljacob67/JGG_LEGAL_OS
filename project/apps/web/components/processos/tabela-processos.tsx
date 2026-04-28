"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessoRow {
  id: string;
  cnj: string;
  tipo: string;
  status: string;
  risco: string;
  area: string;
  valorCausa: any;
  valorProvavel?: any;
  adverso?: string | null;
  adversoAdv?: string | null;
  tribunal?: string | null;
  vara?: string | null;
  comarca?: string | null;
  classe?: string | null;
  assunto?: string | null;
  tese?: string | null;
  estrategia?: string | null;
  proximosPassos?: string | null;
  observacoes?: string | null;
  distribuicao?: string | null;
  clienteId?: string;
  responsavelId?: string;
  tagMataMata?: boolean;
  createdAt?: string;
  proximoPrazo?: Date | null;
  cliente?: { id: string; nome: string } | null;
  responsavel?: { id: string; nome: string; avatar?: string | null; cor?: string | null } | null;
  _count?: { prazos: number; documentos: number; andamentos: number };
}

export function TabelaProcessos({
  processos,
  onEdit,
  onDelete,
}: {
  processos: ProcessoRow[];
  onEdit?: (p: any) => void;
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

  const statusMap: Record<string, string> = {
    em_andamento: "Em andamento",
    suspenso: "Suspenso",
    arquivado: "Arquivado",
    encerrado: "Encerrado",
  };

  const riscoClasses: Record<string, string> = {
    alto: "bg-destructive/10 text-destructive border-transparent",
    medio: "bg-amber-50 text-amber-700 border-transparent",
    baixo: "bg-emerald-50 text-emerald-700 border-transparent",
  };

  const areaClasses: Record<string, string> = {
    bancario: "bg-accent/10 text-accent border-transparent",
    agrario: "bg-blue-50 text-blue-700 border-transparent",
    tributario: "bg-amber-50 text-amber-700 border-transparent",
    trabalhista: "bg-rose-50 text-rose-700 border-transparent",
    civil: "bg-violet-50 text-violet-700 border-transparent",
    empresarial: "bg-cyan-50 text-cyan-700 border-transparent",
    penal: "bg-slate-50 text-slate-700 border-transparent",
  };

  const areaLabels: Record<string, string> = {
    bancario: "Bancário",
    agrario: "Agrário",
    tributario: "Tributário",
    trabalhista: "Trabalhista",
    civil: "Civil",
    empresarial: "Empresarial",
    penal: "Penal",
  };

  const formatCurrency = (v: any) => {
    if (!v) return "—";
    const num = typeof v === "string" ? parseFloat(v) : Number(v);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${areaClasses[p.area] || "bg-muted text-muted-foreground"}`}>
                    {areaLabels[p.area] || p.area}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular font-medium">
                  {formatCurrency(p.valorCausa)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${riscoClasses[p.risco] || "bg-muted text-muted-foreground"}`}>
                    {p.risco}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{statusMap[p.status] || p.status}</td>
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

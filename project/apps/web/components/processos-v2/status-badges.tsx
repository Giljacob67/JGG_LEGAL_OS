"use client";

import { cn } from "@/lib/utils";

// ============================================================
// BADGES DISCRETOS PARA PROCESSOS V2
// Paleta JGG: navy estrutura, bordô ação, dourado atenção
// ============================================================

export function RiscoBadge({ risco }: { risco: string }) {
  const map: Record<string, { label: string; className: string }> = {
    alto:   { label: "Alto",   className: "bg-rose-50 text-rose-700 border-rose-100" },
    medio:  { label: "Médio",  className: "bg-amber-50 text-amber-700 border-amber-100" },
    baixo:  { label: "Baixo",  className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  };
  const cfg = map[risco] || { label: risco, className: "bg-muted text-muted-foreground border-transparent" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function StatusProcessoBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    em_andamento: { label: "Em andamento", className: "bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/20" },
    suspenso:     { label: "Suspenso",     className: "bg-[#c9a227]/10 text-[#8a6d0b] border-[#c9a227]/20" },
    arquivado:    { label: "Arquivado",    className: "bg-slate-100 text-slate-600 border-slate-200" },
    encerrado:    { label: "Encerrado",    className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  };
  const cfg = map[status] || { label: status, className: "bg-muted text-muted-foreground border-transparent" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function SyncBadge({
  statusSync,
  ultimaSync,
}: {
  statusSync?: string;
  ultimaSync?: string | null;
}) {
  if (!statusSync || statusSync === "not_configured") {
    return (
      <span className="inline-flex items-center text-[11px] text-muted-foreground/60">
        Sem fonte
      </span>
    );
  }

  const map: Record<string, { label: string; dot: string }> = {
    ok:      { label: "OK",       dot: "bg-emerald-500" },
    failed:  { label: "Falha",    dot: "bg-rose-500" },
    auth_error: { label: "Auth",  dot: "bg-rose-500" },
    stale:   { label: "Atrasado", dot: "bg-[#c9a227]" },
    disabled:{ label: "Desativado", dot: "bg-slate-400" },
  };
  const cfg = map[statusSync] || { label: statusSync, dot: "bg-slate-400" };

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      <span className="text-muted-foreground">{cfg.label}</span>
      {ultimaSync && (
        <span className="text-muted-foreground/50">
          {new Date(ultimaSync).toLocaleDateString("pt-BR")}
        </span>
      )}
    </span>
  );
}

export function AreaBadge({ area }: { area: string }) {
  const map: Record<string, string> = {
    bancario:    "Bancário",
    agrario:     "Agrário",
    tributario:  "Tributário",
    trabalhista: "Trabalhista",
    civil:       "Civil",
    empresarial: "Empresarial",
    penal:       "Penal",
  };
  return (
    <span className="text-[11px] text-muted-foreground">
      {map[area] || area}
    </span>
  );
}

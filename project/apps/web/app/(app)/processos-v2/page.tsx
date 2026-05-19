"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Upload,
  Activity,
  AlertTriangle,
  Database,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCheck,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessosTable } from "@/components/processos-v2/processos-table";
import { EmptyStateProcessos } from "@/components/processos-v2/empty-state";
import { SectionCard } from "@/components/processos-v2/section-card";
import { ProcessMonitorStatusBadge } from "@/components/processos-v2/process-monitor-status";
import type { Processo } from "@/lib/types";
import { useSseAndamentosContext } from "@/components/providers/sse-andamentos-provider";

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AREA_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "bancario", label: "Bancário" },
  { value: "agrario", label: "Agrário" },
  { value: "tributario", label: "Tributário" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "civil", label: "Civil" },
  { value: "empresarial", label: "Empresarial" },
  { value: "penal", label: "Penal" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "suspenso", label: "Suspenso" },
  { value: "arquivado", label: "Arquivado" },
  { value: "encerrado", label: "Encerrado" },
];

const RISCO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "alto", label: "Alto" },
  { value: "medio", label: "Médio" },
  { value: "baixo", label: "Baixo" },
];

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: "navy" | "gold" | "rose" | "slate";
}) {
  const toneMap = {
    navy:  "bg-[#1e3a5f]/5 text-[#1e3a5f]",
    gold:  "bg-[#c9a227]/5 text-[#8a6d0b]",
    rose:  "bg-rose-50 text-rose-700",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", toneMap[tone])}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-lg font-semibold text-foreground leading-none">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ProcessosV2Page() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [riscoFilter, setRiscoFilter] = useState("");
  const { connected: sseConnected, count: movCount, criticoCount, markAllAsRead } = useSseAndamentosContext();

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(meta.page));
      params.set("limit", String(meta.limit));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (areaFilter) params.set("area", areaFilter);
      if (riscoFilter) params.set("risco", riscoFilter);

      const res = await fetch(`/api/v1/processes?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProcessos(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, statusFilter, areaFilter, riscoFilter]);

  useEffect(() => {
    fetchProcessos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // KPIs calculados a partir dos dados carregados
  const ativos = processos.filter((p) => p.status === "em_andamento").length;
  const altoRisco = processos.filter((p) => p.risco === "alto").length;
  const semFonte = processos.filter((p) => !p.fontes || p.fontes.length === 0).length;
  const prazosProximos = processos.filter((p) => {
    if (!p.proximoPrazo) return false;
    const dias = Math.ceil((new Date(p.proximoPrazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias <= 7 && dias >= 0;
  }).length;

  const handleSync = async (cnj: string) => {
    try {
      const res = await fetch("/api/v1/monitoring/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnj, prioridade: "alta" }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchProcessos();
      } else {
        console.error(data.error || "Erro ao sincronizar");
      }
    } catch {
      console.error("Erro de rede ao sincronizar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este processo?")) return;
    try {
      const res = await fetch(`/api/v1/processes/${id}`, { method: "DELETE" });
      if (res.ok) fetchProcessos();
    } catch {
      console.error("Erro ao remover");
    }
  };

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">Processos</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Carteira processual, riscos, prazos e movimentações
          </p>
          <div className="mt-2">
            <ProcessMonitorStatusBadge />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/processos-v2/importacoes">
            <Button variant="outline" className="text-muted-foreground">
              <Upload className="w-4 h-4 mr-1.5" />
              Importar
            </Button>
          </Link>
          <Link href="/processos-v2/monitoramento">
            <Button variant="outline" className="text-muted-foreground">
              <Activity className="w-4 h-4 mr-1.5" />
              Monitoramento
            </Button>
          </Link>
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent("processo-v2:novo"))}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo processo
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Ativos" value={ativos} icon={Activity} tone="navy" />
        <KpiCard label="Prazos ≤ 7 dias" value={prazosProximos} icon={Clock} tone="gold" />
        <KpiCard label="Alto risco" value={altoRisco} icon={AlertTriangle} tone="rose" />
        <KpiCard label="Sem fonte" value={semFonte} icon={Database} tone="slate" />
        <SectionCard className="flex items-center gap-3 relative overflow-hidden">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${sseConnected ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
            {sseConnected ? <Radio className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-foreground leading-none">{movCount}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {sseConnected ? "Novos andamentos" : "SSE offline"}
            </div>
          </div>
          {criticoCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {criticoCount}
            </span>
          )}
        </SectionCard>
        <SectionCard className="flex items-center justify-center">
          {movCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Limpar notificações
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Nenhuma notificação</span>
          )}
        </SectionCard>
      </div>

      {/* Filtros */}
      <SectionCard padded={false}>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por CNJ, parte contrária ou cliente..."
              aria-label="Buscar processo"
              className="w-full pl-9 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProcessos()}
            />
          </div>

          <select
            className="px-3 py-2 rounded-md border bg-background text-sm"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            {AREA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 rounded-md border bg-background text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 rounded-md border bg-background text-sm"
            value={riscoFilter}
            onChange={(e) => setRiscoFilter(e.target.value)}
          >
            {RISCO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <Button variant="outline" onClick={fetchProcessos}>
            <Filter className="w-4 h-4 mr-1.5" />
            Filtrar
          </Button>
        </div>
      </SectionCard>

      {/* Tabela */}
      {loading ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          Carregando processos...
        </div>
      ) : processos.length === 0 ? (
        <EmptyStateProcessos />
      ) : (
        <ProcessosTable
          processos={processos}
          onSync={handleSync}
          onDelete={handleDelete}
        />
      )}

      {/* Paginação */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border rounded-lg bg-card">
          <div className="text-xs text-muted-foreground">
            Página {meta.page} de {meta.totalPages} · {meta.total} total
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page <= 1}
              onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

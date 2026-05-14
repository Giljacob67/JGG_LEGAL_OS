"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Database,
  Search,
  Filter,
  RefreshCw,
  Upload,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { extractCNJsFromText, formatCNJ } from "@/lib/process-import/cnj-utils";
import { ImportCandidateReview } from "@/components/processos/import-candidate-review";

// ============================================================
// TYPES
// ============================================================

interface ImportStats {
  total: number;
  encontrados: number;
  duplicados: number;
  falhas: number;
  status: string;
}

interface Candidate {
  id: string;
  cnj: string;
  fonte: string;
  tribunal?: string;
  status: string;
  scoreConfianca?: number;
  dadosNormalizados?: any;
  dadosRaw?: any;
  conflitoComId?: string;
  processoId?: string;
  motivoRejeicao?: string;
  createdAt: string;
  job?: { id: string; tipo: string; fonte?: string };
}

interface Job {
  id: string;
  tipo: string;
  fonte?: string;
  status: string;
  total: number;
  processados: number;
  encontrados: number;
  duplicados: number;
  conflitos: number;
  falhas: number;
  createdAt: string;
  iniciadoPor?: { id: string; nome: string };
  _count?: { candidates: number };
}

// ============================================================
// STATUS BADGES
// ============================================================

const candidateStatusConfig: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-emerald-100 text-emerald-700" },
  duplicado: { label: "Duplicado", className: "bg-amber-100 text-amber-700" },
  conflito: { label: "Conflito", className: "bg-orange-100 text-orange-700" },
  aprovado: { label: "Aprovado", className: "bg-blue-100 text-blue-700" },
  rejeitado: { label: "Rejeitado", className: "bg-gray-100 text-gray-600" },
  erro: { label: "Erro", className: "bg-red-100 text-red-700" },
};

const jobStatusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  queued: { label: "Na fila", icon: Clock, className: "text-muted-foreground" },
  running: { label: "Executando", icon: Loader2, className: "text-blue-600" },
  done: { label: "Concluído", icon: CheckCircle, className: "text-emerald-600" },
  partial: { label: "Parcial", icon: AlertCircle, className: "text-amber-600" },
  failed: { label: "Falhou", icon: XCircle, className: "text-destructive" },
  cancelled: { label: "Cancelado", icon: XCircle, className: "text-muted-foreground" },
  // Legacy statuses from Phase 1
  pendente: { label: "Pendente", icon: Clock, className: "text-muted-foreground" },
  em_progresso: { label: "Executando", icon: Loader2, className: "text-blue-600" },
  concluido: { label: "Concluído", icon: CheckCircle, className: "text-emerald-600" },
  falha: { label: "Falhou", icon: XCircle, className: "text-destructive" },
};

// ============================================================
// BATCH IMPORT FORM
// ============================================================

function BatchImportForm({ onJobCreated }: { onJobCreated: () => void }) {
  const [text, setText] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [stats, setStats] = useState<ImportStats | null>(null);

  const cnjs = extractCNJsFromText(text);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cnjs.length === 0) {
      setError("Nenhum CNJ válido (20 dígitos) encontrado no texto.");
      return;
    }
    if (cnjs.length > 100) {
      setError(`Encontrados ${cnjs.length} CNJs. O limite é 100 por lote. Divida a lista.`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setStats(null);

    try {
      const res = await fetch("/api/v1/process-import/jobs/batch-cnj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnjs,
          fonte: "datajud_public",
          tribunal: tribunal || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar importação em lote");
      } else {
        setSuccessMsg(`Lote processado! ${data.stats?.processados || cnjs.length} CNJs analisados.`);
        setStats(data.stats);
        setText("");
        setTribunal("");
        onJobCreated();
      }
    } catch {
      setError("Erro de rede ao enviar lote.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold">Nova importação em lote</h2>
          <p className="text-xs text-muted-foreground">
            Cole uma lista de CNJs (com ou sem formatação, separados por linha ou vírgula) para buscar
            no DataJud.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="w-full min-h-[120px] p-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono resize-y"
          placeholder={"Ex:\n0000000-00.0000.0.00.0000\n1111111-11.1111.1.11.1111\n\nOu cole 20 dígitos direto, separados por vírgula ou linha."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1 text-muted-foreground">
              Tribunal / Alias DataJud (opcional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: tjpr, trf4, stj"
              value={tribunal}
              onChange={(e) => setTribunal(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-sm">
            {text.length > 0 && (
              <span
                className={
                  cnjs.length > 0 && cnjs.length <= 100
                    ? "text-emerald-600 font-medium"
                    : "text-amber-600 font-medium"
                }
              >
                {cnjs.length} CNJ(s) único(s) detectado(s)
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || cnjs.length === 0 || cnjs.length > 100}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Criar Importação
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-md">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-md border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              {successMsg}
            </div>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mt-2">
                <div className="rounded bg-white/60 px-2 py-1.5 border">
                  <span className="text-muted-foreground">Total:</span>{" "}
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="rounded bg-white/60 px-2 py-1.5 border">
                  <span className="text-muted-foreground">Encontrados:</span>{" "}
                  <span className="font-semibold text-emerald-700">{stats.encontrados}</span>
                </div>
                <div className="rounded bg-white/60 px-2 py-1.5 border">
                  <span className="text-muted-foreground">Duplicados:</span>{" "}
                  <span className="font-semibold text-amber-700">{stats.duplicados}</span>
                </div>
                <div className="rounded bg-white/60 px-2 py-1.5 border">
                  <span className="text-muted-foreground">Falhas:</span>{" "}
                  <span className="font-semibold text-red-700">{stats.falhas}</span>
                </div>
                <div className="rounded bg-white/60 px-2 py-1.5 border">
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-semibold">{stats.status}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ImportacoesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewCandidate, setReviewCandidate] = useState<Candidate | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFonte, setFilterFonte] = useState("");
  const [filterJobId, setFilterJobId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterFonte) params.set("fonte", filterFonte);
      if (filterJobId) params.set("jobId", filterJobId);
      params.set("limit", "100");

      const [cRes, jRes] = await Promise.all([
        fetch(`/api/v1/process-import/candidates?${params.toString()}`),
        fetch("/api/v1/process-import/jobs"),
      ]);

      const cData = await cRes.json();
      const jData = await jRes.json();

      setCandidates(Array.isArray(cData) ? cData : []);
      setJobs(Array.isArray(jData) ? jData : []);
    } catch {
      // Silent fail, data stays empty
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterFonte, filterJobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalJobs = jobs.length;
  const novos = candidates.filter((c) => c.status === "novo").length;
  const duplicados = candidates.filter((c) => c.status === "duplicado").length;
  const aprovados = candidates.filter((c) => c.status === "aprovado").length;
  const errosConflitos = candidates.filter((c) =>
    ["erro", "conflito"].includes(c.status)
  ).length;

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/processos")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-[22px] font-semibold mb-0.5">Importações e Conectores</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie a fila de importação de processos (DataJud e outros)
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Jobs</div>
          <div className="text-2xl font-bold">{loading ? "..." : totalJobs}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Novos</div>
          <div className="text-2xl font-bold text-emerald-600">{loading ? "..." : novos}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
            Duplicados
          </div>
          <div className="text-2xl font-bold text-amber-600">{loading ? "..." : duplicados}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
            Aprovados
          </div>
          <div className="text-2xl font-bold text-blue-600">{loading ? "..." : aprovados}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
            Erros
          </div>
          <div className="text-2xl font-bold text-destructive">{loading ? "..." : errosConflitos}</div>
        </div>
      </div>

      {/* Batch Import Form */}
      <BatchImportForm onJobCreated={fetchData} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="duplicado">Duplicado</option>
          <option value="conflito">Conflito</option>
          <option value="aprovado">Aprovado</option>
          <option value="rejeitado">Rejeitado</option>
          <option value="erro">Erro</option>
        </select>
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={filterFonte}
          onChange={(e) => setFilterFonte(e.target.value)}
        >
          <option value="">Todas as fontes</option>
          <option value="datajud_public">DataJud</option>
        </select>
        {jobs.length > 0 && (
          <select
            className="px-3 py-2 rounded-md border bg-background text-sm"
            value={filterJobId}
            onChange={(e) => setFilterJobId(e.target.value)}
          >
            <option value="">Todos os jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.tipo} — {new Date(j.createdAt).toLocaleDateString("pt-BR")} ({j.total} CNJs)
              </option>
            ))}
          </select>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
        >
          <Search className="w-4 h-4 mr-1" />
          Filtrar
        </Button>
        {(filterStatus || filterFonte || filterJobId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus("");
              setFilterFonte("");
              setFilterJobId("");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Table - 2 cols */}
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/40 font-medium text-sm flex items-center justify-between">
            <span>Candidatos de Importação</span>
            <span className="text-xs font-normal text-muted-foreground">
              {candidates.length} encontrados
            </span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum candidato encontrado
                {(filterStatus || filterFonte || filterJobId) && " para os filtros selecionados"}.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      CNJ
                    </th>
                    <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Fonte
                    </th>
                    <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Tribunal
                    </th>
                    <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Confiança
                    </th>
                    <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Data
                    </th>
                    <th className="text-right px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const cfg = candidateStatusConfig[c.status] || {
                      label: c.status,
                      className: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs">{formatCNJ(c.cnj)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded bg-[var(--jgg-gold-soft,#fef3c7)] text-[var(--jgg-gold-700,#92400e)]">
                            {c.fonte}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {c.tribunal?.toUpperCase() || "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {c.scoreConfianca != null
                            ? `${(c.scoreConfianca * 100).toFixed(0)}%`
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setReviewCandidate(c)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Revisar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Jobs panel - 1 col */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/40 font-medium text-sm flex items-center justify-between">
            <span>Jobs de Importação</span>
            <span className="text-xs font-normal text-muted-foreground">{jobs.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum job ainda.
              </div>
            ) : (
              <div className="divide-y">
                {jobs.map((j) => {
                  const cfg = jobStatusConfig[j.status] || {
                    label: j.status,
                    icon: Clock,
                    className: "text-muted-foreground",
                  };
                  const StatusIcon = cfg.icon;
                  const isAnimated = j.status === "running" || j.status === "em_progresso";

                  return (
                    <div
                      key={j.id}
                      className="p-3.5 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setFilterJobId(j.id === filterJobId ? "" : j.id)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold">{j.tipo}</span>
                        <span className={`flex items-center gap-1 text-xs ${cfg.className}`}>
                          <StatusIcon
                            size={12}
                            className={isAnimated ? "animate-spin" : ""}
                          />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-1.5">
                        {j.fonte || "—"} · {new Date(j.createdAt).toLocaleDateString("pt-BR")}
                        {j.iniciadoPor && ` · ${j.iniciadoPor.nome}`}
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: j.total > 0 ? `${(j.processados / j.total) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <div className="flex gap-3 text-[11px] text-muted-foreground">
                        <span>{j.processados}/{j.total}</span>
                        <span className="text-emerald-600">✓ {j.encontrados}</span>
                        <span className="text-amber-600">⚠ {j.duplicados}</span>
                        {j.falhas > 0 && <span className="text-destructive">✗ {j.falhas}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewCandidate && (
        <ImportCandidateReview
          candidate={reviewCandidate}
          onClose={() => setReviewCandidate(null)}
          onUpdated={() => {
            setReviewCandidate(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

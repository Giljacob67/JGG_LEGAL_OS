"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TribunalHealth {
  status: string;
  tribunais: Record<string, boolean>;
}

interface TribunalMetrica {
  tribunal_id: string;
  total_ok: number;
  total_falha: number;
  total_captcha: number;
  total_indisponivel: number;
  avg_duracao_ms: number | null;
  ultimo_run: string | null;
}

interface Metrics {
  periodo: string;
  tribunais: TribunalMetrica[];
}

interface SyncResult {
  tribunal_id: string;
  sucesso: boolean;
  andamentos_novos: number;
  captcha: boolean;
  erro: string | null;
  duracao_ms: number;
}

const TRIBUNAIS_LABELS: Record<string, string> = {
  tjpr: "TJPR",
  tjmt: "TJMT",
  trf4: "TRF4",
  trf1: "TRF1",
};

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
      <CheckCircle size={11} /> Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <XCircle size={11} /> Indisponível
    </span>
  );
}

function formatDuracao(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatUltimoRun(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function MonitoramentoPage() {
  const [health, setHealth] = useState<TribunalHealth | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncCnj, setSyncCnj] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch("/api/v1/monitoring/health"),
        fetch("/api/v1/monitoring/status"),
      ]);
      if (healthRes.ok) setHealth(await healthRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSync() {
    if (!syncCnj.trim()) return;
    setSyncing(true);
    setSyncResults(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/v1/monitoring/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnj: syncCnj.trim() }),
      });
      const data = await res.json();
      if (!res.ok) setSyncError(data.message ?? "Erro ao sincronizar");
      else setSyncResults(data.resultados ?? []);
    } catch {
      setSyncError("Erro de conexão com o serviço de monitoramento");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={22} className="text-[var(--jgg-bordo-700)]" />
          <div>
            <h1 className="text-xl font-serif font-semibold text-foreground">Monitoramento Processual</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Captura automática de andamentos via TJPR, TJMT, TRF4 e TRF1
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      {/* Tribunal Health Cards */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Status dos Tribunais
        </h2>
        {health ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(TRIBUNAIS_LABELS).map(([id, label]) => {
              const ok = health.tribunais?.[id] ?? false;
              return (
                <div
                  key={id}
                  className="rounded-lg border bg-card p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{label}</span>
                    <StatusBadge ok={ok} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {id.startsWith("tjpr") || id.startsWith("tjmt") || id.startsWith("trf1")
                      ? "PJe"
                      : "eProc"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-24 rounded-lg border bg-muted/30 flex items-center justify-center">
            <AlertCircle size={16} className="text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {loading ? "Carregando..." : "Serviço de monitoramento indisponível"}
            </span>
          </div>
        )}
      </div>

      {/* Métricas 24h */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Métricas — últimas 24h
        </h2>
        {metrics && metrics.tribunais.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  {["Tribunal", "OK", "Falha", "Captcha", "Duração avg", "Último run"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.tribunais.map((t) => (
                  <tr key={t.tribunal_id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-xs uppercase">
                      {TRIBUNAIS_LABELS[t.tribunal_id] ?? t.tribunal_id}
                    </td>
                    <td className="px-4 py-3 text-green-600">{t.total_ok ?? 0}</td>
                    <td className="px-4 py-3 text-red-600">{t.total_falha ?? 0}</td>
                    <td className="px-4 py-3 text-amber-600">{t.total_captcha ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDuracao(t.avg_duracao_ms)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                      <Clock size={11} />
                      {formatUltimoRun(t.ultimo_run)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {loading ? "Carregando métricas..." : "Nenhuma execução nas últimas 24h"}
          </div>
        )}
      </div>

      {/* Sync Manual */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Sincronização Manual
        </h2>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={syncCnj}
              onChange={(e) => setSyncCnj(e.target.value)}
              placeholder="CNJ — ex: 0000001-02.2023.8.16.0001"
              className="flex-1 h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              onClick={handleSync}
              disabled={syncing || !syncCnj.trim()}
              size="sm"
              className="gap-1.5"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </div>

          {syncError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <XCircle size={12} /> {syncError}
            </p>
          )}

          {syncResults && syncResults.length > 0 && (
            <div className="space-y-2">
              {syncResults.map((r) => (
                <div
                  key={r.tribunal_id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                    r.sucesso
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <span className="font-semibold">{TRIBUNAIS_LABELS[r.tribunal_id] ?? r.tribunal_id}</span>
                  <span>
                    {r.sucesso
                      ? `${r.andamentos_novos} andamentos novos · ${formatDuracao(r.duracao_ms)}`
                      : r.captcha
                      ? "Captcha detectado"
                      : r.erro ?? "Falha"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {syncResults && syncResults.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum resultado retornado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

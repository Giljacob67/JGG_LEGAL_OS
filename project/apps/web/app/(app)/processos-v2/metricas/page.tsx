"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle2, XCircle, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { SectionCard } from "@/components/processos-v2/section-card";

interface MetricsData {
  processes: { total: number; active: number; status_breakdown: Record<string, number> };
  captures_24h: { total: number; success: number; failed: number; success_rate: number; avg_duration_ms: number };
  movements_24h: number;
  top_tribunals: Array<{ tribunal: string; captures: number }>;
  generated_at: string;
}

export default function MetricasPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/internal/process-monitor/metrics", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setMetrics(data.data);
        } else {
          setError(data.error || "Erro ao carregar métricas");
        }
      } catch {
        setError("Serviço indisponível");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <Link href="/processos-v2/monitoramento" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
        <h1 className="text-[22px] font-semibold text-foreground">Métricas de Monitoramento</h1>
        <p className="text-xs text-muted-foreground mt-1">Estatísticas de sync, conectores e andamentos</p>
      </div>

      {loading && (
        <div className="text-center text-muted-foreground py-12">
          <Activity className="w-5 h-5 animate-spin mx-auto mb-2" />
          Carregando métricas...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SectionCard className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{metrics.processes.total}</div>
                <div className="text-[11px] text-muted-foreground">Processos monitorados</div>
              </div>
            </SectionCard>

            <SectionCard className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{metrics.captures_24h.success}</div>
                <div className="text-[11px] text-muted-foreground">Capturas OK (24h)</div>
              </div>
            </SectionCard>

            <SectionCard className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{metrics.captures_24h.failed}</div>
                <div className="text-[11px] text-muted-foreground">Capturas falhas (24h)</div>
              </div>
            </SectionCard>

            <SectionCard className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{metrics.movements_24h}</div>
                <div className="text-[11px] text-muted-foreground">Novos andamentos (24h)</div>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SectionCard title="Taxa de sucesso (24h)">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-muted/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path
                      className={metrics.captures_24h.success_rate >= 90 ? "text-emerald-500" : metrics.captures_24h.success_rate >= 70 ? "text-amber-500" : "text-red-500"}
                      strokeDasharray={`${metrics.captures_24h.success_rate}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {metrics.captures_24h.success_rate}%
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Sucesso: {metrics.captures_24h.success}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Falha: {metrics.captures_24h.failed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Média: {metrics.captures_24h.avg_duration_ms}ms</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Top tribunais (24h)">
              {metrics.top_tribunals.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhuma captura nas últimas 24h</p>
              ) : (
                <div className="space-y-2">
                  {metrics.top_tribunals.map((t) => (
                    <div key={t.tribunal} className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase w-16">{t.tribunal}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-[#1e3a5f] rounded-full"
                          style={{ width: `${Math.min((t.captures / Math.max(metrics.captures_24h.total, 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{t.captures}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Distribuição de status dos processos">
            <div className="flex flex-wrap gap-2">
              {Object.entries(metrics.processes.status_breakdown).map(([status, count]) => (
                <div key={status} className="px-3 py-1.5 rounded-md border text-sm">
                  <span className="text-muted-foreground capitalize">{status.replace(/_/g, " ")}:</span>{" "}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="text-[11px] text-muted-foreground text-right">
            Atualizado em: {new Date(metrics.generated_at).toLocaleString("pt-BR")}
          </div>
        </>
      )}
    </div>
  );
}

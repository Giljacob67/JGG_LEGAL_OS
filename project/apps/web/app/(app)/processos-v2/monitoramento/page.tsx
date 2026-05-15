"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle2, XCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/processos-v2/section-card";
import { ProcessMonitorConnectors } from "@/components/processos-v2/process-monitor-connectors";

export default function MonitoramentoV2Page() {
  const [health, setHealth] = useState<{ ok: boolean; status?: string; service?: string } | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [cnj, setCnj] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string; jobId?: string } | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/internal/process-monitor/health", { cache: "no-store" });
        const data = await res.json();
        setHealth(data.ok ? data.data : { ok: false, status: data.code });
      } catch {
        setHealth({ ok: false, status: "offline" });
      } finally {
        setHealthLoading(false);
      }
    }
    fetchHealth();
  }, []);

  const handleRegister = async () => {
    if (!cnj.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch("/api/internal/process-monitor/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_cnj: cnj, tribunal: tribunal || undefined, prioridade: "normal" }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitResult({ ok: true, message: "Processo cadastrado para monitoramento", jobId: data.data?.job_id });
      } else {
        setSubmitResult({ ok: false, message: data.error || "Erro ao cadastrar" });
      }
    } catch {
      setSubmitResult({ ok: false, message: "Erro de rede" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (!cnj.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch(`/api/internal/process-monitor/processes/${encodeURIComponent(cnj)}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true, capturar_documentos: false }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitResult({ ok: true, message: "Sincronização solicitada", jobId: data.data?.job_id });
      } else {
        setSubmitResult({ ok: false, message: data.error || "Erro ao sincronizar" });
      }
    } catch {
      setSubmitResult({ ok: false, message: "Erro de rede" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/processos-v2"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
        <h1 className="text-[22px] font-semibold text-foreground">Monitoramento Processual</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Saúde dos conectores, jobs e sincronizações
        </p>
      </div>

      {/* Status do serviço */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SectionCard className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            healthLoading ? "bg-slate-50 text-slate-400" :
            health?.ok ? "bg-emerald-50 text-emerald-700" :
            health?.status === "PROCESS_MONITOR_DISABLED" ? "bg-slate-50 text-slate-400" :
            "bg-red-50 text-red-700"
          }`}>
            {healthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
             health?.ok ? <CheckCircle2 className="w-4 h-4" /> :
             health?.status === "PROCESS_MONITOR_DISABLED" ? <AlertCircle className="w-4 h-4" /> :
             <XCircle className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-sm font-medium">
              {healthLoading ? "Verificando..." :
               health?.ok ? "Serviço online" :
               health?.status === "PROCESS_MONITOR_DISABLED" ? "Desativado" :
               "Serviço offline"}
            </div>
            <div className="text-[11px] text-muted-foreground">process-monitor</div>
          </div>
        </SectionCard>

        <SectionCard className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1e3a5f]/5 text-[#1e3a5f] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">DataJud + 4 stubs</div>
            <div className="text-[11px] text-muted-foreground">Conectores registrados</div>
          </div>
        </SectionCard>

        <SectionCard className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">Stubs ativos</div>
            <div className="text-[11px] text-muted-foreground">Conectores reais ainda não implementados</div>
          </div>
        </SectionCard>
      </div>

      {/* Aviso */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Atenção:</strong> Os conectores reais de tribunais (TJPR, TJMT, TRF4, TRF1) ainda não estão ativos.
        Esta etapa valida a infraestrutura de integração entre o app web e o serviço process-monitor.
      </div>

      {/* Formulário manual */}
      <SectionCard title="Teste manual de monitoramento">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">CNJ</label>
            <input
              type="text"
              placeholder="0000000-00.0000.0.00.0000"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={cnj}
              onChange={(e) => setCnj(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tribunal</label>
            <select
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={tribunal}
              onChange={(e) => setTribunal(e.target.value)}
            >
              <option value="">Auto-detectar</option>
              <option value="tjpr">TJPR</option>
              <option value="tjmt">TJMT</option>
              <option value="trf4">TRF4</option>
              <option value="trf1">TRF1</option>
            </select>
          </div>
          <Button variant="outline" onClick={handleRegister} disabled={submitting || !cnj.trim()}>
            <Send className="w-4 h-4 mr-1.5" />
            Cadastrar
          </Button>
          <Button onClick={handleSync} disabled={submitting || !cnj.trim()}>
            <Activity className="w-4 h-4 mr-1.5" />
            Sincronizar
          </Button>
        </div>

        {submitResult && (
          <div className={`mt-3 p-3 rounded-md text-sm ${submitResult.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {submitResult.message}
            {submitResult.jobId && (
              <span className="block text-xs mt-1 text-muted-foreground">Job ID: {submitResult.jobId}</span>
            )}
          </div>
        )}
      </SectionCard>

      {/* Tabela de conectores */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Conectores</h2>
        <ProcessMonitorConnectors />
      </div>
    </div>
  );
}

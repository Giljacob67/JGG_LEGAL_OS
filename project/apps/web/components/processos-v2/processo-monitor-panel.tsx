"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, Activity, CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

interface ProcessoMonitorPanelProps {
  processoId: string;
  cnj: string;
  tribunal?: string | null;
}

interface JobStatus {
  id: string;
  status: string;
  result?: { movements_synced?: number; documents_synced?: number };
}

export function ProcessoMonitorPanel({ processoId, cnj, tribunal }: ProcessoMonitorPanelProps) {
  const [serviceStatus, setServiceStatus] = useState<"online" | "offline" | "disabled" | "loading">("loading");
  const [syncing, setSyncing] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [movements, setMovements] = useState<Array<{ data?: string; descricao_original: string; tipo_evento?: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ nome: string; tipo?: string; data?: string }>>([]);
  const [captures, setCaptures] = useState<Array<{ id: string; tribunal: string; connector: string; status: string; started_at: string; finished_at?: string; duration_ms?: number }>>([]);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/internal/process-monitor/health", { cache: "no-store" });
        const data = await res.json();
        if (data.code === "PROCESS_MONITOR_DISABLED") setServiceStatus("disabled");
        else if (data.ok) setServiceStatus("online");
        else setServiceStatus("offline");
      } catch {
        setServiceStatus("offline");
      }
    }
    checkHealth();
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await fetch(`/api/internal/process-monitor/processes/${encodeURIComponent(cnj)}/movements`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setMovements(data.data);
      }
    } catch {
      // silencioso
    }
  }, [cnj]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/internal/process-monitor/processes/${encodeURIComponent(cnj)}/documents`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setDocuments(data.data);
      }
    } catch {
      // silencioso
    }
  }, [cnj]);

  const fetchCaptures = useCallback(async () => {
    try {
      const res = await fetch(`/api/internal/process-monitor/processes/${encodeURIComponent(cnj)}/captures`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setCaptures(data.data);
      }
    } catch {
      // silencioso
    }
  }, [cnj]);

  useEffect(() => {
    if (serviceStatus === "online") {
      fetchMovements();
      fetchCaptures();
    }
  }, [serviceStatus, fetchMovements, fetchCaptures]);

  const handleSync = async () => {
    if (serviceStatus !== "online") return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/internal/process-monitor/processes/${encodeURIComponent(cnj)}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true, capturar_documentos: false }),
      });
      const data = await res.json();
      if (data.ok && data.data?.job_id) {
        setJob({ id: data.data.job_id, status: "queued" });
        // polling leve por até 30s
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (attempts > 15) {
            clearInterval(interval);
            setJob((prev) => (prev ? { ...prev, status: "running" } : null));
            return;
          }
          try {
            const jr = await fetch(`/api/internal/process-monitor/jobs/${data.data.job_id}`);
            const jd = await jr.json();
            if (jd.ok && jd.data) {
              setJob({ id: data.data.job_id, status: jd.data.status, result: jd.data.result });
              if (["finished", "failed", "success"].includes(jd.data.status)) {
                clearInterval(interval);
                fetchMovements();
                fetchDocuments();
              }
            }
          } catch {
            // ignora erro de polling
          }
        }, 2000);
      }
    } catch {
      setJob(null);
    } finally {
      setSyncing(false);
    }
  };

  const serviceOffline = serviceStatus === "offline" || serviceStatus === "disabled";

  return (
    <div className="space-y-4">
      <SectionCard title="Monitoramento externo">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            {serviceStatus === "loading" && <span className="text-sm text-muted-foreground">Verificando serviço...</span>}
            {serviceStatus === "online" && (
              <span className="text-sm text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Serviço online
              </span>
            )}
            {serviceStatus === "offline" && (
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Serviço offline
              </span>
            )}
            {serviceStatus === "disabled" && (
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Monitoramento desativado
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={serviceOffline || syncing}
          >
            {syncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Sincronizar agora
          </Button>
        </div>

        {job && (
          <div className="mb-4 p-3 rounded-md bg-muted/50 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">Job:</span> {job.id.slice(0, 8)}...
              <span className="text-muted-foreground">· Status:</span>
              <span className={`font-medium ${job.status === "finished" || job.status === "success" ? "text-emerald-700" : job.status === "failed" ? "text-red-600" : "text-amber-700"}`}>
                {job.status}
              </span>
            </div>
            {job.result && (
              <div className="mt-1 text-xs text-muted-foreground">
                Andamentos sincronizados: {job.result.movements_synced ?? 0} · Documentos: {job.result.documents_synced ?? 0}
              </div>
            )}
          </div>
        )}

        {serviceStatus === "disabled" && (
          <p className="text-sm text-muted-foreground italic">
            O monitoramento processual está desativado. Contate o administrador para ativar.
          </p>
        )}

        {serviceStatus === "offline" && (
          <p className="text-sm text-muted-foreground italic">
            O serviço de monitoramento está indisponível no momento. Tente novamente mais tarde.
          </p>
        )}

        {captures.length > 0 && (
          <div className="mt-4">
            <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Últimas capturas</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {captures.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs p-2 rounded-md border">
                  <span className={`w-2 h-2 rounded-full ${c.status === "success" ? "bg-emerald-500" : c.status === "failed" ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className="font-mono text-[10px] text-muted-foreground">{c.id.slice(0, 8)}</span>
                  <span className="text-muted-foreground">{c.tribunal}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="capitalize">{c.status}</span>
                  {c.duration_ms && <span className="text-muted-foreground">({c.duration_ms}ms)</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {movements.length > 0 && (
        <SectionCard title={`Andamentos do tribunal (${movements.length})`}>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {movements.map((m, i) => (
              <div key={i} className="p-2 rounded-md border text-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  {m.data ? new Date(m.data).toLocaleDateString("pt-BR") : "Data não informada"}
                  {m.tipo_evento && <span className="px-1.5 py-0.5 rounded bg-muted">{m.tipo_evento}</span>}
                </div>
                <p className="text-foreground">{m.descricao_original}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {documents.length > 0 && (
        <SectionCard title={`Documentos do tribunal (${documents.length})`}>
          <div className="space-y-2">
            {documents.map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-md border text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">{d.nome}</span>
                {d.tipo && <span className="text-xs text-muted-foreground">{d.tipo}</span>}
                {d.data && <span className="text-xs text-muted-foreground">{new Date(d.data).toLocaleDateString("pt-BR")}</span>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

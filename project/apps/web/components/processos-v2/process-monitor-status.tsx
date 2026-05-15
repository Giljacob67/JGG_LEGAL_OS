"use client";

import { useState, useEffect } from "react";
import { Activity, CheckCircle2, XCircle, AlertCircle, PowerOff } from "lucide-react";

interface HealthState {
  status: "online" | "offline" | "disabled" | "error" | "loading";
  service?: string;
  message?: string;
}

export function ProcessMonitorStatusBadge() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const res = await fetch("/api/internal/process-monitor/health", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!data.ok && data.code === "PROCESS_MONITOR_DISABLED") {
          setHealth({ status: "disabled", message: "Desativado" });
        } else if (!data.ok) {
          setHealth({ status: "error", message: data.error || "Erro" });
        } else {
          setHealth({ status: "online", service: data.data?.service });
        }
      } catch {
        if (!cancelled) setHealth({ status: "offline", message: "Offline" });
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (health.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
        <Activity className="w-3 h-3 animate-pulse" />
        Monitoramento...
      </span>
    );
  }

  if (health.status === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
        <PowerOff className="w-3 h-3" />
        Monitoramento desativado
      </span>
    );
  }

  if (health.status === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500" title="Serviço de monitoramento indisponível">
        <XCircle className="w-3 h-3" />
        Monitoramento offline
      </span>
    );
  }

  if (health.status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700" title={health.message}>
        <AlertCircle className="w-3 h-3" />
        Monitoramento com erro
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" />
      Monitoramento online
    </span>
  );
}

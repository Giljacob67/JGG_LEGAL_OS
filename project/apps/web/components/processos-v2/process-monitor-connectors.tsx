"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";

interface ConnectorItem {
  id: string;
  tribunais: string[];
  supports: Record<string, boolean>;
  status?: string;
}

export function ProcessMonitorConnectors() {
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConnectors() {
      try {
        const res = await fetch("/api/internal/process-monitor/connectors", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setConnectors(data.data || []);
        } else {
          setError(data.error || "Erro ao carregar conectores");
        }
      } catch {
        setError("Serviço indisponível");
      } finally {
        setLoading(false);
      }
    }
    fetchConnectors();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Carregando conectores...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <XCircle className="w-5 h-5 mx-auto mb-2 text-slate-400" />
        {error}
      </div>
    );
  }

  if (connectors.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Nenhum conector disponível.
      </div>
    );
  }

  const labelMap: Record<string, string> = {
    datajud: "DataJud (API Pública CNJ)",
    tjpr: "TJPR (ProJUDI)",
    tjmt: "TJMT (PJe)",
    trf4: "TRF4 (e-Proc)",
    trf1: "TRF1 (PJe)",
  };

  const supportLabel = (key: string) => {
    const map: Record<string, string> = {
      login: "Login",
      buscar_processo: "CNJ",
      listar_andamentos: "Andamentos",
      listar_documentos: "Documentos",
      baixar_documento: "Download",
    };
    return map[key] || key;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Conector</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tribunal</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Funcionalidades</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {connectors.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{labelMap[c.id] || c.id}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.tribunais.join(", ")}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(c.supports).map(([key, val]) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                        val ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {val ? <CheckCircle2 className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
                      {supportLabel(key)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                    c.status === "healthy"
                      ? "text-emerald-600"
                      : c.status === "unknown"
                      ? "text-slate-400"
                      : "text-amber-600"
                  }`}
                >
                  {c.status === "healthy" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <MinusCircle className="w-3.5 h-3.5" />}
                  {c.status === "healthy" ? "Ativo" : c.status === "unknown" ? "Stub" : c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { History, User, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  diff: any;
  userEmail: string | null;
  createdAt: string;
}

interface ProcessoHistoricoProps {
  processoId: string;
}

export function ProcessoHistorico({ processoId }: ProcessoHistoricoProps) {
  const [historico, setHistorico] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadHistorico();
  }, [processoId]);

  async function loadHistorico() {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistorico(data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  }

  function getAcaoLabel(acao: string): string {
    const labels: Record<string, string> = {
      CREATED: "Criado",
      UPDATED: "Atualizado",
      DELETED: "Excluído",
      TEAM_MEMBER_ADDED: "Membro adicionado",
      TEAM_MEMBER_REMOVED: "Membro removido",
      DOCUMENT_CREATED: "Documento criado",
      DOCUMENT_DELETED: "Documento excluído",
    };
    return labels[acao] || acao;
  }

  function getAcaoColor(acao: string): string {
    if (acao.includes("CREATED") || acao.includes("ADDED")) return "text-green-600 bg-green-50";
    if (acao.includes("UPDATED")) return "text-blue-600 bg-blue-50";
    if (acao.includes("DELETED") || acao.includes("REMOVED")) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  }

  const displayHistorico = showAll ? historico : historico.slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum histórico disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Alterações
        </h3>
        {historico.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAll ? "Ver menos" : `Ver todos (${historico.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayHistorico.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${getAcaoColor(log.acao)}`}
            >
              {getAcaoLabel(log.acao)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{log.entidade}</span>
                {log.diff && Object.keys(log.diff).length > 0 && (
                  <span className="text-muted-foreground ml-2">
                    ({Object.keys(log.diff).length} campo(s) alterado(s))
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {log.userEmail && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.userEmail}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

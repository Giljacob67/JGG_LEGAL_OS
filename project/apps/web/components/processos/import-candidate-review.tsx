"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Scale,
  User,
  GitCompare,
} from "lucide-react";
import { formatCNJ } from "@/lib/process-import/cnj-utils";
import Link from "next/link";

interface NormalizedData {
  cnj?: string;
  tribunal?: string;
  classe?: string;
  assunto?: string;
  orgaoJulgador?: string;
  situacao?: string;
  distribuicao?: string;
  valorCausa?: number;
  movimentos?: Array<{ data: string; evento: string; descricao: string }>;
}

interface Candidate {
  id: string;
  cnj: string;
  fonte: string;
  tribunal?: string;
  status: string;
  scoreConfianca?: number;
  dadosNormalizados?: NormalizedData;
  dadosRaw?: unknown;
  conflitoComId?: string;
  processoId?: string;
  motivoRejeicao?: string;
  createdAt: string;
  job?: { id: string; tipo: string; fonte?: string };
}

interface ExistingProcesso {
  id: string;
  cnj: string;
  tribunal?: string;
  classe?: string;
  assunto?: string;
  vara?: string;
  distribuicao?: string;
  status: string;
  area: string;
  cliente?: { id: string; nome: string };
  responsavel?: { id: string; nome: string };
}

interface ClienteOption {
  id: string;
  nome: string;
}

interface ImportCandidateReviewProps {
  candidate: Candidate;
  onClose: () => void;
  onUpdated: () => void;
}

function ComparisonRow({
  label,
  icon: Icon,
  external,
  existing,
  isDiff,
}: {
  label: string;
  icon: React.ElementType;
  external?: string | null;
  existing?: string | null;
  isDiff?: boolean;
}) {
  const hasDiff = isDiff ?? (external !== existing && external && existing);
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          <Icon size={13} className="text-muted-foreground/70" />
          {label}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm">
        {external || <span className="text-muted-foreground/50">—</span>}
      </td>
      <td className="px-4 py-2.5 text-sm">
        {existing || <span className="text-muted-foreground/50">—</span>}
      </td>
      <td className="px-4 py-2.5 text-center">
        {hasDiff ? (
          <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
            <AlertTriangle size={12} />
            Diferente
          </span>
        ) : external && existing ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
            <CheckCircle size={12} />
            Igual
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

const statusLabels: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-emerald-100 text-emerald-700" },
  duplicado: { label: "Duplicado", className: "bg-amber-100 text-amber-700" },
  conflito: { label: "Conflito", className: "bg-orange-100 text-orange-700" },
  aprovado: { label: "Aprovado", className: "bg-blue-100 text-blue-700" },
  rejeitado: { label: "Rejeitado", className: "bg-gray-100 text-gray-600" },
  erro: { label: "Erro", className: "bg-red-100 text-red-700" },
};

export function ImportCandidateReview({
  candidate,
  onClose,
  onUpdated,
}: ImportCandidateReviewProps) {
  const [existingProcesso, setExistingProcesso] = useState<ExistingProcesso | null>(null);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dados = candidate.dadosNormalizados;
  const isFinal = ["aprovado", "rejeitado"].includes(candidate.status);
  const isDuplicate = candidate.status === "duplicado";
  const isNew = candidate.status === "novo";
  const isError = candidate.status === "erro";

  // Fetch existing process if duplicate
  useEffect(() => {
    if (candidate.conflitoComId) {
      fetch(`/api/v1/processes/${candidate.conflitoComId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.id) setExistingProcesso(data);
        })
        .catch(() => {});
    }
  }, [candidate.conflitoComId]);

  // Fetch clientes for new processes
  useEffect(() => {
    if (isNew) {
      fetch("/api/v1/clients?limit=100")
        .then((r) => r.json())
        .then((data) => {
          if (data.data) setClientes(data.data);
        })
        .catch(() => {});
    }
  }, [isNew]);

  async function handleApprove() {
    if (isNew && !selectedCliente) {
      setError("Selecione um cliente para vincular ao novo processo.");
      return;
    }

    setApproving(true);
    setError("");

    try {
      const res = await fetch(
        `/api/v1/process-import/candidates/${candidate.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clienteId: selectedCliente || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao aprovar importação");
      } else {
        setSuccess("Candidato aprovado com sucesso!");
        onUpdated();
      }
    } catch {
      setError("Falha de conexão ao aprovar");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectMotivo.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }

    setRejecting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/v1/process-import/candidates/${candidate.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo: rejectMotivo }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao rejeitar");
      } else {
        setSuccess("Candidato rejeitado.");
        onUpdated();
      }
    } catch {
      setError("Falha de conexão ao rejeitar");
    } finally {
      setRejecting(false);
    }
  }

  const statusInfo = statusLabels[candidate.status] || {
    label: candidate.status,
    className: "bg-gray-100 text-gray-600",
  };

  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("pt-BR");
    } catch {
      return d;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-muted-foreground" />
                Revisão de Candidato
              </h2>
              <p className="text-xs text-muted-foreground">
                CNJ: <span className="font-mono">{formatCNJ(candidate.cnj)}</span>
                {candidate.job && (
                  <span className="ml-2">· Job: {candidate.job.tipo}</span>
                )}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Status messages */}
          {error && (
            <div className="text-sm text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-md">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-700 flex items-center gap-2 bg-emerald-100 p-3 rounded-md">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {isError && candidate.motivoRejeicao && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
              <p className="font-medium mb-1">Erro na busca:</p>
              <p>{candidate.motivoRejeicao}</p>
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Fonte</div>
              <div className="text-sm font-medium">{candidate.fonte}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Tribunal</div>
              <div className="text-sm font-medium">{candidate.tribunal?.toUpperCase() || "—"}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Confiança</div>
              <div className="text-sm font-medium">
                {candidate.scoreConfianca != null
                  ? `${(candidate.scoreConfianca * 100).toFixed(0)}%`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Criado em</div>
              <div className="text-sm font-medium">{formatDate(candidate.createdAt) || "—"}</div>
            </div>
          </div>

          {/* Comparison Table */}
          {dados && (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 border-b">
                <h3 className="text-sm font-medium">Comparação de Dados</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide w-36">
                        Campo
                      </th>
                      <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                        Fonte Externa
                      </th>
                      <th className="text-left px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                        Escritório
                      </th>
                      <th className="text-center px-4 py-2 text-[11px] text-muted-foreground uppercase tracking-wide w-24">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      label="CNJ"
                      icon={FileText}
                      external={formatCNJ(candidate.cnj)}
                      existing={existingProcesso ? formatCNJ(existingProcesso.cnj) : undefined}
                    />
                    <ComparisonRow
                      label="Tribunal"
                      icon={Building2}
                      external={dados.tribunal?.toUpperCase()}
                      existing={existingProcesso?.tribunal?.toUpperCase()}
                    />
                    <ComparisonRow
                      label="Classe"
                      icon={Scale}
                      external={dados.classe}
                      existing={existingProcesso?.classe}
                    />
                    <ComparisonRow
                      label="Assunto"
                      icon={FileText}
                      external={dados.assunto}
                      existing={existingProcesso?.assunto}
                    />
                    <ComparisonRow
                      label="Órgão Julgador"
                      icon={Building2}
                      external={dados.orgaoJulgador}
                      existing={existingProcesso?.vara}
                    />
                    <ComparisonRow
                      label="Ajuizamento"
                      icon={Calendar}
                      external={formatDate(dados.distribuicao)}
                      existing={formatDate(existingProcesso?.distribuicao)}
                    />
                    <ComparisonRow
                      label="Situação"
                      icon={AlertTriangle}
                      external={dados.situacao}
                      existing={existingProcesso?.status}
                    />
                    {existingProcesso?.cliente && (
                      <ComparisonRow
                        label="Cliente"
                        icon={User}
                        external="—"
                        existing={existingProcesso.cliente.nome}
                      />
                    )}
                    {existingProcesso?.responsavel && (
                      <ComparisonRow
                        label="Responsável"
                        icon={User}
                        external="—"
                        existing={existingProcesso.responsavel.nome}
                      />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Movimentos preview */}
          {dados?.movimentos && dados.movimentos.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between">
                <h3 className="text-sm font-medium">Movimentações encontradas</h3>
                <span className="text-xs text-muted-foreground">
                  {dados.movimentos.length} movimentação(ões)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {dados.movimentos.slice(0, 20).map((mov, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap w-24">
                          {formatDate(mov.data) || "—"}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <span className="font-medium">{mov.evento}</span>
                          {mov.descricao !== mov.evento && (
                            <span className="text-muted-foreground ml-1">
                              — {mov.descricao.slice(0, 150)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {dados.movimentos.length > 20 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-xs text-muted-foreground text-center">
                          ... e mais {dados.movimentos.length - 20} movimentações
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejection reason if already rejected */}
          {candidate.status === "rejeitado" && candidate.motivoRejeicao && (
            <div className="rounded-lg border p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Motivo da rejeição</p>
              <p className="text-sm">{candidate.motivoRejeicao}</p>
            </div>
          )}

          {/* Actions */}
          {!isFinal && !isError && !success && (
            <div className="border-t pt-5 space-y-4">
              {/* Duplicate warning */}
              {isDuplicate && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Este processo já existe no escritório.</p>
                    <p className="text-xs mt-0.5">
                      Ao aprovar, os metadados públicos (classe, assunto, vara) serão preenchidos onde
                      estiverem vazios e os andamentos novos serão importados. Campos estratégicos
                      (tese, estratégia, risco, etc.) <strong>nunca</strong> serão sobrescritos.
                    </p>
                    {existingProcesso && (
                      <Link
                        href={`/processos-v2/${existingProcesso.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                      >
                        <ExternalLink size={12} />
                        Abrir processo existente
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Client selection for new */}
              {isNew && (
                <div className="max-w-md">
                  <label className="block text-sm font-medium mb-1.5">
                    Vincular a qual Cliente? *
                  </label>
                  <select
                    value={selectedCliente}
                    onChange={(e) => setSelectedCliente(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                  <label className="block text-sm font-medium">Motivo da rejeição *</label>
                  <textarea
                    value={rejectMotivo}
                    onChange={(e) => setRejectMotivo(e.target.value)}
                    className="w-full min-h-[80px] p-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    placeholder="Ex: CNJ incorreto, processo já importado por outra via, dados inconsistentes..."
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReject}
                      disabled={rejecting || !rejectMotivo.trim()}
                    >
                      {rejecting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                      Confirmar rejeição
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 justify-end">
                {!showRejectForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Rejeitar
                  </Button>
                )}
                <Button
                  onClick={handleApprove}
                  disabled={approving || (isNew && !selectedCliente)}
                >
                  {approving ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                  )}
                  {isDuplicate ? "Aprovar e Atualizar" : "Aprovar Importação"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

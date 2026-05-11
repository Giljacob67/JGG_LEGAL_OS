"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Database, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

interface Assunto {
  nome?: string;
}

interface NormalizedProcess {
  cnj: string;
  fonte: string;
  tribunal?: string;
  classe?: string;
  assunto?: string;
  tipo?: string;
  orgaoJulgador?: string;
  situacao?: string;
  distribuicao?: string;
}

interface CandidateResultado {
  id: string;
  cnj: string;
  fonte: string;
  tribunal?: string;
  status: string;
  dadosNormalizados?: NormalizedProcess;
  conflitoComId?: string;
  processoId?: string;
}

export function BuscaCNJ() {
  const router = useRouter();
  const [cnj, setCnj] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CandidateResultado | null>(null);
  const [erro, setErro] = useState("");
  
  // Para aprovação
  const [clientes, setClientes] = useState<{id: string, nome: string}[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (resultado && resultado.status === "novo") {
      fetch("/api/v1/clients?limit=100")
        .then(res => res.json())
        .then(data => {
          if (data.data) setClientes(data.data);
        })
        .catch(() => {});
    }
  }, [resultado]);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!cnj.trim()) return;
    setLoading(true);
    setErro("");
    setResultado(null);

    try {
      const res = await fetch(`/api/v1/process-import/candidates/from-cnj`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnj, fonte: "datajud_public" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro na busca");
      } else {
        setResultado(data);
      }
    } catch {
      setErro("Falha de conexao");
    } finally {
      setLoading(false);
    }
  }

  async function handleAprovar() {
    if (!resultado) return;
    if (resultado.status === "novo" && !selectedCliente) {
      setErro("Selecione um cliente para vincular ao novo processo.");
      return;
    }

    setApproving(true);
    setErro("");

    try {
      const res = await fetch(`/api/v1/process-import/candidates/${resultado.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: selectedCliente || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao aprovar importação");
      } else {
        setResultado({ ...resultado, status: "aprovado", processoId: data.processoId });
        router.refresh();
      }
    } catch {
      setErro("Falha de conexao ao aprovar");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <form onSubmit={handleBuscar} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={cnj}
            onChange={(e) => setCnj(e.target.value)}
            placeholder="Digite o numero CNJ para buscar no DataJud..."
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
          Buscar DataJud
        </button>
      </form>

      {erro && (
        <div className="mt-3 text-sm text-destructive flex items-center gap-2 bg-destructive/10 p-3 rounded-md">
          <AlertCircle size={16} />
          {erro}
        </div>
      )}

      {resultado && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border text-sm relative">
          <div className="absolute top-4 right-4">
            {resultado.status === "novo" && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Novo</span>}
            {resultado.status === "duplicado" && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">Duplicado</span>}
            {resultado.status === "aprovado" && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1"><CheckCircle size={12} /> Aprovado</span>}
            {resultado.status === "erro" && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">Erro</span>}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono font-medium text-foreground text-lg">{resultado.cnj}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)]">
              {resultado.fonte.toUpperCase()} {resultado.tribunal && `- ${resultado.tribunal.toUpperCase()}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground mt-4 mb-4 bg-background p-3 rounded border">
            <p><b className="text-foreground">Classe:</b> {resultado.dadosNormalizados?.classe || "-"}</p>
            <p><b className="text-foreground">Assunto:</b> {resultado.dadosNormalizados?.assunto || "-"}</p>
            <p><b className="text-foreground">Órgão Julgador:</b> {resultado.dadosNormalizados?.orgaoJulgador || "-"}</p>
            <p><b className="text-foreground">Situação:</b> {resultado.dadosNormalizados?.situacao || "-"}</p>
            <p><b className="text-foreground">Ajuizamento:</b> {resultado.dadosNormalizados?.distribuicao ? new Date(resultado.dadosNormalizados.distribuicao).toLocaleDateString("pt-BR") : "-"}</p>
          </div>

          {resultado.status !== "aprovado" && resultado.status !== "erro" && (
            <div className="mt-4 pt-4 border-t flex flex-wrap items-end gap-3">
              {resultado.status === "novo" && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium mb-1">Vincular a qual Cliente?</label>
                  <select 
                    value={selectedCliente} 
                    onChange={e => setSelectedCliente(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {resultado.status === "duplicado" && (
                <div className="flex-1 text-sm text-amber-700">
                  <AlertCircle size={16} className="inline mr-1" />
                  Este processo já existe no sistema. Ao aprovar, os metadados do DataJud serão atualizados.
                </div>
              )}

              <button 
                onClick={handleAprovar}
                disabled={approving || (resultado.status === "novo" && !selectedCliente)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity ml-auto"
              >
                {approving ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                Aprovar Importação
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
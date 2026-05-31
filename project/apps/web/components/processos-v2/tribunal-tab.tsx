"use client";

import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  Megaphone,
  FileText,
  Scale,
  Building2,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";
import { formatCurrency } from "@/lib/utils/formatters";

interface Movimento {
  data: string;
  evento: string;
  descricao: string;
  isNovo: boolean;
  tipo?: string;
}

interface DadosProcesso {
  classe?: string;
  assunto?: string;
  orgaoJulgador?: string;
  situacao?: string;
  distribuicao?: string;
  valorCausa?: number;
}

interface TribunalResult {
  encontrado: boolean;
  fonte: string;
  cnj: string;
  tribunalEncontrado?: string;
  scoreConfianca?: number;
  dadosProcesso?: DadosProcesso;
  movimentos?: {
    total: number;
    novos: number;
    jaImportados: number;
    lista: Movimento[];
  };
  erro?: string;
}

interface TribunalTabProps {
  processoId: string;
  cnj: string;
  tribunal?: string | null;
}

const TIPO_BADGE: Record<string, { label: string; color: string; icon: typeof Megaphone }> = {
  intimacao:  { label: "Intimação",   color: "bg-orange-50 text-orange-700 border-orange-200", icon: Megaphone },
  sentenca:   { label: "Sentença",    color: "bg-purple-50 text-purple-700 border-purple-200", icon: Scale },
  despacho:   { label: "Despacho",    color: "bg-blue-50 text-blue-700 border-blue-200",       icon: FileText },
  publicacao: { label: "Publicação",  color: "bg-slate-50 text-slate-700 border-slate-200",    icon: FileText },
};

function inferirTipoCliente(evento: string): string {
  const ev = evento.toLowerCase();
  if (ev.includes("intim") || ev.includes("vista") || ev.includes("citaç")) return "intimacao";
  if (ev.includes("sentenç") || ev.includes("acórdão") || ev.includes("decisão")) return "sentenca";
  if (ev.includes("despacho")) return "despacho";
  if (ev.includes("diário") || ev.includes("publicaç") || ev.includes("dje")) return "publicacao";
  return "andamento";
}

export function TribunalTab({ processoId, cnj, tribunal }: TribunalTabProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<TribunalResult | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  const consultar = async () => {
    setLoading(true);
    setResult(null);
    setSelecionados(new Set());
    setImportSuccess(null);
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/tribunal`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        // Pré-selecionar apenas os novos
        if (data.movimentos?.lista) {
          const novosIdx = data.movimentos.lista
            .map((m: Movimento, i: number) => (m.isNovo ? i : -1))
            .filter((i: number) => i >= 0);
          setSelecionados(new Set(novosIdx));
        }
      }
    } catch {
      setResult({ encontrado: false, erro: "Erro de conexão ao consultar o tribunal.", fonte: "datajud_public", cnj });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecionado = (idx: number) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selecionarTodosNovos = () => {
    if (!result?.movimentos?.lista) return;
    const novosIdx = result.movimentos.lista
      .map((m, i) => (m.isNovo ? i : -1))
      .filter((i) => i >= 0);
    setSelecionados(new Set(novosIdx));
  };

  const importarSelecionados = async () => {
    if (!result?.movimentos?.lista || selecionados.size === 0) return;
    setImporting(true);
    try {
      const movs = Array.from(selecionados).map((idx) => ({
        ...result.movimentos!.lista[idx],
        tipo: inferirTipoCliente(result.movimentos!.lista[idx].evento),
      }));
      const res = await fetch(`/api/v1/processes/${processoId}/tribunal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movimentos: movs,
          fonte: result.fonte,
          tribunalEncontrado: result.tribunalEncontrado,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setImportSuccess(data.importados);
        // Marcar como já importados localmente
        setSelecionados(new Set());
        setResult((prev) => {
          if (!prev?.movimentos) return prev;
          const lista = prev.movimentos.lista.map((m, i) =>
            selecionados.has(i) ? { ...m, isNovo: false } : m
          );
          return {
            ...prev,
            movimentos: {
              ...prev.movimentos,
              lista,
              novos: prev.movimentos.novos - data.importados,
              jaImportados: prev.movimentos.jaImportados + data.importados,
            },
          };
        });
      }
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Cabeçalho + botão consultar */}
      <SectionCard title="Consulta ao Tribunal">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              Consulta o DataJud (CNJ) para obter andamentos atualizados diretamente do tribunal.
              {tribunal && (
                <span className="ml-1 inline-flex items-center gap-1 text-foreground font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  {tribunal}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">CNJ: <span className="font-mono">{cnj}</span></p>
          </div>
          <Button onClick={consultar} disabled={loading} className="shrink-0">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-1.5" />
            )}
            {loading ? "Consultando..." : "Consultar tribunal"}
          </Button>
        </div>

        {/* Resultado da consulta */}
        {result && !loading && (
          <div className="mt-4">
            {!result.encontrado ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Processo não encontrado no DataJud</p>
                  {result.erro && <p className="text-xs text-amber-700 mt-0.5">{result.erro}</p>}
                  <p className="text-xs text-amber-600 mt-1">
                    Pode estar em sistema fechado (PJe, eSAJ, Projudi) que requer credenciais.
                    Utilize a aba "Monitoramento" para configurar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Dados do processo */}
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium text-emerald-800">
                      Encontrado em {result.tribunalEncontrado?.replace("api_publica_", "").toUpperCase()}
                    </p>
                  </div>
                  {result.dadosProcesso && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-emerald-800">
                      {result.dadosProcesso.classe && (
                        <span className="flex items-center gap-1">
                          <Scale className="w-3 h-3 shrink-0" />{result.dadosProcesso.classe}
                        </span>
                      )}
                      {result.dadosProcesso.orgaoJulgador && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 shrink-0" />{result.dadosProcesso.orgaoJulgador}
                        </span>
                      )}
                      {result.dadosProcesso.distribuicao && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 shrink-0" />
                          Dist. {new Date(result.dadosProcesso.distribuicao).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {result.dadosProcesso.situacao && (
                        <span className="flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />{result.dadosProcesso.situacao}
                        </span>
                      )}
                      {result.dadosProcesso.valorCausa != null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 shrink-0" />
                          {formatCurrency(result.dadosProcesso.valorCausa)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Resumo de movimentos */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{result.movimentos?.total || 0}</strong> movimentos totais
                  </span>
                  <span className="text-emerald-600 font-medium">
                    <strong>{result.movimentos?.novos || 0}</strong> novos para importar
                  </span>
                  <span className="text-muted-foreground/60 text-xs">
                    {result.movimentos?.jaImportados || 0} já importados
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {importSuccess != null && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-sm text-emerald-800 font-medium">
              {importSuccess} andamento{importSuccess !== 1 ? "s" : ""} importado{importSuccess !== 1 ? "s" : ""} com sucesso.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Lista de andamentos com diff */}
      {result?.encontrado && result.movimentos && result.movimentos.lista.length > 0 && (
        <SectionCard title={`Andamentos do tribunal (${result.movimentos.lista.length})`}>
          {/* Toolbar de seleção */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{selecionados.size}</strong> selecionados para importar
              </span>
              <button
                onClick={selecionarTodosNovos}
                className="text-xs text-[#1e3a5f] hover:underline"
              >
                Selecionar novos
              </button>
              <button
                onClick={() => setSelecionados(new Set())}
                className="text-xs text-muted-foreground hover:underline"
              >
                Limpar
              </button>
            </div>
            <Button
              size="sm"
              onClick={importarSelecionados}
              disabled={selecionados.size === 0 || importing}
            >
              {importing ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1" />
              )}
              Importar selecionados ({selecionados.size})
            </Button>
          </div>

          {/* Timeline do tribunal */}
          <div className="space-y-2">
            {result.movimentos.lista.map((mov, idx) => {
              const tipoDetectado = inferirTipoCliente(mov.evento);
              const tipoCfg = TIPO_BADGE[tipoDetectado];
              const isSelected = selecionados.has(idx);
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-[#1e3a5f]/30 bg-[#1e3a5f]/5"
                      : mov.isNovo
                      ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60"
                      : "border-muted bg-muted/10 opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={isSelected}
                    onChange={() => toggleSelecionado(idx)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-medium text-muted-foreground">{formatDate(mov.data)}</span>
                      {mov.isNovo && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Novo
                        </span>
                      )}
                      {tipoCfg && tipoDetectado !== "andamento" && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${tipoCfg.color}`}>
                          {tipoDetectado === "intimacao" && <Megaphone className="w-3 h-3" />}
                          {tipoCfg.label}
                        </span>
                      )}
                      {!mov.isNovo && (
                        <span className="text-[10px] text-muted-foreground/50">já importado</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{mov.evento}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mov.descricao}</p>
                  </div>
                  {tipoDetectado === "intimacao" && mov.isNovo && (
                    <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  )}
                </label>
              );
            })}
          </div>

          {result.movimentos.lista.length === 100 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Exibindo os 100 mais recentes. O DataJud pode ter mais andamentos históricos.
            </p>
          )}
        </SectionCard>
      )}
    </div>
  );
}

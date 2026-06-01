"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, AlertCircle, Lightbulb, TrendingUp,
  Target, Clock, Eye, RefreshCw, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

interface ProcessoAIAnalysisProps {
  processoId: string;
  cnj: string;
  andamentos?: unknown[];
}

interface AIAnalysis {
  resumo: string;
  situacao?: string;
  riscos: string[];
  oportunidades?: string[];
  sugestoes: string[];
  proximosPassos: string[];
  prazosCriticos?: string[];
  observacaoIA?: string;
  andamentosAnalisados?: number;
  classificacao: {
    complexidade: "baixa" | "media" | "alta";
    urgencia: "baixa" | "media" | "alta";
    probabilidadeSucesso: number;
  };
}

const COMPLEXIDADE_COLOR = { baixa: "text-emerald-600 bg-emerald-50", media: "text-orange-600 bg-orange-50", alta: "text-red-600 bg-red-50" };
const URGENCIA_COLOR = { baixa: "text-slate-600 bg-slate-50", media: "text-amber-600 bg-amber-50", alta: "text-red-600 bg-red-50" };
const SITUACAO_COLOR: Record<string, string> = {
  ativa: "bg-blue-50 text-blue-700",
  aguardando: "bg-slate-50 text-slate-700",
  risco: "bg-red-50 text-red-700",
  favoravel: "bg-emerald-50 text-emerald-700",
  encerrada: "bg-gray-50 text-gray-600",
};

export function ProcessoAIAnalysis({ processoId }: ProcessoAIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/ai-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar análise");
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  if (!analysis && !loading) {
    return (
      <SectionCard title="Análise IA — Claude">
        <div className="text-center py-10">
          <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-400" />
          <p className="text-sm text-muted-foreground mb-1 max-w-sm mx-auto">
            Análise estratégica do processo usando Claude, com base nos andamentos importados.
          </p>
          <p className="text-xs text-muted-foreground/60 mb-5">
            Requer andamentos importados do tribunal.
          </p>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4 max-w-sm mx-auto">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <Button onClick={generateAnalysis} className="bg-purple-600 hover:bg-purple-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar análise com Claude
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (loading) {
    return (
      <SectionCard title="Análise IA — Claude">
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-purple-600" />
          <p className="text-sm text-muted-foreground">Analisando processo com Claude...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Pode levar até 30 segundos</p>
        </div>
      </SectionCard>
    );
  }

  if (!analysis) return null;

  const prob = analysis.classificacao.probabilidadeSucesso;
  const probColor = prob >= 65 ? "text-emerald-600" : prob >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-4">
      {/* Header com situação + regenerar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-foreground">Análise Claude</span>
          {analysis.andamentosAnalisados && (
            <span className="text-xs text-muted-foreground">· {analysis.andamentosAnalisados} andamentos</span>
          )}
          {analysis.situacao && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SITUACAO_COLOR[analysis.situacao] ?? "bg-slate-50 text-slate-600"}`}>
              {analysis.situacao}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={generateAnalysis} className="h-7 text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Reanalisar
        </Button>
      </div>

      {/* Resumo */}
      <SectionCard title="Resumo executivo">
        <p className="text-sm text-foreground leading-relaxed">{analysis.resumo}</p>
      </SectionCard>

      {/* Classificação */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-3 rounded-lg border text-center ${COMPLEXIDADE_COLOR[analysis.classificacao.complexidade]}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">Complexidade</p>
          <p className="text-sm font-bold capitalize">{analysis.classificacao.complexidade}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${URGENCIA_COLOR[analysis.classificacao.urgencia]}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">Urgência</p>
          <p className="text-sm font-bold capitalize">{analysis.classificacao.urgencia}</p>
        </div>
        <div className="p-3 rounded-lg border text-center bg-slate-50">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-muted-foreground">Prob. Êxito</p>
          <p className={`text-xl font-bold ${probColor}`}>{prob}%</p>
        </div>
      </div>

      {/* Grid de listas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Riscos */}
        {analysis.riscos.length > 0 && (
          <SectionCard title="Riscos identificados">
            <ul className="space-y-2">
              {analysis.riscos.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Oportunidades */}
        {analysis.oportunidades && analysis.oportunidades.length > 0 && (
          <SectionCard title="Pontos favoráveis">
            <ul className="space-y-2">
              {analysis.oportunidades.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                  {o}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Sugestões */}
        {analysis.sugestoes.length > 0 && (
          <SectionCard title="Sugestões estratégicas">
            <ul className="space-y-2">
              {analysis.sugestoes.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Próximos passos */}
        {analysis.proximosPassos.length > 0 && (
          <SectionCard title="Próximos passos">
            <ol className="space-y-2">
              {analysis.proximosPassos.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ol>
          </SectionCard>
        )}
      </div>

      {/* Prazos críticos */}
      {analysis.prazosCriticos && analysis.prazosCriticos.length > 0 && (
        <SectionCard title="Prazos críticos detectados">
          <ul className="space-y-2">
            {analysis.prazosCriticos.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0 text-orange-500 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Observação IA */}
      {analysis.observacaoIA && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50">
          <Eye className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-1">Observação estratégica</p>
            <p className="text-sm text-purple-900">{analysis.observacaoIA}</p>
          </div>
        </div>
      )}
    </div>
  );
}

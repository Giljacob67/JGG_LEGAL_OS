"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcessoAIAnalysisProps {
  processoId: string;
  cnj: string;
  andamentos: any[];
}

interface AIAnalysis {
  resumo: string;
  riscos: string[];
  sugestoes: string[];
  proximosPassos: string[];
  classificacao: {
    complexidade: "baixa" | "media" | "alta";
    urgencia: "baixa" | "media" | "alta";
    probabilidadeSucesso: number;
  };
}

export function ProcessoAIAnalysis({ processoId, cnj, andamentos }: ProcessoAIAnalysisProps) {
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
        body: JSON.stringify({ andamentos }),
      });

      if (!res.ok) {
        throw new Error("Erro ao gerar análise");
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Análise com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !loading && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              Gere uma análise inteligente do processo com insights e recomendações
            </p>
            <Button onClick={generateAnalysis} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Análise
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">
              Analisando {andamentos.length} andamentos...
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Resumo */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Resumo do Processo</h4>
              <p className="text-sm text-muted-foreground">{analysis.resumo}</p>
            </div>

            {/* Classificação */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Complexidade</div>
                <Badge variant={analysis.classificacao.complexidade === "alta" ? "destructive" : "outline"}>
                  {analysis.classificacao.complexidade}
                </Badge>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Urgência</div>
                <Badge variant={analysis.classificacao.urgencia === "alta" ? "destructive" : "outline"}>
                  {analysis.classificacao.urgencia}
                </Badge>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Prob. Sucesso</div>
                <div className="text-lg font-bold text-green-700">
                  {analysis.classificacao.probabilidadeSucesso}%
                </div>
              </div>
            </div>

            {/* Riscos */}
            {analysis.riscos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Riscos Identificados
                </h4>
                <ul className="space-y-1">
                  {analysis.riscos.map((risco, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      {risco}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sugestões */}
            {analysis.sugestoes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Sugestões
                </h4>
                <ul className="space-y-1">
                  {analysis.sugestoes.map((sugestao, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      {sugestao}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Próximos Passos */}
            {analysis.proximosPassos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Próximos Passos Recomendados
                </h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {analysis.proximosPassos.map((passo, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {passo}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Botão para regenerar */}
            <Button onClick={generateAnalysis} variant="outline" size="sm" className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Nova Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoComparacao {
  id: string;
  cnj: string;
  cliente: { nome: string };
  responsavel: { nome: string };
  status: string;
  area: string;
  tribunal: string | null;
  vara: string | null;
  valorCausa: number | null;
  distribuicao: string | null;
  metricas: {
    diasDesdeDistribuicao: number | null;
    diasDesdeUltimoAndamento: number | null;
    totalAndamentos: number;
    andamentosCriticos: number;
    totalPrazos: number;
    prazosCumpridos: number;
    prazosPendentes: number;
    prazosPerdidos: number;
    totalDocumentos: number;
    totalHonorarios: number;
  };
}

export function ComparadorProcessos() {
  const [processoIds, setProcessoIds] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [comparacao, setComparacao] = useState<ProcessoComparacao[] | null>(null);

  async function comparar() {
    setLoading(true);
    try {
      const idsFiltrados = processoIds.filter((id) => id.trim() !== "");
      const response = await fetch("/api/v1/reports/comparador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processoIds: idsFiltrados }),
      });
      const data = await response.json();
      setComparacao(data.processos);
    } catch (error) {
      console.error("Erro ao comparar processos:", error);
    } finally {
      setLoading(false);
    }
  }

  function adicionarCampo() {
    if (processoIds.length < 3) {
      setProcessoIds([...processoIds, ""]);
    }
  }

  function removerCampo(index: number) {
    if (processoIds.length > 2) {
      setProcessoIds(processoIds.filter((_, i) => i !== index));
    }
  }

  function atualizarId(index: number, value: string) {
    const novos = [...processoIds];
    novos[index] = value;
    setProcessoIds(novos);
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Processos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Comparar Processos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {processoIds.map((id, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => atualizarId(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder={`ID do Processo ${index + 1}`}
                />
                {processoIds.length > 2 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removerCampo(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {processoIds.length < 3 && (
              <Button variant="outline" onClick={adicionarCampo}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Processo
              </Button>
            )}
            <Button
              onClick={comparar}
              disabled={loading || processoIds.filter((id) => id.trim()).length < 2}
            >
              {loading ? "Comparando..." : "Comparar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Comparação */}
      {comparacao && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Processos</CardTitle>
            <p className="text-sm text-muted-foreground">
              {comparacao.length} processos comparados
            </p>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${comparacao.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {comparacao.map((processo, index) => (
                <div key={processo.id} className="space-y-4">
                  {/* Cabeçalho */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-bold text-lg mb-1">Processo {index + 1}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{processo.cnj}</p>
                    <Badge className="mt-2">{processo.status}</Badge>
                  </div>

                  {/* Dados Básicos */}
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold">Dados Básicos</h4>
                    <dl className="space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Cliente:</dt>
                        <dd className="font-medium">{processo.cliente.nome}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Responsável:</dt>
                        <dd className="font-medium">{processo.responsavel.nome}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Área:</dt>
                        <dd className="font-medium">{processo.area}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Tribunal:</dt>
                        <dd className="font-medium">{processo.tribunal || "—"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Vara:</dt>
                        <dd className="font-medium">{processo.vara || "—"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Valor Causa:</dt>
                        <dd className="font-medium">R$ {processo.valorCausa || 0}</dd>
                      </div>
                      {processo.distribuicao && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Distribuição:</dt>
                          <dd className="font-medium">
                            {format(new Date(processo.distribuicao), "dd/MM/yyyy", { locale: ptBR })}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold">Métricas</h4>
                    <dl className="space-y-1">
                      {processo.metricas.diasDesdeDistribuicao !== null && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Dias desde distribuição:</dt>
                          <dd className="font-medium">{processo.metricas.diasDesdeDistribuicao}</dd>
                        </div>
                      )}
                      {processo.metricas.diasDesdeUltimoAndamento !== null && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Dias sem andamento:</dt>
                          <dd className={`font-medium ${processo.metricas.diasDesdeUltimoAndamento > 30 ? "text-red-600" : ""}`}>
                            {processo.metricas.diasDesdeUltimoAndamento}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total andamentos:</dt>
                        <dd className="font-medium">{processo.metricas.totalAndamentos}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Andamentos críticos:</dt>
                        <dd className={`font-medium ${processo.metricas.andamentosCriticos > 0 ? "text-red-600" : ""}`}>
                          {processo.metricas.andamentosCriticos}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total documentos:</dt>
                        <dd className="font-medium">{processo.metricas.totalDocumentos}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total honorários:</dt>
                        <dd className="font-medium">R$ {processo.metricas.totalHonorarios}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Prazos */}
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold">Prazos</h4>
                    <dl className="space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total:</dt>
                        <dd className="font-medium">{processo.metricas.totalPrazos}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Cumpridos:</dt>
                        <dd className="font-medium text-green-600">{processo.metricas.prazosCumpridos}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Pendentes:</dt>
                        <dd className="font-medium text-orange-600">{processo.metricas.prazosPendentes}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Perdidos:</dt>
                        <dd className={`font-medium ${processo.metricas.prazosPerdidos > 0 ? "text-red-600" : ""}`}>
                          {processo.metricas.prazosPerdidos}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

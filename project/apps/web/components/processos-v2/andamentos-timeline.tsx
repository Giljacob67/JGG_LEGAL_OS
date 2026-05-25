"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

interface Andamento {
  id: string;
  data: string;
  evento: string;
  descricao: string;
  fonte: string;
  critico: boolean;
  createdAt: string;
}

interface AndamentosTimelineProps {
  processoId: string;
}

type FilterType = "todos" | "criticos" | "recentes";

export function AndamentosTimeline({ processoId }: AndamentosTimelineProps) {
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("todos");

  useEffect(() => {
    async function fetchAndamentos() {
      try {
        const res = await fetch(`/api/v1/processes/${processoId}/andamentos`);
        if (res.ok) {
          const data = await res.json();
          setAndamentos(data);
        }
      } catch (err) {
        console.error("Erro ao carregar andamentos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAndamentos();
  }, [processoId]);

  const filteredAndamentos = andamentos.filter((a) => {
    if (filter === "criticos") return a.critico;
    if (filter === "recentes") {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      return new Date(a.data) >= trintaDiasAtras;
    }
    return true;
  });

  // Agrupar andamentos por mês/ano
  const grouped = filteredAndamentos.reduce((acc, andamento) => {
    const date = new Date(andamento.data);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(andamento);
    return acc;
  }, {} as Record<string, Andamento[]>);

  const formatMonthYear = (key: string) => {
    const [year, month] = key.split("-");
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  if (loading) {
    return (
      <SectionCard title="Andamentos">
        <div className="flex items-center justify-center py-8">
          <Clock className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando andamentos...</span>
        </div>
      </SectionCard>
    );
  }

  if (andamentos.length === 0) {
    return (
      <SectionCard title="Andamentos">
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum andamento registrado</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Andamentos">
      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          <Button
            variant={filter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("todos")}
            className="h-7 text-xs"
          >
            Todos ({andamentos.length})
          </Button>
          <Button
            variant={filter === "criticos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("criticos")}
            className="h-7 text-xs"
          >
            Críticos ({andamentos.filter(a => a.critico).length})
          </Button>
          <Button
            variant={filter === "recentes" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("recentes")}
            className="h-7 text-xs"
          >
            Últimos 30 dias
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a)) // Mais recente primeiro
          .map(([monthKey, andamentosDoMes]) => (
            <div key={monthKey}>
              {/* Header do mês */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {formatMonthYear(monthKey)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Andamentos do mês */}
              <div className="space-y-3">
                {andamentosDoMes.map((andamento) => (
                  <div
                    key={andamento.id}
                    className={`relative pl-8 pb-3 border-l-2 ${
                      andamento.critico ? "border-red-400" : "border-muted"
                    }`}
                  >
                    {/* Ponto na timeline */}
                    <div
                      className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full ${
                        andamento.critico ? "bg-red-500" : "bg-muted-foreground/40"
                      }`}
                    />

                    {/* Conteúdo */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatDate(andamento.data)}
                          </span>
                          {andamento.critico && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3" />
                              Crítico
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase">
                          {andamento.fonte}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {andamento.evento}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {andamento.descricao}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {filteredAndamentos.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Nenhum andamento encontrado para o filtro selecionado
          </p>
        </div>
      )}
    </SectionCard>
  );
}

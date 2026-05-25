"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdvancedFiltersProps {
  filters: {
    tribunal?: string;
    vara?: string;
    dataDistribuicaoInicio?: string;
    dataDistribuicaoFim?: string;
    valorCausaMin?: string;
    valorCausaMax?: string;
    tags?: string[];
    clienteId?: string;
    responsavelId?: string;
  };
  onFiltersChange: (filters: AdvancedFiltersProps["filters"]) => void;
  clientes: Array<{ id: string; nome: string }>;
  responsaveis: Array<{ id: string; nome: string }>;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  clientes,
  responsaveis,
}: AdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ""
  );

  const handleClear = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: string, value: string | string[]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 mr-1" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-1" />
          )}
          Filtros avançados
        </Button>
        {hasActiveFilters && (
          <>
            <span className="text-xs text-muted-foreground">
              ({Object.values(filters).filter((v) =>
                Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ""
              ).length} ativo(s))
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg border">
          {/* Tribunal */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Tribunal
            </label>
            <input
              type="text"
              placeholder="Ex: TJSP, TRF1"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.tribunal || ""}
              onChange={(e) => updateFilter("tribunal", e.target.value)}
            />
          </div>

          {/* Vara/Órgão */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Vara/Órgão
            </label>
            <input
              type="text"
              placeholder="Ex: 1ª Vara Cível"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.vara || ""}
              onChange={(e) => updateFilter("vara", e.target.value)}
            />
          </div>

          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Cliente
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.clienteId || ""}
              onChange={(e) => updateFilter("clienteId", e.target.value)}
            >
              <option value="">Todos os clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Responsável
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.responsavelId || ""}
              onChange={(e) => updateFilter("responsavelId", e.target.value)}
            >
              <option value="">Todos os responsáveis</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data de Distribuição - Início */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Distribuição (de)
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.dataDistribuicaoInicio || ""}
              onChange={(e) =>
                updateFilter("dataDistribuicaoInicio", e.target.value)
              }
            />
          </div>

          {/* Data de Distribuição - Fim */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Distribuição (até)
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.dataDistribuicaoFim || ""}
              onChange={(e) =>
                updateFilter("dataDistribuicaoFim", e.target.value)
              }
            />
          </div>

          {/* Valor da Causa - Mínimo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Valor da causa (mínimo)
            </label>
            <input
              type="number"
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.valorCausaMin || ""}
              onChange={(e) => updateFilter("valorCausaMin", e.target.value)}
            />
          </div>

          {/* Valor da Causa - Máximo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Valor da causa (máximo)
            </label>
            <input
              type="number"
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.valorCausaMax || ""}
              onChange={(e) => updateFilter("valorCausaMax", e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-medium text-muted-foreground">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Ex: urgente, prioridade, audiência"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              value={filters.tags?.join(", ") || ""}
              onChange={(e) =>
                updateFilter(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

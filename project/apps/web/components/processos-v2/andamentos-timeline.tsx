"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle, FileText, Filter, Plus, ChevronDown, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

interface Andamento {
  id: string;
  data: string;
  evento: string;
  descricao: string;
  fonte: string;
  critico: boolean;
  tipo?: string;
  createdAt: string;
}

interface AndamentosTimelineProps {
  processoId: string;
}

type FilterType = "todos" | "criticos" | "intimacoes" | "manual" | "tribunal";

const TIPO_LABEL: Record<string, string> = {
  andamento: "",
  intimacao: "Intimação",
  sentenca: "Sentença",
  despacho: "Despacho",
  publicacao: "Publicação",
};

const TIPO_COLOR: Record<string, string> = {
  intimacao: "bg-orange-50 text-orange-700 border-orange-200",
  sentenca: "bg-purple-50 text-purple-700 border-purple-200",
  despacho: "bg-blue-50 text-blue-700 border-blue-200",
  publicacao: "bg-slate-50 text-slate-700 border-slate-200",
};

export function AndamentosTimeline({ processoId }: AndamentosTimelineProps) {
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("todos");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [novoAndamento, setNovoAndamento] = useState({
    data: new Date().toISOString().split("T")[0],
    evento: "",
    descricao: "",
    critico: false,
    tipo: "andamento" as const,
  });

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (filter === "criticos") params.set("criticos", "true");
    if (filter === "intimacoes") params.set("tipo", "intimacao");
    if (filter === "manual") params.set("fonte", "manual");
    if (filter === "tribunal") {
      // tribunal = qualquer fonte que não seja manual
    }
    return params;
  }, [filter]);

  const fetchAndamentos = useCallback(async () => {
    setLoading(true);
    setAndamentos([]);
    setNextCursor(null);
    try {
      const params = buildParams();
      const res = await fetch(`/api/v1/processes/${processoId}/andamentos?${params}`);
      if (res.ok) {
        const json = await res.json();
        setAndamentos(json.data);
        setNextCursor(json.nextCursor);
        setTotal(json.total);
      }
    } catch (err) {
      console.error("Erro ao carregar andamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [processoId, buildParams]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = buildParams();
      params.set("cursor", nextCursor);
      const res = await fetch(`/api/v1/processes/${processoId}/andamentos?${params}`);
      if (res.ok) {
        const json = await res.json();
        setAndamentos((prev) => [...prev, ...json.data]);
        setNextCursor(json.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAndamentos();
  }, [fetchAndamentos]);

  const handleSubmitAndamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAndamento.evento.trim() || !novoAndamento.descricao.trim()) {
      setFormError("Evento e descrição são obrigatórios.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/andamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAndamento),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNovoAndamento({ data: new Date().toISOString().split("T")[0], evento: "", descricao: "", critico: false, tipo: "andamento" });
        fetchAndamentos();
      } else {
        const err = await res.json();
        setFormError(err.error || "Erro ao registrar andamento.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Agrupar por mês/ano
  const grouped = andamentos.reduce((acc, andamento) => {
    const date = new Date(andamento.data);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(andamento);
    return acc;
  }, {} as Record<string, Andamento[]>);

  const formatMonthYear = (key: string) => {
    const [year, month] = key.split("-");
    const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "todos", label: `Todos (${total})` },
    { id: "criticos", label: `Críticos (${andamentos.filter((a) => a.critico).length})` },
    { id: "intimacoes", label: "Intimações" },
    { id: "manual", label: "Manuais" },
  ];

  if (loading) {
    return (
      <SectionCard title="Andamentos">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando andamentos...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={`Andamentos (${total})`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.id)}
              className="h-7 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm((v) => !v)} className="h-7 text-xs shrink-0">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Registrar
        </Button>
      </div>

      {/* Formulário de novo andamento */}
      {showAddForm && (
        <form onSubmit={handleSubmitAndamento} className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-3">
          <p className="text-sm font-medium text-foreground">Registrar andamento manual</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Data *</label>
              <input
                type="date"
                className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                value={novoAndamento.data}
                onChange={(e) => setNovoAndamento((p) => ({ ...p, data: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Tipo</label>
              <select
                className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                value={novoAndamento.tipo}
                onChange={(e) => setNovoAndamento((p) => ({ ...p, tipo: e.target.value as typeof novoAndamento.tipo }))}
              >
                <option value="andamento">Andamento geral</option>
                <option value="intimacao">Intimação</option>
                <option value="sentenca">Sentença/Acórdão</option>
                <option value="despacho">Despacho</option>
                <option value="publicacao">Publicação DJ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Evento *</label>
            <input
              type="text"
              placeholder="Ex: Petição inicial protocolada, Audiência realizada..."
              className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
              value={novoAndamento.evento}
              onChange={(e) => setNovoAndamento((p) => ({ ...p, evento: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Descrição *</label>
            <textarea
              placeholder="Detalhes do andamento..."
              rows={3}
              className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm resize-none"
              value={novoAndamento.descricao}
              onChange={(e) => setNovoAndamento((p) => ({ ...p, descricao: e.target.value }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={novoAndamento.critico}
              onChange={(e) => setNovoAndamento((p) => ({ ...p, critico: e.target.checked }))}
            />
            <span>Marcar como crítico (gera alerta)</span>
          </label>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Salvar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {andamentos.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum andamento encontrado</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthKey, items]) => (
                <div key={monthKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {formatMonthYear(monthKey)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-3">
                    {items.map((andamento) => {
                      const tipoLabel = andamento.tipo ? TIPO_LABEL[andamento.tipo] : "";
                      const tipoColor = andamento.tipo ? TIPO_COLOR[andamento.tipo] : "";
                      return (
                        <div
                          key={andamento.id}
                          className={`relative pl-8 pb-3 border-l-2 ${andamento.critico ? "border-red-400" : andamento.tipo === "intimacao" ? "border-orange-300" : "border-muted"}`}
                        >
                          <div
                            className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full ${andamento.critico ? "bg-red-500" : andamento.tipo === "intimacao" ? "bg-orange-400" : "bg-muted-foreground/40"}`}
                          />
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-muted-foreground">{formatDate(andamento.data)}</span>
                                {andamento.critico && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                                    <AlertTriangle className="w-3 h-3" />Crítico
                                  </span>
                                )}
                                {tipoLabel && (
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${tipoColor}`}>
                                    {andamento.tipo === "intimacao" && <Megaphone className="w-3 h-3" />}
                                    {tipoLabel}
                                  </span>
                                )}
                                {andamento.fonte === "manual" && (
                                  <span className="text-[10px] text-muted-foreground/60 border rounded px-1">manual</span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground/60 uppercase shrink-0">{andamento.fonte !== "manual" ? andamento.fonte : ""}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{andamento.evento}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{andamento.descricao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          {nextCursor && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                Carregar mais
              </Button>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
